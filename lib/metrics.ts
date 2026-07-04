import type { FuelFill, FuelFillWithMetrics, FuelMetrics } from '@/types/fuel';

export function computeMetrics(
  record: FuelFill,
  previousOdometer: number | null,
): FuelMetrics {
  if (previousOdometer === null) {
    return {
      kmSinceLastFill: null,
      kmPerLitre: null,
      litresPer100Km: null,
      costPerKm: null,
    };
  }

  const kmSinceLastFill = record.odometer - previousOdometer;

  if (kmSinceLastFill <= 0) {
    return {
      kmSinceLastFill,
      kmPerLitre: null,
      litresPer100Km: null,
      costPerKm: null,
    };
  }

  const kmPerLitre = record.litres > 0 ? kmSinceLastFill / record.litres : null;
  const litresPer100Km =
    record.litres > 0 ? (record.litres / kmSinceLastFill) * 100 : null;
  const costPerKm = record.totalPrice / kmSinceLastFill;

  return {
    kmSinceLastFill,
    kmPerLitre,
    litresPer100Km,
    costPerKm,
  };
}

export function attachMetrics(records: FuelFill[]): FuelFillWithMetrics[] {
  return records.map((record, index) => {
    const previousOdometer = index > 0 ? records[index - 1].odometer : null;
    return {
      ...record,
      metrics: computeMetrics(record, previousOdometer),
    };
  });
}

const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/** Formats a stored ISO `YYYY-MM-DD` date as `dd-MMM-yyyy` for display. Dates
 * are kept as ISO internally since storage sorting relies on lexical order
 * matching chronological order. */
export function formatDisplayDate(isoDate: string): string {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return isoDate;
  }

  const [, year, month, day] = match;
  const monthName = MONTH_ABBREVIATIONS[Number.parseInt(month, 10) - 1];
  if (!monthName) {
    return isoDate;
  }

  return `${day}-${monthName}-${year}`;
}

/** Inverse of formatDisplayDate: parses a `dd-MMM-yyyy` string back to the
 * ISO `YYYY-MM-DD` form used for storage/sorting. Returns null if the input
 * isn't a valid dd-MMM-yyyy date. */
export function parseDisplayDate(displayDate: string): string | null {
  const match = displayDate.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) {
    return null;
  }

  const [, day, monthAbbr, year] = match;
  const monthIndex = MONTH_ABBREVIATIONS.findIndex(
    (month) => month.toLowerCase() === monthAbbr.toLowerCase(),
  );
  const dayNum = Number.parseInt(day, 10);
  if (monthIndex < 0 || dayNum < 1 || dayNum > 31) {
    return null;
  }

  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function formatNumber(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  return value.toFixed(digits);
}

export function formatCurrency(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  return `$${value.toFixed(digits)}`;
}
