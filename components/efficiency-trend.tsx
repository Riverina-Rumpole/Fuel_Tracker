import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Circle, Path, Polyline, Svg } from 'react-native-svg';

import { AppColors } from '@/constants/colors';
import { cardShadow } from '@/constants/styles';
import { formatCurrency, formatDisplayDate, formatNumber } from '@/lib/metrics';
import type { FuelFillWithMetrics } from '@/types/fuel';

type MetricKey = 'kmPerLitre' | 'costPerKm';

const METRICS: { key: MetricKey; label: string; higherIsBetter: boolean }[] = [
  { key: 'kmPerLitre', label: 'km/L', higherIsBetter: true },
  { key: 'costPerKm', label: 'Cost/km', higherIsBetter: false },
];

const CHART_WIDTH = 300;
const CHART_HEIGHT = 120;
const CHART_PADDING = 12;
const MAX_POINTS = 8;

type EfficiencyTrendProps = {
  records: FuelFillWithMetrics[];
};

export function EfficiencyTrend({ records }: EfficiencyTrendProps) {
  const [metricKey, setMetricKey] = useState<MetricKey>('kmPerLitre');
  const metric = METRICS.find((m) => m.key === metricKey)!;

  const points = useMemo(
    () =>
      records
        .filter((record) => record.metrics[metricKey] !== null)
        .slice(-MAX_POINTS),
    [records, metricKey],
  );

  if (points.length < 2) {
    // Metrics only start from the 2nd fill (the 1st has no previous
    // odometer to compare against), so at least 3 fills are needed before
    // there are 2 data points to draw a line between.
    return (
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>Efficiency trend</Text>
        <Text style={styles.placeholderText}>
          Log a couple more fills to see your km/L and cost/km trend here.
        </Text>
      </View>
    );
  }

  const values = points.map((point) => point.metrics[metricKey] as number);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = values.map((value, index) => {
    const x =
      CHART_PADDING + (index * (CHART_WIDTH - CHART_PADDING * 2)) / (values.length - 1);
    const y =
      CHART_PADDING + (1 - (value - min) / range) * (CHART_HEIGHT - CHART_PADDING * 2);
    return { x, y };
  });

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPath = `M${coords[0].x},${CHART_HEIGHT - CHART_PADDING} ${coords
    .map((c) => `L${c.x},${c.y}`)
    .join(' ')} L${coords[coords.length - 1].x},${CHART_HEIGHT - CHART_PADDING} Z`;

  const latest = values[values.length - 1];
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const best = metric.higherIsBetter ? max : min;

  const formatValue = (value: number) =>
    metricKey === 'costPerKm' ? formatCurrency(value, 3) : formatNumber(value, 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>Efficiency trend</Text>
        <View style={styles.toggleRow}>
          {METRICS.map((option) => {
            const active = option.key === metricKey;
            return (
              <Pressable
                key={option.key}
                style={[styles.toggle, active && styles.toggleActive]}
                onPress={() => setMetricKey(option.key)}>
                <Text style={[styles.toggleText, active && styles.toggleTextActive]}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Latest</Text>
          <Text style={styles.statValue}>{formatValue(latest)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>{formatValue(average)}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Best</Text>
          <Text style={[styles.statValue, styles.statValueBest]}>{formatValue(best)}</Text>
        </View>
      </View>

      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Path d={areaPath} fill={AppColors.accent} fillOpacity={0.12} />
        <Polyline
          points={linePoints}
          fill="none"
          stroke={AppColors.accent}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {coords.map((c, index) => (
          <Circle key={index} cx={c.x} cy={c.y} r={3} fill={AppColors.accent} />
        ))}
      </Svg>

      <View style={styles.datesRow}>
        <Text style={styles.dateLabel}>{formatDisplayDate(points[0].date)}</Text>
        <Text style={styles.dateLabel}>{formatDisplayDate(points[points.length - 1].date)}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  placeholderText: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
  },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  toggleActive: {
    backgroundColor: `${AppColors.accent}22`,
  },
  toggleText: {
    color: AppColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: AppColors.accent,
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
  statValueBest: {
    color: AppColors.success,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  dateLabel: {
    color: AppColors.textMuted,
    fontSize: 11,
  },
});
