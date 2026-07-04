import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppColors } from '@/constants/colors';
import { cardShadow, sharedStyles } from '@/constants/styles';

const STEPS = [
  'After filling up, tap Capture Bowser Display and frame the whole display in shot — or import a photo if someone else filled up for you.',
  'OCR reads the price per litre, litres, total, and date straight into the review screen.',
  'Check the details, fix anything OCR missed, then enter your current odometer reading.',
  'Tap Save to spreadsheet — Fuel Tracker updates your fuel log and works out km/L, L/100km, and cost per km.',
];

const TIPS = [
  {
    title: 'Someone else filled up for me',
    text: 'You don’t need to use the camera yourself. On the capture screen, tap "Import their photo" to pick one from your library instead, and it’s read the same way.',
  },
  {
    title: 'OCR got something wrong',
    text: 'Every field on the review screen is editable. Just tap in and fix it before saving — nothing is locked to what was scanned.',
  },
  {
    title: 'Managing multiple vehicles',
    text: 'Add up to 4 vehicles in the Vehicles tab, each with its own registration and fuel log. Tap a vehicle to make it active; long-press to remove it.',
  },
  {
    title: 'Where’s my spreadsheet?',
    text: 'Each vehicle has its own file, named after its registration. Open History and tap Export XLSX to share it.',
  },
  {
    title: 'Fixing a mistake after saving',
    text: 'Long-press any entry in History to delete it. The spreadsheet updates automatically.',
  },
  {
    title: 'What do the numbers mean?',
    text: 'km/L and L/100km measure efficiency; cost/km shows what each kilometre is actually costing you, based on the fill before it.',
  },
];

export default function HelpScreen() {
  return (
    <ScrollView style={sharedStyles.screen} contentContainerStyle={sharedStyles.content}>
      <View>
        <Text style={sharedStyles.title}>How it works</Text>
        <Text style={sharedStyles.subtitle}>
          Follow these steps every time you fill up to keep your fuel log accurate.
        </Text>
      </View>

      {STEPS.map((step) => (
        <View key={step} style={styles.stepCard}>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}

      <Text style={styles.tipsTitle}>Tips</Text>

      {TIPS.map((tip) => (
        <View key={tip.title} style={styles.tipCard}>
          <Text style={styles.tipTitle}>{tip.title}</Text>
          <Text style={styles.tipText}>{tip.text}</Text>
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
  stepCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    ...cardShadow,
  },
  stepText: {
    flex: 1,
    color: AppColors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  tipsTitle: {
    color: AppColors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  tipCard: {
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    gap: 4,
  },
  tipTitle: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  tipText: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
