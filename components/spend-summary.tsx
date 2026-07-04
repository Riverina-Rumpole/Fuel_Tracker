import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/constants/colors';
import { cardShadow } from '@/constants/styles';
import { formatCurrency } from '@/lib/metrics';
import type { FuelFillWithMetrics } from '@/types/fuel';

type SpendSummaryProps = {
  records: FuelFillWithMetrics[];
};

export function SpendSummary({ records }: SpendSummaryProps) {
  const now = new Date();
  const currentYear = String(now.getFullYear());
  const currentYearMonth = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const sumWhere = (predicate: (record: FuelFillWithMetrics) => boolean) =>
    records.filter(predicate).reduce((sum, record) => sum + record.totalPrice, 0);

  const thisMonth = sumWhere((record) => record.date.startsWith(currentYearMonth));
  const thisYear = sumWhere((record) => record.date.startsWith(currentYear));
  const allTime = sumWhere(() => true);

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>Spend summary</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>This month</Text>
          <Text style={styles.statValue}>{formatCurrency(thisMonth)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>This year</Text>
          <Text style={styles.statValue}>{formatCurrency(thisYear)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>All time</Text>
          <Text style={styles.statValue}>{formatCurrency(allTime)}</Text>
        </View>
      </View>
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
    gap: 12,
    ...cardShadow,
  },
  sectionLabel: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    gap: 2,
  },
  statLabel: {
    color: AppColors.textMuted,
    fontSize: 11,
  },
  statValue: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
