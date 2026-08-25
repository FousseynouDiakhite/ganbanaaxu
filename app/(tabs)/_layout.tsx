

/*
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native'; // ✅ Import corrigé
import { IconSymbol } from '@/components/ui/IconSymbol';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Couleurs basées sur le thème
  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    tint: isDark ? '#BB86FC' : '#6200EE',
    inactive: isDark ? '#777' : '#999',
    text: isDark ? '#FFFFFF' : '#1C1E21',
  };

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.background}
        translucent={Platform.OS === 'android'}
      />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.inactive,
          headerShown: false,
          lazy: true, // ✅ Chargement paresseux
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 80 : 60,
            paddingBottom: Platform.OS === 'ios' ? 20 : 0,
            backgroundColor: colors.background,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: Platform.OS === 'ios' ? 5 : 0,
          },
          tabBarIconStyle: {
            marginTop: Platform.OS === 'ios' ? 5 : 0,
          },
        }}
        backBehavior="initialRoute"
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
                <IconSymbol size={28} name="house.fill" color={color} />
              </Animated.View>
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explorer',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
                <IconSymbol size={28} name="magnifyingglass" color={color} />
              </Animated.View>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
                <IconSymbol size={28} name="bubble.left.fill" color={color} />
              </Animated.View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <Animated.View style={{ transform: [{ scale: focused ? 1.1 : 1 }] }}>
                <IconSymbol size={28} name="person.circle.fill" color={color} />
              </Animated.View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
*/











import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// ========== COMPOSANT D'ANIMATION ==========
// Gère l'animation fluide "effet ressort" pour chaque icône
const AnimatedTabIcon = ({ focused, name, color, size }: { focused: boolean, name: string, color: string, size: number }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    // Utilisation de withSpring pour une transition très fluide
    scale.value = withSpring(focused ? 1.2 : 1, {
      mass: 0.5,
      damping: 12,
      stiffness: 150,
    });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <IconSymbol size={size} name={name as any} color={color} />
    </Animated.View>
  );
};

// ========== MAIN COMPONENT ==========
export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Couleurs basées sur le thème
  const colors = {
    background: isDark ? '#121212' : '#ffffff',
    tint: isDark ? '#BB86FC' : '#6200EE',
    inactive: isDark ? '#777' : '#999',
    text: isDark ? '#FFFFFF' : '#1C1E21',
  };

  return (
    <>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.background}
        translucent={Platform.OS === 'android'}
      />

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.inactive,
          headerShown: false,
          lazy: true,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 80 : 60,
            paddingBottom: Platform.OS === 'ios' ? 20 : 0,
            backgroundColor: colors.background,
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: Platform.OS === 'ios' ? 5 : 0,
          },
          tabBarIconStyle: {
            marginTop: Platform.OS === 'ios' ? 5 : 0,
          },
        }}
        backBehavior="initialRoute"
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="house.fill" color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explorer',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="magnifyingglass" color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chats',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="bubble.left.fill" color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="person.circle.fill" color={color} size={28} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
