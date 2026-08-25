/*
import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  return (
    <>
    
    <ThemedView>
      <Stack.Screen >
      <ThemedView style={styles.container}>
        <ThemedText type="title">vous etes connecter.</ThemedText>
        <Link href="/" style={styles.link}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});

*/



import { Link, Stack } from 'expo-router';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function NotFoundScreen() {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée festive
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      })
    ]).start();

    // Animation de pulsation continue pour l'icône
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <>
      <Stack.Screen options={{ title: 'Connexion Réussie!' }} />
      <ThemedView style={styles.container}>
        
        {/* Cercle de fond animé */}
        <Animated.View 
          style={[
            styles.circle,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }] 
            }
          ]} 
        />
        
        {/* Icône de succès avec confettis */}
        <Animated.View 
          style={[
            styles.iconContainer,
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          
          {/* Éléments festifs autour de l'icône */}
          <View style={styles.confettiContainer}>
            <Ionicons name="star" size={20} color="#FFD700" style={styles.confetti1} />
            <Ionicons name="star" size={16} color="#FF6B6B" style={styles.confetti2} />
            <Ionicons name="star" size={18} color="#4ECDC4" style={styles.confetti3} />
            <Ionicons name="star" size={14} color="#FF9F1C" style={styles.confetti4} />
          </View>
        </Animated.View>

        {/* Message de félicitations */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <ThemedText type="title" style={styles.successTitle}>
            🎉 Félicitations !
          </ThemedText>
          
          <ThemedText type="default" style={styles.successMessage}>
            Vous êtes maintenant connecté(e) à votre compte Ganbanaaxu
          </ThemedText>

          <ThemedText type="defaultSemiBold" style={styles.welcomeText}>
            Bienvenue dans notre communauté ! 🌟
          </ThemedText>
        </Animated.View>

        {/* Bouton pour continuer */}
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <Link href="/(tabs)" style={styles.continueButton}>
            <ThemedText type="link" style={styles.buttonText}>
              Commencer l'aventure →
            </ThemedText>
          </Link>
        </Animated.View>

        {/* Message secondaire */}
        <Animated.View style={{ opacity: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.7]
        }) }}>
          <ThemedText type="subtitle" style={styles.secondaryText}>
            Votre voyage commence maintenant...
          </ThemedText>
        </Animated.View>

      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  iconContainer: {
    marginBottom: 30,
    position: 'relative',
  },
  confettiContainer: {
    position: 'absolute',
    width: 120,
    height: 120,
  },
  confetti1: {
    position: 'absolute',
    top: -10,
    left: -5,
  },
  confetti2: {
    position: 'absolute',
    top: -15,
    right: -8,
  },
  confetti3: {
    position: 'absolute',
    bottom: -12,
    left: -10,
  },
  confetti4: {
    position: 'absolute',
    bottom: -8,
    right: -12,
  },
  successTitle: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 10,
    color: '#4CAF50',
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  welcomeText: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
    color: '#6200EE',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  continueButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});