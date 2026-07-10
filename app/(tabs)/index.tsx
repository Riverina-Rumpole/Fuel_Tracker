import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { BowserCamera } from '@/components/bowser-camera';
import { FuelEntryForm } from '@/components/fuel-entry-form';
import { FuelRecordCard } from '@/components/fuel-record-card';
import { GradientButton } from '@/components/gradient-button';
import { AppColors } from '@/constants/colors';
import { cardShadow, sharedStyles } from '@/constants/styles';
import { useFuelRecords } from '@/hooks/use-fuel-records';
import { useVehicles } from '@/hooks/use-vehicles';
import { recordOcrLearning } from '@/lib/ocr-learning';
import type { FuelFill, ParsedBowserData } from '@/types/fuel';

type CaptureState = {
  imageUri: string;
  parsed: ParsedBowserData;
};

const INFO_BULLETS = [
  'Kilometres travelled since the last fill',
  'Kilometres per litre',
  'Litres per 100 kilometres',
  'Cost per kilometre travelled',
];

export default function FillScreen() {
  const { vehicles, activeVehicle, refresh: refreshVehicles } = useVehicles();
  const { records, saveFill } = useFuelRecords(activeVehicle);
  const [showCamera, setShowCamera] = useState(false);
  const [capture, setCapture] = useState<CaptureState | null>(null);
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshVehicles();
    }, [refreshVehicles]),
  );

  const latestRecord = records.at(-1);

  const handleSave = async (values: {
    date: string;
    pricePerLitre: number;
    litres: number;
    totalPrice: number;
    odometer: number;
  }) => {
    setSaving(true);
    try {
      const fill: FuelFill = {
        id: `${Date.now()}`,
        date: values.date,
        pricePerLitre: values.pricePerLitre,
        litres: values.litres,
        totalPrice: values.totalPrice,
        odometer: values.odometer,
        createdAt: new Date().toISOString(),
      };

      await saveFill(fill);

      // Learning is best-effort: a failure here should never block the save.
      if (capture) {
        recordOcrLearning(capture.parsed.rawText, {
          pricePerLitre: values.pricePerLitre,
          litres: values.litres,
          totalPrice: values.totalPrice,
        }).catch(() => {});
      }

      setCapture(null);
      setShowCamera(false);
      Alert.alert('Saved', 'Fill added to your cumulative fuel spreadsheet.');
    } catch (err) {
      Alert.alert(
        'Save failed',
        err instanceof Error ? err.message : 'Could not save this fill.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (showCamera && !capture) {
    return (
      <Animated.View style={styles.flex} entering={FadeIn.duration(250)}>
        <BowserCamera
          onCaptured={(result) => {
            setCapture(result);
            setShowCamera(false);
          }}
          onCancel={() => setShowCamera(false)}
        />
      </Animated.View>
    );
  }

  if (capture) {
    return (
      <Animated.View style={styles.flex} entering={FadeIn.duration(250)}>
        <SafeAreaView style={sharedStyles.screen} edges={['top']}>
          <FuelEntryForm
            imageUri={capture.imageUri}
            parsed={capture.parsed}
            saving={saving}
            onSave={handleSave}
            onReset={() => {
              setCapture(null);
              setShowCamera(true);
            }}
            onCancel={() => {
              setCapture(null);
              setShowCamera(false);
            }}
          />
        </SafeAreaView>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <View style={styles.heroWrap}>
          <LinearGradient
            colors={[`${AppColors.accent}40`, `${AppColors.accent}00`]}
            style={styles.heroGlow}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
          <Pressable
            style={({ pressed }) => [styles.helpButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/help')}
            hitSlop={8}>
            <MaterialIcons name="help-outline" size={22} color={AppColors.textMuted} />
          </Pressable>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={[sharedStyles.title, styles.appTitle]}>Fuel Tracker</Text>
            {activeVehicle ? (
              <Pressable
                style={({ pressed }) => [styles.vehicleBadge, pressed && { opacity: 0.7 }]}
                onPress={() => router.push('/vehicles')}>
                <MaterialIcons name="directions-car" size={21} color={AppColors.accent} />
                <Text style={styles.vehicleBadgeText}>
                  {activeVehicle.registration}
                  {activeVehicle.nickname ? ` · ${activeVehicle.nickname}` : ''}
                </Text>
              </Pressable>
            ) : null}
            <Text style={sharedStyles.subtitle}>
              Use your iPhone camera to take an image of the petrol bowser after fill-up. Make sure
              you get the amount of fuel, cost per litre and total cost. Then input your odometer
              reading.
            </Text>
          </Animated.View>
        </View>

        {!activeVehicle ? (
          <Animated.View style={styles.summaryCard} entering={FadeInDown.duration(400).delay(80)}>
            <View style={styles.summaryIcon}>
              <MaterialIcons name="directions-car" size={20} color={AppColors.accent} />
            </View>
            <Text style={styles.summaryValue}>
              {vehicles.length === 0 ? 'Add your first vehicle' : 'Select a vehicle'}
            </Text>
            <Text style={styles.summaryHint}>
              Each vehicle keeps its own fuel log. Head to the Vehicles tab to
              {vehicles.length === 0 ? ' add one.' : ' pick one.'}
            </Text>
            <Pressable
              style={({ pressed }) => [sharedStyles.secondaryButton, styles.vehiclesLink, pressed && { opacity: 0.85 }]}
              onPress={() => router.push('/vehicles')}>
              <Text style={sharedStyles.secondaryButtonText}>Go to Vehicles</Text>
            </Pressable>
          </Animated.View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400).delay(80)}>
              <Text style={styles.sectionLabel}>Last fill-up</Text>
              {latestRecord ? (
                <FuelRecordCard record={latestRecord} />
              ) : (
                <View style={styles.summaryCard}>
                  <View style={styles.summaryIcon}>
                    <MaterialIcons name="local-gas-station" size={20} color={AppColors.accent} />
                  </View>
                  <Text style={styles.summaryValue}>No fills yet</Text>
                  <Text style={styles.summaryHint}>
                    Capture your first bowser display to see it here.
                  </Text>
                </View>
              )}
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(160)}>
              <GradientButton
                title="Capture Bowser Display"
                onPress={() => setShowCamera(true)}
              />
            </Animated.View>

            <Animated.View style={styles.infoCard} entering={FadeInDown.duration(400).delay(240)}>
              <Text style={styles.infoTitle}>How Fuel Tracker works</Text>
              <Text style={styles.infoText}>After each re-fill, Fuel Tracker will display:</Text>
              <View style={styles.bulletList}>
                {INFO_BULLETS.map((item) => (
                  <View key={item} style={styles.bulletRow}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.infoText}>{item}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  heroWrap: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  appTitle: {
    textAlign: 'center',
    marginBottom: 6,
  },
  vehicleBadge: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: `${AppColors.accent}1A`,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 14,
  },
  vehicleBadgeText: {
    color: AppColors.accent,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  vehiclesLink: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    height: 220,
  },
  helpButton: {
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 8,
  },
  summaryCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 18,
    gap: 6,
    alignItems: 'flex-start',
    ...cardShadow,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: `${AppColors.accent}22`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  summaryValue: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  summaryHint: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 16,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  infoTitle: {
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
  infoText: {
    flex: 1,
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
