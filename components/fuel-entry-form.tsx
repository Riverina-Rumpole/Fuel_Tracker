import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BowserPreview } from '@/components/bowser-camera';
import { GradientButton } from '@/components/gradient-button';
import { AppColors } from '@/constants/colors';
import { pressedStyle, sharedStyles } from '@/constants/styles';
import { formatDisplayDate, parseDisplayDate } from '@/lib/metrics';
import type { ParsedBowserData } from '@/types/fuel';

type FuelEntryFormProps = {
  imageUri: string;
  parsed: ParsedBowserData;
  saving: boolean;
  onSave: (values: {
    date: string;
    pricePerLitre: number;
    litres: number;
    totalPrice: number;
    odometer: number;
  }) => void;
  onReset: () => void;
  onCancel: () => void;
};

function toInput(value: number | null): string {
  return value === null ? '' : String(value);
}

export function FuelEntryForm({
  imageUri,
  parsed,
  saving,
  onSave,
  onReset,
  onCancel,
}: FuelEntryFormProps) {
  const [date, setDate] = useState(formatDisplayDate(parsed.date));
  const [pricePerLitre, setPricePerLitre] = useState(toInput(parsed.pricePerLitre));
  const [litres, setLitres] = useState(toInput(parsed.litres));
  const [totalPrice, setTotalPrice] = useState(toInput(parsed.totalPrice));
  const [odometer, setOdometer] = useState('');

  const validationMessage = useMemo(() => {
    const price = Number.parseFloat(pricePerLitre);
    const volume = Number.parseFloat(litres);
    const total = Number.parseFloat(totalPrice);
    const odo = Number.parseFloat(odometer);

    if (!parseDisplayDate(date)) {
      return 'Enter a valid date (dd-mmm-yyyy).';
    }
    if (!Number.isFinite(price) || price <= 0) {
      return 'Enter a valid price per litre.';
    }
    if (!Number.isFinite(volume) || volume <= 0) {
      return 'Enter a valid litres amount.';
    }
    if (!Number.isFinite(total) || total <= 0) {
      return 'Enter a valid total price.';
    }
    if (!Number.isFinite(odo) || odo <= 0) {
      return 'Enter your current odometer reading.';
    }
    return null;
  }, [date, litres, odometer, pricePerLitre, totalPrice]);

  const handleSave = () => {
    if (validationMessage) {
      Alert.alert('Check your entries', validationMessage);
      return;
    }

    const isoDate = parseDisplayDate(date);
    if (!isoDate) {
      Alert.alert('Check your entries', 'Enter a valid date (dd-mmm-yyyy).');
      return;
    }

    onSave({
      date: isoDate,
      pricePerLitre: Number.parseFloat(pricePerLitre),
      litres: Number.parseFloat(litres),
      totalPrice: Number.parseFloat(totalPrice),
      odometer: Number.parseFloat(odometer),
    });
  };

  const handleCancel = () => {
    Alert.alert('Discard this fill?', 'Your entered details will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onCancel },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ScrollView
        contentContainerStyle={sharedStyles.content}
        keyboardShouldPersistTaps="handled">
        <View>
          <Text style={sharedStyles.title}>Review fill details</Text>
          <Text style={sharedStyles.subtitle}>
            OCR results are editable. Add your odometer reading before saving to the log. Any
            figures you correct teach the app to read your bowser better next time.
          </Text>
        </View>

        <BowserPreview imageUri={imageUri} parsed={parsed} />

        <View style={sharedStyles.card}>
          <View>
            <Text style={sharedStyles.label}>Date</Text>
            <TextInput
              style={sharedStyles.input}
              value={date}
              onChangeText={setDate}
              placeholder="03-Jul-2026"
              placeholderTextColor={AppColors.textMuted}
              autoCapitalize="none"
            />
          </View>

          <View style={sharedStyles.row}>
            <View style={sharedStyles.rowItem}>
              <Text style={sharedStyles.label}>Price / L ($)</Text>
              <TextInput
                style={sharedStyles.input}
                value={pricePerLitre}
                onChangeText={setPricePerLitre}
                keyboardType="decimal-pad"
                placeholder="2.159"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
            <View style={sharedStyles.rowItem}>
              <Text style={sharedStyles.label}>Litres</Text>
              <TextInput
                style={sharedStyles.input}
                value={litres}
                onChangeText={setLitres}
                keyboardType="decimal-pad"
                placeholder="45.23"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
          </View>

          <View style={sharedStyles.row}>
            <View style={sharedStyles.rowItem}>
              <Text style={sharedStyles.label}>Total ($)</Text>
              <TextInput
                style={sharedStyles.input}
                value={totalPrice}
                onChangeText={setTotalPrice}
                keyboardType="decimal-pad"
                placeholder="97.45"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
            <View style={sharedStyles.rowItem}>
              <Text style={sharedStyles.label}>Odometer (km)</Text>
              <TextInput
                style={sharedStyles.input}
                value={odometer}
                onChangeText={setOdometer}
                keyboardType="decimal-pad"
                placeholder="086111"
                placeholderTextColor={AppColors.textMuted}
              />
            </View>
          </View>
        </View>

        <GradientButton
          title="Save to spreadsheet"
          onPress={handleSave}
          disabled={saving}
          loading={saving}
        />

        <View style={sharedStyles.row}>
          <Pressable
            style={({ pressed }) => [sharedStyles.secondaryButton, sharedStyles.rowItem, pressedStyle(pressed)]}
            onPress={onReset}
            disabled={saving}>
            <Text style={sharedStyles.secondaryButtonText}>Capture again</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [sharedStyles.secondaryButton, sharedStyles.rowItem, pressedStyle(pressed)]}
            onPress={handleCancel}
            disabled={saving}>
            <Text style={sharedStyles.secondaryButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
