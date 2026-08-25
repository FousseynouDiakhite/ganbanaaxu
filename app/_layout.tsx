

/*
// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { useEffect } from 'react';
import { Stack } from "expo-router";
import { useColorScheme } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from "@react-navigation/native";
import * as SplashScreen from 'expo-splash-screen'; // ✅ Import du plugin

// ⚡ EMPÊCHER LE MASQUAGE AUTOMATIQUE DU SPLASH SCREEN
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // ⚡ MASQUER LE SPLASH SCREEN QUAND TOUT EST PRÊT
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
*/














// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import { useEffect } from 'react';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen'; // ✅ Import du plugin

// ⚡ EMPÊCHER LE MASQUAGE AUTOMATIQUE DU SPLASH SCREEN
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    // ⚡ MASQUER LE SPLASH SCREEN QUAND TOUT EST PRÊT
    SplashScreen.hideAsync();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}







