import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Sharing from 'expo-sharing';
import { router, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { EfficiencyTrend } from '@/components/efficiency-trend';
import { FuelRecordCard } from '@/components/fuel-record-card';
import { SpendSummary } from '@/components/spend-summary';
import { AppColors } from '@/constants/colors';
import { pressedStyle, sharedStyles } from '@/constants/styles';
import { useFuelRecords } from '@/hooks/use-fuel-records';
import { useVehicles } from '@/hooks/use-vehicles';
import { scheduleExportReminder } from '@/lib/notifications';
import { printFuelLog } from '@/lib/print';
import { getSpreadsheetUri } from '@/lib/spreadsheet';
import type { FuelFillWithMetrics } from '@/types/fuel';

type RangeFilter = '30' | '90' | '365';

const RANGE_FILTERS: { key: RangeFilter; label: string }[] = [
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 3 months' },
  { key: '365', label: 'Last year' },
];

function filterByRange(records: FuelFillWithMetrics[], range: RangeFilter): FuelFillWithMetrics[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(range));
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  return records.filter((record) => record.date >= cutoffIso);
}

export default function HistoryScreen() {
  const { activeVehicle, refresh: refreshVehicles } = useVehicles();
  const { records, loading, error, removeFill } = useFuelRecords(activeVehicle);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('365');

  const filteredRecords = useMemo(
    () => filterByRange(records, rangeFilter),
    [records, rangeFilter],
  );

  // records/filteredRecords stay oldest-first since metrics (km since last,
  // efficiency trend) are derived from that order; only the list display
  // is reversed to show the newest fill first.
  const displayRecords = useMemo(
    () => [...filteredRecords].reverse(),
    [filteredRecords],
  );

  // useFuelRecords already refetches internally whenever the vehicle it's
  // passed changes, so refreshing vehicles here is enough to also pick up
  // fresh fill data. Depending on useFuelRecords' own `refresh` here too
  // would create a feedback loop: refreshVehicles() always returns a new
  // vehicle object reference (fresh JSON.parse), which changes `refresh`'s
  // identity, which would re-trigger this effect indefinitely.
  useFocusEffect(
    useCallback(() => {
      refreshVehicles();
    }, [refreshVehicles]),
  );

  const exportSpreadsheet = async () => {
    if (!activeVehicle) {
      Alert.alert('No vehicle selected', 'Select a vehicle in the Vehicles tab first.');
      return;
    }

    const uri = getSpreadsheetUri(activeVehicle);
    if (!uri) {
      Alert.alert('No spreadsheet yet', 'Log a fill first to generate its fuel log.');
      return;
    }

    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Export fuel log',
        });
      } else {
        await Share.share({
          url: uri,
          message: `Fuel log for ${activeVehicle.registration}`,
        });
      }
      // Re-arm the "haven't exported in a while" reminder from now.
      scheduleExportReminder(activeVehicle.id, activeVehicle.registration).catch(() => {});
    } catch (err) {
      Alert.alert(
        'Export failed',
        err instanceof Error ? err.message : 'Could not export the spreadsheet.',
      );
    }
  };

  const printHistory = async () => {
    if (!activeVehicle) {
      Alert.alert('No vehicle selected', 'Select a vehicle in the Vehicles tab first.');
      return;
    }

    if (records.length === 0) {
      Alert.alert('No fills yet', 'Log a fill first to have something to print.');
      return;
    }

    try {
      await printFuelLog(records, activeVehicle);
    } catch (err) {
      Alert.alert('Print failed', err instanceof Error ? err.message : 'Could not print the fuel log.');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete fill?', 'This will update the cumulative spreadsheet.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => removeFill(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={sharedStyles.title}>Fuel history</Text>
          <Text style={[sharedStyles.subtitle, styles.subtitleCentered]}>
            Kilometres per litre, litres per 100 kilometres and cost per kilometre travelled shown
            below.
          </Text>
        </View>
        {activeVehicle ? (
          <View style={styles.headerActions}>
            <Pressable
              style={({ pressed }) => [styles.exportButton, pressedStyle(pressed)]}
              onPress={exportSpreadsheet}>
              <MaterialIcons name="ios-share" size={15} color={AppColors.text} />
              <Text style={styles.exportButtonText}>Export XLSX</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.exportButton, pressedStyle(pressed)]}
              onPress={printHistory}>
              <MaterialIcons name="print" size={15} color={AppColors.text} />
              <Text style={styles.exportButtonText}>Print</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      {activeVehicle && records.length > 0 ? (
        <View style={styles.filterRow}>
          {RANGE_FILTERS.map((filter) => {
            const isActive = filter.key === rangeFilter;
            return (
              <Pressable
                key={filter.key}
                style={({ pressed }) => [
                  styles.filterChip,
                  isActive && styles.filterChipActive,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => setRangeFilter(filter.key)}>
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {!activeVehicle ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="directions-car" size={28} color={AppColors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No vehicle selected</Text>
          <Text style={styles.emptyText}>Add or select a vehicle to see its fuel history.</Text>
          <Pressable
            style={({ pressed }) => [sharedStyles.secondaryButton, styles.vehiclesLink, pressed && { opacity: 0.85 }]}
            onPress={() => router.push('/vehicles')}>
            <Text style={sharedStyles.secondaryButtonText}>Go to Vehicles</Text>
          </Pressable>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={AppColors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="local-gas-station" size={28} color={AppColors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No fills yet</Text>
          <Text style={styles.emptyText}>Your logged fills and derived metrics will appear here.</Text>
        </View>
      ) : filteredRecords.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="local-gas-station" size={28} color={AppColors.accent} />
          </View>
          <Text style={styles.emptyTitle}>No fills in this range</Text>
          <Text style={styles.emptyText}>Try a wider date range to see more of your history.</Text>
        </View>
      ) : (
        <FlatList
          data={displayRecords}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.headerStack}>
              <SpendSummary records={records} />
              <EfficiencyTrend records={records} />
            </View>
          }
          ListHeaderComponentStyle={styles.listHeader}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.duration(300).delay(Math.min(index, 8) * 40)}>
              <Pressable
                style={({ pressed }) => [pressedStyle(pressed)]}
                onLongPress={() => confirmDelete(item.id)}>
                <FuelRecordCard record={item} />
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  subtitleCentered: {
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 14,
  },
  headerActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  filterChip: {
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {
    backgroundColor: `${AppColors.accent}22`,
    borderColor: AppColors.accent,
  },
  filterChipText: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: AppColors.accent,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  exportButtonText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  listHeader: {
    marginBottom: 12,
  },
  headerStack: {
    gap: 12,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 8,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: `${AppColors.accent}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  emptyText: {
    color: AppColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  vehiclesLink: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
    textAlign: 'center',
  },
});
