import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppColors } from '@/constants/colors';
import { glowShadow, pressedStyle, sharedStyles } from '@/constants/styles';

type GradientButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function GradientButton({ title, onPress, disabled, loading, style }: GradientButtonProps) {
  return (
    <View style={[styles.shadowWrapper, disabled && !loading && styles.disabled, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [styles.clip, pressedStyle(pressed)]}>
        <LinearGradient
          colors={[AppColors.accent, AppColors.accentDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}>
          {loading ? (
            <ActivityIndicator color="#04101F" />
          ) : (
            <Text style={sharedStyles.primaryButtonText}>{title}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrapper: {
    borderRadius: 14,
    ...glowShadow,
  },
  disabled: {
    opacity: 0.7,
  },
  clip: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
