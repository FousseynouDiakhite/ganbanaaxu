















/*
import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
// Import direct pour un chargement immédiat (natif au bundle)
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// ========== COMPOSANT D'ANIMATION ==========
// Gère l'animation fluide "effet ressort" pour chaque icône
const AnimatedTabIcon = ({ focused, name, color, size }: { focused: boolean, name: keyof typeof Ionicons.glyphMap, color: string, size: number }) => {
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
      <Ionicons size={size} name={name} color={color} />
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
              <AnimatedTabIcon focused={focused} name="home" color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explorer',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="search" color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chats',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="chatbubble" color={color} size={28} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="person-circle" color={color} size={28} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
*/











import React, { useEffect } from 'react';
import { Platform, useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

// Importations nécessaires pour le Swipe Tab Navigator
import { withLayoutContext } from 'expo-router';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Création du navigateur de "Top Tabs" (que l'on va placer en bas)
const { Navigator } = createMaterialTopTabNavigator();
const SwipeTabs = withLayoutContext(Navigator);

// ========== COMPOSANT D'ANIMATION ==========
const AnimatedTabIcon = ({ focused, name, color, size }: { focused: boolean, name: keyof typeof Ionicons.glyphMap, color: string, size: number }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
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
      <Ionicons size={size} name={name} color={color} />
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

      <SwipeTabs
        tabBarPosition="bottom" // ⬅️ C'EST CECI QUI PLACE LA BARRE EN BAS
        screenOptions={{
          swipeEnabled: true, // ⬅️ ACTIVE LE SLIDE ENTRE LES ÉCRANS
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.inactive,
          tabBarShowIcon: true, // Requis pour que les icônes s'affichent sur ce type de navigateur
          tabBarShowLabel: true,
          tabBarIndicatorStyle: {
            height: 0, // Cache la ligne d'indication sous les onglets pour ressembler aux BottomTabs classiques
          },
          tabBarStyle: {
            height: Platform.OS === 'ios' ? 85 : 65, // Légèrement ajusté pour le padding
            paddingBottom: Platform.OS === 'ios' ? 20 : 5,
            backgroundColor: colors.background,
            elevation: 0,
            shadowOpacity: 0,
            borderTopWidth: 1,
            borderColor: isDark ? '#222' : '#eee', // Légère bordure pour séparer le contenu
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            textTransform: 'none', // Empêche le texte de se mettre tout en majuscules (comportement par défaut)
            marginTop: 2,
          },
          tabBarIconStyle: {
            justifyContent: 'center',
            alignItems: 'center',
          },
        }}
      >
        <SwipeTabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="home" color={color} size={26} />
            ),
          }}
        />
        <SwipeTabs.Screen
          name="explore"
          options={{
            title: 'Explorer',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="search" color={color} size={26} />
            ),
          }}
        />
        <SwipeTabs.Screen
          name="chat"
          options={{
            title: 'Chats',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="chatbubble" color={color} size={26} />
            ),
          }}
        />
        <SwipeTabs.Screen
          name="profile"
          options={{
            title: 'Profil',
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon focused={focused} name="person-circle" color={color} size={26} />
            ),
          }}
        />
      </SwipeTabs>
    </>
  );
}



