import type { ParsedBowserData } from '@/types/fuel';

function parseNumber(value: string): number | null {
  const cleaned = value.replace(/,/g, '').trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractCurrencyAmounts(text: string): number[] {
  const amounts: number[] = [];
  const patterns = [
    /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/g,
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s*(?:AUD|NZD)?/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const amount = parseNumber(match[1]);
      if (amount !== null && amount > 0) {
        amounts.push(amount);
      }
    }
  }

  return amounts;
}

function parseDate(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();

  const isoMatch = normalized.match(/\b(20\d{2})[\/\-.](\d{1,2})[\/\-.](\d{1,2})\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const dayFirstMatch = normalized.match(/\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/);
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const monthNameMatch = normalized.match(
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})\b/i,
  );
  if (monthNameMatch) {
    const [, day, monthName, year] = monthNameMatch;
    const monthIndex = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ].indexOf(monthName.slice(0, 3).toLowerCase());
    if (monthIndex >= 0) {
      return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return new Date().toISOString().slice(0, 10);
}

// Bowser displays often render a field's label and its digital-display value
// in visually separate boxes (different background/colour), which OCR then
// reports as separate lines with nothing in between — e.g. "PRICE PER LITRE"
// on one line and "$2.25" on the next, rather than both on one line. Each
// field parser below checks the label line itself first, then falls back to
// checking the very next line for a bare value.
function findLabelledValue(
  lines: string[],
  labelHint: RegExp,
  extract: (line: string, labelLine: string) => number | null,
): number | null {
  for (let i = 0; i < lines.length; i += 1) {
    if (!labelHint.test(lines[i])) {
      continue;
    }

    const sameLine = extract(lines[i], lines[i]);
    if (sameLine !== null) {
      return sameLine;
    }

    // Check the next couple of lines too, in case OCR inserted a stray
    // blank/unrelated line between a label and its value box.
    for (const nextLine of [lines[i + 1], lines[i + 2]]) {
      if (nextLine === undefined) {
        continue;
      }
      const value = extract(nextLine, lines[i]);
      if (value !== null) {
        return value;
      }
    }
  }

  return null;
}

function parsePricePerLitre(text: string): number | null {
  const lines = text.split(/\r?\n/);

  // Gate to lines that are clearly about price, not volume. Bare "litre"/"liter"
  // is deliberately excluded here — it also matches the volume line (e.g.
  // "Litre 9.230 L"), which previously caused the litres reading to be picked
  // up as the price when the volume line preceded the price line in OCR order.
  const priceLineHint = /(price|c\s*\/\s*l|per\s*l|\$\s*\/\s*l)/i;

  const extract = (line: string, labelLine: string): number | null => {
    // Cents-per-litre, e.g. "185.9c/L", "PRICE 185.9c", or "185.9¢" — number
    // may appear anywhere on the line relative to the "c"/"c/L"/"¢" unit.
    const centsMatch = line.match(/(\d{2,3}(?:\.\d)?)\s*(?:¢|c(?:\s*\/\s*l)?\b)/i);
    if (centsMatch) {
      const cents = parseNumber(centsMatch[1]);
      if (cents !== null) {
        return Number((cents / 100).toFixed(4));
      }
    }

    // Dollars-per-litre shaped number (single digit before the decimal, 2-3
    // after, e.g. "2.159"). Matched anywhere on the line — real pumps show
    // this both as "2.159/L" (value-then-unit) and "Price/L $2.159"
    // (label-then-value), so we don't require adjacency to the unit text.
    const dollarPerLMatch = line.match(/\$?\s*(\d\.\d{2,3})\b/);
    if (dollarPerLMatch) {
      return parseNumber(dollarPerLMatch[1]);
    }

    // Some pumps label the whole field "cents per litre" as separate text
    // (rather than attaching a "c"/"¢" to the digits themselves), and just
    // show a bare number like "111.9" for the value. Only treat a bare
    // number this way when the governing label explicitly says "cent(s)".
    if (/cent/i.test(labelLine)) {
      const bareCents = line.match(/^[^a-zA-Z\d]*(\d{2,3}(?:\.\d{1,2})?)[^a-zA-Z\d]*$/);
      if (bareCents) {
        const cents = parseNumber(bareCents[1]);
        if (cents !== null) {
          return Number((cents / 100).toFixed(4));
        }
      }
    }

    return null;
  };

  const labelled = findLabelledValue(lines, priceLineHint, extract);
  if (labelled !== null) {
    return labelled;
  }

  // Last-resort fallback when no price-labelled line was found. Stricter than
  // the line-scoped patterns above (mandatory decimal, digit-run boundary) so
  // unrelated numbers (loyalty card digits, pump IDs) aren't mistaken for a
  // price.
  const globalCents = text.match(/\b(\d{2,3}\.\d)\s*(?:¢|c(?:\s*\/\s*l)?\b)/i);
  if (globalCents) {
    const cents = parseNumber(globalCents[1]);
    if (cents !== null) {
      return Number((cents / 100).toFixed(4));
    }
  }

  const globalDollarPerL = text.match(/\b(\d\.\d{2,3})\s*(?:\/|per)\s*l\b/i);
  if (globalDollarPerL) {
    return parseNumber(globalDollarPerL[1]);
  }

  return null;
}

