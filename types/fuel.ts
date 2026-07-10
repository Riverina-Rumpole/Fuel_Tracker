export interface Vehicle {
  id: string;
  registration: string;
  nickname?: string;
  createdAt: string;
}

export interface FuelFill {
  id: string;
  date: string;
  pricePerLitre: number;
  litres: number;
  totalPrice: number;
  odometer: number;
  createdAt: string;
}

export interface ParsedBowserData {
  date: string;
  pricePerLitre: number | null;
  litres: number | null;
  totalPrice: number | null;
  rawText: string;
}

export type BowserNumericField = 'pricePerLitre' | 'litres' | 'totalPrice';

export interface LearnedAnchor {
  token: string;
  hits: number;
  lastSeenAt: string;
}

export type LearnedAnchors = Record<BowserNumericField, LearnedAnchor[]>;

export interface FuelMetrics {
  kmSinceLastFill: number | null;
  kmPerLitre: number | null;
  litresPer100Km: number | null;
  costPerKm: number | null;
}

export interface FuelFillWithMetrics extends FuelFill {
  metrics: FuelMetrics;
}
