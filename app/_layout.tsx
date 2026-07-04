import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { AppColors } from '@/constants/colors';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: AppColors.background,
    card: AppColors.surface,
    text: AppColors.text,
    border: AppColors.border,
    primary: AppColors.accent,
  },
};

export const unstable_settings = {
  anchor: '(tabs)',
};

// Auto-hide doesn't reliably fire under the New Architecture (newArchEnabled
// in app.json), so the splash screen is held and dismissed manually once the
// root layout has mounted.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={navigationTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ presentation: 'modal', title: 'Help' }} />
        <Stack.Screen name="about" options={{ presentation: 'modal', title: 'About' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