function parseLitres(text: string): number | null {
  const lines = text.split(/\r?\n/);
  // Exclude lines that are clearly about price (e.g. "PRICE PER LITRE" or
  // "cents per litre") even though they contain the substring "litre" —
  // those are the price parser's territory, not a volume reading.
  const litresLineHint = /^(?!.*(?:price|cent)).*(?:volume|litre|liter|vol|qty|quantity)/i;

  const extract = (line: string): number | null => {
    const litresMatch = line.match(/(\d{1,3}(?:\.\d{1,3})?)\s*l\b/i);
    if (litresMatch) {
      const litres = parseNumber(litresMatch[1]);
      if (litres !== null && litres > 0 && litres < 200) {
        return litres;
      }
    }

    // Keyword directly followed by a number on the same line with no unit
    // suffix, e.g. "Litre 38.204".
    const labelledNumber = line.match(/(?:volume|litre|liter|vol)[^\d]*(\d{1,3}(?:\.\d{1,3})?)/i);
    if (labelledNumber) {
      const litres = parseNumber(labelledNumber[1]);
      if (litres !== null && litres > 0 && litres < 200) {
        return litres;
      }
    }

    // Bare number with no litre-unit suffix, e.g. the value box just shows
    // "18.5" under a separate "LITRES" label on the line above. Only matches
    // a line that is essentially just the number (plus symbols/whitespace) —
    // a line with other words plus a stray digit (e.g. "PUMP 3") should not
    // qualify.
    const bareNumber = line.match(/^[^a-zA-Z\d]*(\d{1,3}(?:\.\d{1,3})?)[^a-zA-Z\d]*$/);
    if (bareNumber) {
      const litres = parseNumber(bareNumber[1]);
      if (litres !== null && litres > 0 && litres < 200) {
        return litres;
      }
    }

    return null;
  };

  const labelled = findLabelledValue(lines, litresLineHint, extract);
  if (labelled !== null) {
    return labelled;
  }

  const globalLitres = [...text.matchAll(/(\d{1,3}(?:\.\d{1,3})?)\s*l\b/gi)];
  for (const match of globalLitres) {
    const litres = parseNumber(match[1]);
    if (litres !== null && litres > 0 && litres < 200) {
      return litres;
    }
  }

  // Last resort when nothing is labelled at all: a bowser showing just two
  // bare numbers (no "TOTAL"/"LITRES" text in frame) almost always has a
  // higher dollar total and a lower litre count, since fuel is virtually
  // never priced under $1/L. Picking the smallest plausible candidate here
  // mirrors parseTotalPrice's "pick the largest" fallback below, so the two
  // don't collide on the same number.
  const plausibleLitres = extractCurrencyAmounts(text).filter(
    (amount) => amount > 0 && amount < 200,
  );
  if (plausibleLitres.length >= 2) {
    return Math.min(...plausibleLitres);
  }

  return null;
}

function parseTotalPrice(text: string, litres: number | null, pricePerLitre: number | null): number | null {
  const lines = text.split(/\r?\n/);
  const totalLineHint = /total/i;

  const extract = (line: string): number | null => {
    // "$" can sit either side of the amount depending on the pump's display —
    // e.g. "$97.45" or "97.45 $".
    const dollarMatch = line.match(
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{2}))\s*\$/,
    );
    if (dollarMatch) {
      return parseNumber(dollarMatch[1] ?? dollarMatch[2]);
    }

    const bareMatch = line.match(/total[^\d]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
    if (bareMatch) {
      return parseNumber(bareMatch[1]);
    }

    // Bare value on the line right after a "TOTAL $" label with no digits of
    // its own. Only matches a line that is essentially just the number.
    const bareNumber = line.match(/^[^a-zA-Z\d]*(\d{1,3}(?:,\d{3})*(?:\.\d{2}))[^a-zA-Z\d]*$/);
    if (bareNumber) {
      return parseNumber(bareNumber[1]);
    }

    return null;
  };

  const labelled = findLabelledValue(lines, totalLineHint, extract);
  if (labelled !== null) {
    return labelled;
  }

  const amounts = extractCurrencyAmounts(text);
  if (amounts.length > 0) {
    const plausible = amounts.filter((amount) => amount >= 5 && amount <= 500);
    if (plausible.length > 0) {
      return Math.max(...plausible);
    }
  }

  if (litres !== null && pricePerLitre !== null) {
    return Number((litres * pricePerLitre).toFixed(2));
  }

  return null;
}

export function parseBowserText(rawText: string): ParsedBowserData {
  const pricePerLitre = parsePricePerLitre(rawText);
  const litres = parseLitres(rawText);
  const totalPrice = parseTotalPrice(rawText, litres, pricePerLitre);
  const date = parseDate(rawText);

  return {
    date,
    pricePerLitre,
    litres,
    totalPrice,
    rawText,
  };
}
