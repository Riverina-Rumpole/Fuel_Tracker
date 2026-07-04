import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppColors } from '@/constants/colors';
import { cardShadow, sharedStyles } from '@/constants/styles';

const FEATURE_GROUPS = [
  {
    title: 'Effortless data entry',
    items: [
      'Photograph your bowser display, or import a photo if someone else filled up for you',
      'On-device OCR automatically reads price/litre, litres, total cost, and date',
      'Every field stays fully editable before saving',
    ],
  },
  {
    title: 'Multi-vehicle tracking',
    items: [
      'Track up to 4 vehicles, each with its own registration and optional nickname',
      'Each vehicle keeps a completely separate fuel log and spreadsheet',
      'Quick switching between vehicles from the Vehicles tab',
    ],
  },
  {
    title: 'Automatic fuel log spreadsheet',
    items: [
      'A cumulative Excel (.xlsx) file per vehicle, updated on every save or delete',
      'Built-in formulas for km since last fill, km/L, L/100km, and cost per km',
      'Export via the share sheet, or print directly to any AirPrint printer',
    ],
  },
  {
    title: 'History & insights',
    items: [
      'Full fill history per vehicle, filterable by last 30 days / 3 months / year',
      'Spend summary showing this month, this year, and all-time totals',
      'Efficiency trend chart tracking km/L or cost/km across recent fills',
    ],
  },
  {
    title: 'Reminders',
    items: [
      "A nudge if you haven't logged a fill for a vehicle in 30 days",
      "A nudge if you haven't exported a vehicle's spreadsheet in 30 days",
    ],
  },
];

export default function AboutScreen() {
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View>
        <Text style={sharedStyles.title}>About Fuel Tracker</Text>
        <Text style={sharedStyles.subtitle}>
          Log petrol fills by photographing (or importing a photo of) a bowser display. On-device
          OCR extracts the fill details, you add the odometer reading, and each save updates a
          cumulative Excel spreadsheet with efficiency formulas — per vehicle, for up to 4
          vehicles.
        </Text>
      </View>

      {FEATURE_GROUPS.map((group) => (
        <View key={group.title} style={styles.groupCard}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.bulletList}>
            {group.items.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={styles.bulletDot} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}

      <Pressable
        style={({ pressed }) => [sharedStyles.secondaryButton, pressed && { opacity: 0.85 }]}
        onPress={() => router.back()}>
        <Text style={sharedStyles.secondaryButtonText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  groupCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    gap: 10,
    ...cardShadow,
  },
  groupTitle: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: AppColors.accent,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
