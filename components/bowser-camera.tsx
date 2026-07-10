import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { recognizeText } from 'expo-mlkit-ocr';
import Animated, { FadeIn } from 'react-native-reanimated';

import { GradientButton } from '@/components/gradient-button';
import { AppColors } from '@/constants/colors';
import { pressedStyle } from '@/constants/styles';
import { getLearnedAnchors } from '@/lib/ocr-learning';
import { parseBowserText } from '@/lib/ocr-parser';
import type { ParsedBowserData } from '@/types/fuel';

type CaptureResult = {
  imageUri: string;
  parsed: ParsedBowserData;
};

type BowserCameraProps = {
  onCaptured: (result: CaptureResult) => void;
  onCancel: () => void;
};

export function BowserCamera({ onCaptured, onCancel }: BowserCameraProps) {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOcr = async (uri: string) => {
    const [recognition, learned] = await Promise.all([recognizeText(uri), getLearnedAnchors()]);
    const parsed = parseBowserText(recognition.text, learned);
    onCaptured({ imageUri: uri, parsed });
  };

  const pickFromLibrary = async () => {
    if (processing) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // No explicit media library permission request: launchImageLibraryAsync
      // uses the system photo picker, which lets the user choose a photo
      // without granting the app any standing library access.
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      await runOcr(result.assets[0].uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read bowser display.');
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={AppColors.accent} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>
          Bowser Wonder uses the camera to photograph petrol bowser displays for OCR. If someone
          else filled up for you, you can import their photo instead.
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <GradientButton title="Allow camera" onPress={requestPermission} />
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressedStyle(pressed)]}
          onPress={pickFromLibrary}
          disabled={processing}>
          {processing ? (
            <ActivityIndicator color={AppColors.text} />
          ) : (
            <Text style={styles.secondaryButtonText}>Import photo instead</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.secondaryButton, pressedStyle(pressed)]}
          onPress={onCancel}>
          <Text style={styles.secondaryButtonText}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const capture = async () => {
    if (!cameraRef.current || processing) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        throw new Error('Could not capture photo.');
      }

      await runOcr(photo.uri);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read bowser display.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back" />
      <View style={styles.overlay}>
        <Text style={styles.overlayHint}>
          Step back so the whole display fits in frame — price/L, litres, total, and date.
        </Text>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressedStyle(pressed)]}
            onPress={onCancel}
            disabled={processing}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </Pressable>
          <GradientButton
            title="Capture & read"
            onPress={capture}
            disabled={processing}
            loading={processing}
            style={styles.captureButton}
          />
        </View>
        <Pressable
          style={({ pressed }) => [styles.importButton, pressedStyle(pressed)]}
          onPress={pickFromLibrary}
          disabled={processing}>
          <MaterialIcons name="photo-library" size={18} color={AppColors.text} />
          <Text style={styles.importButtonText}>Someone else filled up? Import their photo</Text>
        </Pressable>
      </View>
    </View>
  );
}

type BowserPreviewProps = {
  imageUri: string;
  parsed: ParsedBowserData;
};

export function BowserPreview({ imageUri, parsed }: BowserPreviewProps) {
  return (
    <Animated.View style={styles.previewCard} entering={FadeIn.duration(300)}>
      <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
      <View style={styles.previewMeta}>
        <MaterialIcons name="document-scanner" size={18} color={AppColors.accent} />
        <Text style={styles.previewText} numberOfLines={4}>
          {parsed.rawText.trim() || 'No text detected — edit fields manually.'}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    backgroundColor: '#08101C',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
  },
  overlayHint: {
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 10,
  },
  importButtonText: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.background,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
    padding: 24,
    gap: 16,
    justifyContent: 'center',
  },
  permissionTitle: {
    color: AppColors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  permissionText: {
    color: AppColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  captureButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
  },
  previewImage: {
    width: '100%',
    height: 320,
    backgroundColor: AppColors.background,
  },
  previewMeta: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  previewText: {
    flex: 1,
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
