import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { cardShadow } from '@/constants/styles';
import { formatCurrency, formatDisplayDate, formatNumber } from '@/lib/metrics';
import type { FuelFillWithMetrics } from '@/types/fuel';

type FuelRecordCardProps = {
  record: FuelFillWithMetrics;
};

export function FuelRecordCard({ record }: FuelRecordCardProps) {
  const { metrics } = record;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{formatDisplayDate(record.date)}</Text>
        <Text style={styles.total}>{formatCurrency(record.totalPrice)}</Text>
      </View>

      <View style={styles.grid}>
        <Metric label="Litres" value={formatNumber(record.litres, 2)} />
        <Metric label="Price/L" value={formatCurrency(record.pricePerLitre, 3)} />
        <Metric label="Odometer" value={formatNumber(record.odometer, 0)} />
        <Metric label="Km since last" value={formatNumber(metrics.kmSinceLastFill, 1)} />
        <Metric label="km/L" value={formatNumber(metrics.kmPerLitre, 2)} />
        <Metric label="L/100km" value={formatNumber(metrics.litresPer100Km, 2)} />
        <Metric label="Cost/km" value={formatCurrency(metrics.costPerKm, 3)} />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    gap: 14,
    ...cardShadow,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: AppColors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  total: {
    color: AppColors.accent,
    fontSize: 17,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metric: {
    width: '30%',
    minWidth: 96,
    gap: 4,
  },
  metricLabel: {
    color: AppColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  metricValue: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
