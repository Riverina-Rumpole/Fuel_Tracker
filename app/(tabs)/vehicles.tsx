import { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { GradientButton } from '@/components/gradient-button';
import { AppColors } from '@/constants/colors';
import { cardShadow, pressedStyle, sharedStyles } from '@/constants/styles';
import { useVehicles } from '@/hooks/use-vehicles';
import type { Vehicle } from '@/types/fuel';

export default function VehiclesScreen() {
  const {
    vehicles,
    activeVehicle,
    refresh,
    addVehicle,
    removeVehicle,
    selectVehicle,
    canAddMore,
  } = useVehicles();
  const [registration, setRegistration] = useState('');
  const [nickname, setNickname] = useState('');
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const handleAdd = async () => {
    if (!registration.trim()) {
      Alert.alert('Registration required', 'Enter the vehicle’s registration plate.');
      return;
    }

    setSaving(true);
    try {
      await addVehicle(registration, nickname);
      setRegistration('');
      setNickname('');
    } catch (err) {
      Alert.alert('Could not add vehicle', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (vehicle: Vehicle) => {
    Alert.alert(
      `Remove ${vehicle.registration}?`,
      'This deletes its logged fills and stops updating its spreadsheet. The exported file itself is not deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeVehicle(vehicle.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={sharedStyles.screen} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={sharedStyles.content} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={sharedStyles.title}>Vehicles</Text>
            <Text style={sharedStyles.subtitle}>
              Track up to 4 vehicles, each with its own fuel log spreadsheet. Tap a vehicle to
              make it active; long-press to remove it.
            </Text>
          </View>

          {vehicles.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <MaterialIcons name="directions-car" size={28} color={AppColors.accent} />
              </View>
              <Text style={styles.emptyTitle}>No vehicles yet</Text>
              <Text style={styles.emptyText}>
                Add a registration below to start logging fills for it.
              </Text>
            </View>
          ) : (
            vehicles.map((vehicle, index) => {
              const isActive = vehicle.id === activeVehicle?.id;
              return (
                <Animated.View key={vehicle.id} entering={FadeInDown.duration(300).delay(index * 40)}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.vehicleCard,
                      isActive && styles.vehicleCardActive,
                      pressedStyle(pressed),
                    ]}
                    onPress={() => !isActive && selectVehicle(vehicle.id)}
                    onLongPress={() => confirmDelete(vehicle)}>
                    <View style={styles.vehicleIcon}>
                      <MaterialIcons name="directions-car" size={20} color={AppColors.accent} />
                    </View>
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleRego}>{vehicle.registration}</Text>
                      {vehicle.nickname ? (
                        <Text style={styles.vehicleNickname}>{vehicle.nickname}</Text>
                      ) : null}
                    </View>
                    {isActive ? (
                      <MaterialIcons name="check-circle" size={22} color={AppColors.success} />
                    ) : null}
                  </Pressable>
                </Animated.View>
              );
            })
          )}

          {canAddMore ? (
            <View style={sharedStyles.card}>
              <Text style={styles.formTitle}>Add a vehicle</Text>
              <View>
                <Text style={sharedStyles.label}>Registration</Text>
                <TextInput
                  style={sharedStyles.input}
                  value={registration}
                  onChangeText={setRegistration}
                  placeholder="ABC123"
                  placeholderTextColor={AppColors.textMuted}
                  autoCapitalize="characters"
                />
              </View>
              <View>
                <Text style={sharedStyles.label}>Nickname (optional)</Text>
                <TextInput
                  style={sharedStyles.input}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="Ute"
                  placeholderTextColor={AppColors.textMuted}
                />
              </View>
              <GradientButton
                title="Add vehicle"
                onPress={handleAdd}
                loading={saving}
                disabled={saving}
              />
            </View>
          ) : (
            <View style={styles.limitCard}>
              <Text style={styles.limitText}>
                You&apos;ve reached the 4-vehicle limit. Remove one to add another.
              </Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.aboutLink, pressed && { opacity: 0.7 }]}
            onPress={() => router.push('/about')}>
            <Text style={styles.aboutLinkText}>About Fuel Tracker (README)</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 24,
    ...cardShadow,
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
  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
    ...cardShadow,
  },
  vehicleCardActive: {
    borderColor: AppColors.accent,
  },
  vehicleIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: `${AppColors.accent}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleInfo: {
    flex: 1,
    gap: 2,
  },
  vehicleRego: {
    color: AppColors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  vehicleNickname: {
    color: AppColors.textMuted,
    fontSize: 14,
  },
  formTitle: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  limitCard: {
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 16,
  },
  limitText: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  aboutLink: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  aboutLinkText: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
