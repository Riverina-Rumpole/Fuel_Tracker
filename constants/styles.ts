import { StyleSheet } from 'react-native';

import { AppColors } from '@/constants/colors';

// Ambient depth for surfaces sitting on the near-black background.
export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.45,
  shadowRadius: 20,
  elevation: 6,
} as const;

// Coloured glow for the accent CTA, so it reads as the focal point.
export const glowShadow = {
  shadowColor: AppColors.accent,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 16,
  elevation: 8,
} as const;

// Spread onto a Pressable's `style` prop function: `style={({ pressed }) => [base, pressedStyle(pressed)]}`.
export function pressedStyle(pressed: boolean) {
  return {
    opacity: pressed ? 0.85 : 1,
    transform: [{ scale: pressed ? 0.97 : 1 }],
  };
}

export const sharedStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 20,
    gap: 16,
    // Cap the column width so the phone-first layout stays readable and
    // centred on wide iPad screens; a no-op on iPhone (screen < maxWidth).
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.border,
    gap: 12,
    ...cardShadow,
  },
  title: {
    color: AppColors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: AppColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  label: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  input: {
    backgroundColor: AppColors.surfaceElevated,
    borderColor: AppColors.border,
    borderWidth: 1,
    borderRadius: 12,
    color: AppColors.text,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: AppColors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    ...glowShadow,
  },
  primaryButtonText: {
    color: '#04101F',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  secondaryButton: {
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
});
