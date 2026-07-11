import AsyncStorage from '@react-native-async-storage/async-storage';

import { normalizeAnchorText } from '@/lib/ocr-parser';
import type { BowserNumericField, LearnedAnchor, LearnedAnchors } from '@/types/fuel';

// When the user saves a fill, each confirmed figure is located in the raw OCR
// text and the label text near it is remembered as an "anchor" for that field.
// Corrections teach the parser labels it didn't know; unchanged saves
// reinforce anchors that already work. parseBowserText tries anchors (by hit
// count) before its built-in heuristics, so recognition of the bowsers this
// user actually visits improves with every save.

const ANCHORS_KEY = 'bowser-wonder:ocr-learned-anchors';
const MAX_ANCHORS_PER_FIELD = 12;
const MIN_ANCHOR_LENGTH = 3;

const NUMERIC_FIELDS: BowserNumericField[] = ['pricePerLitre', 'litres', 'totalPrice'];

export function emptyLearnedAnchors(): LearnedAnchors {
  return { pricePerLitre: [], litres: [], totalPrice: [] };
}

export async function getLearnedAnchors(): Promise<LearnedAnchors> {
  try {
    const raw = await AsyncStorage.getItem(ANCHORS_KEY);
    if (!raw) {
      return emptyLearnedAnchors();
    }
    const parsed = JSON.parse(raw) as Partial<LearnedAnchors>;
    return {
      pricePerLitre: parsed.pricePerLitre ?? [],
      litres: parsed.litres ?? [],
      totalPrice: parsed.totalPrice ?? [],
    };
  } catch {
    return emptyLearnedAnchors();
  }
}

function numbersInLine(line: string): number[] {
  const tokens = line.match(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g) ?? [];
  return tokens
    .map((token) => Number.parseFloat(token.replace(/,/g, '')))
    .filter((value) => Number.isFinite(value));
}

function lineContainsValue(line: string, value: number, allowCentsForm: boolean): boolean {
  return numbersInLine(line).some(
    (candidate) =>
      Math.abs(candidate - value) < 0.005 ||
      // Prices are often displayed in cents (e.g. "189.9" for $1.899/L).
      (allowCentsForm && Math.abs(candidate - value * 100) < 0.05),
  );
}

// The anchor for a value is the label text on its own line, or failing that on
// one of the two lines above it — mirroring how parseBowserText associates
// labels with the value boxes below them.
function findAnchorForValue(
  lines: string[],
  value: number,
  allowCentsForm: boolean,
): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!lineContainsValue(lines[i], value, allowCentsForm)) {
      continue;
    }

    for (const candidateLine of [lines[i], lines[i - 1], lines[i - 2]]) {
      if (candidateLine === undefined) {
        continue;
      }
      const anchor = normalizeAnchorText(candidateLine);
      if (anchor.length >= MIN_ANCHOR_LENGTH) {
        return anchor;
      }
    }
  }

  return null;
}

function upsertAnchor(anchors: LearnedAnchor[], token: string): LearnedAnchor[] {
  const now = new Date().toISOString();
  const existing = anchors.find((anchor) => anchor.token === token);

  const updated = existing
    ? anchors.map((anchor) =>
        anchor.token === token ? { ...anchor, hits: anchor.hits + 1, lastSeenAt: now } : anchor,
      )
    : [...anchors, { token, hits: 1, lastSeenAt: now }];

  return updated.sort((a, b) => b.hits - a.hits).slice(0, MAX_ANCHORS_PER_FIELD);
}

export async function clearOcrLearning(): Promise<void> {
  await AsyncStorage.removeItem(ANCHORS_KEY);
}

export async function recordOcrLearning(
  rawText: string,
  saved: Record<BowserNumericField, number>,
): Promise<void> {
  if (!rawText.trim()) {
    return;
  }

  const lines = rawText.split(/\r?\n/);
  const anchors = await getLearnedAnchors();
  let changed = false;

  for (const field of NUMERIC_FIELDS) {
    const anchor = findAnchorForValue(lines, saved[field], field === 'pricePerLitre');
    if (anchor) {
      anchors[field] = upsertAnchor(anchors[field], anchor);
      changed = true;
    }
  }

  if (changed) {
    await AsyncStorage.setItem(ANCHORS_KEY, JSON.stringify(anchors));
  }
}
