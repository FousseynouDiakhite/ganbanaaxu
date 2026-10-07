

































/*
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ========== THEME ==========
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  primary: isDark ? '#BB86FC' : '#6200EE',
  inputBackground: isDark ? '#1A1A1A' : '#FFF',
  inputBorder: isDark ? '#2D2D2D' : '#E2E8F0',
  inputFocusBorder: isDark ? '#BB86FC' : '#6200EE',
  errorBackground: isDark ? '#D32F2F20' : '#FFEBEE',
  errorText: isDark ? '#ff6b6b' : '#D32F2F',
  errorBorder: isDark ? '#D32F2F40' : '#FFCDD2',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Mémorisation des styles
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 36 },
    headerTitle: {
      fontSize: 34,
      fontWeight: 'bold',
      color: colors.primary,
      letterSpacing: 0.5
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 10,
      lineHeight: 20
    },
    formSection: { width: '100%' },
    inputContainer: {
      flexDirection: 'row',
      width: '100%',
      height: 50,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: colors.inputBackground,
      alignItems: 'center',
      overflow: 'hidden'
    },
    inputFocused: { borderColor: colors.inputFocusBorder },
    textInput: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 16,
      color: colors.text,
      fontSize: 15
    },
    eyeButton: {
      paddingHorizontal: 16,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center'
    },
    eyeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary
    },
    authButton: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 2
    },
    authButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    switchModeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
      alignItems: 'center'
    },
    switchModeText: {
      color: colors.textSecondary,
      marginRight: 6,
      fontSize: 14
    },
    switchModeButton: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14
    },
    errorContainer: {
      backgroundColor: colors.errorBackground,
      padding: 12,
      borderRadius: 10,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.errorBorder
    },
    errorText: {
      color: colors.errorText,
      textAlign: 'center',
      fontWeight: '500',
      fontSize: 13
    },
  }), [colors]);

  // VÉRIFICATION DE SESSION ET TRANSITION SANS FLICKER
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    const checkSessionInstantly = async () => {
      try {
        // 1. Vérification du stockage local
        const isLocallyLoggedIn = await AsyncStorage.getItem('@is_logged_in');

        if (!isMounted) return;

        if (isLocallyLoggedIn === 'true') {
          // Masquer le splash screen avant la navigation
          SplashScreen.hideAsync().catch(() => {});
          
          setTimeout(() => {
            if (isMounted) router.replace('/(tabs)');
          }, 10);
          return;
        }

        // 2. Si non connecté localement, vérification rapide auprès de Supabase
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 1500)
        );

        const response = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (!isMounted) return;

        if (response?.data?.session) {
          await AsyncStorage.setItem('@is_logged_in', 'true');
          
          // Revérification après l'opération asynchrone AsyncStorage
          if (!isMounted) return;

          SplashScreen.hideAsync().catch(() => {});
          
          setTimeout(() => {
            if (isMounted) router.replace('/(tabs)');
          }, 10);
          return;
        }
      } catch (error) {
        console.log("Session check error:", error);
      }

      // 3. Si aucun compte n'est connecté, afficher le formulaire de connexion
      if (isMounted) {
        setLoading(false);
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    checkSessionInstantly();

    // 4. Écouteur d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          await AsyncStorage.setItem('@is_logged_in', 'true');
          
          // Sécurité indispensable ici aussi !
          if (!isMounted) return;
          
          setTimeout(() => {
             if (isMounted) router.replace('/(tabs)');
          }, 10);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key, router]);

  const handleAuth = useCallback(async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isSignUpMode) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (signUpError) throw signUpError;

        Alert.alert(
          'Succès !',
          'Compte créé avec succès ! Connectez-vous à présent.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setPassword('');
        setLoading(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
        
        // La navigation est gérée par le onAuthStateChange dans le useEffect
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (err.message?.includes('already been registered')) {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (err.message?.includes('weak password')) {
        errorMessage = 'Le mot de passe est trop faible (min 6 caractères).';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }, [email, password, isSignUpMode]);

  const toggleMode = useCallback(() => {
    setError('');
    setIsSignUpMode((prev) => !prev);
    setPassword('');
  }, []);

  // ÉCRAN DE CHARGEMENT ÉLÉGANT (Remplace l'écran noir)
  if (!rootNavigationState?.key || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={Platform.OS === 'android'}
        />
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, marginBottom: 20 }}>
          Ganbanaaxu
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte pour commencer' : 'Bienvenue ! Connectez-vous à votre compte'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <View style={[styles.inputContainer, isEmailFocused && styles.inputFocused]}>
              <TextInput
                style={styles.textInput}
                placeholder="Adresse email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>

            <View style={[styles.inputContainer, isPasswordFocused && styles.inputFocused]}>
              <TextInput
                style={styles.textInput}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                editable={!loading}
                autoCapitalize="none"
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeText}>
                  {secureTextEntry ? 'Afficher' : 'Masquer'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.authButton}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isSignUpMode ? "Créer mon compte" : "Se connecter"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>
                {isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
              </Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={styles.switchModeButton}>
                  {isSignUpMode ? 'Se connecter' : "S'inscrire"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

*/




















import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

// ========== THEME ==========
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  primary: isDark ? '#BB86FC' : '#6200EE',
  inputBackground: isDark ? '#1A1A1A' : '#FFF',
  inputBorder: isDark ? '#2D2D2D' : '#E2E8F0',
  inputFocusBorder: isDark ? '#BB86FC' : '#6200EE',
  errorBackground: isDark ? '#D32F2F20' : '#FFEBEE',
  errorText: isDark ? '#ff6b6b' : '#D32F2F',
  errorBorder: isDark ? '#D32F2F40' : '#FFCDD2',
  googleButtonBg: isDark ? '#1E1E1E' : '#FFF',
  googleButtonBorder: isDark ? '#333' : '#DADCE0',
  googleButtonText: isDark ? '#FFF' : '#3C4043',
});

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Mémorisation des styles
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 36 },
    headerTitle: {
      fontSize: 34,
      fontWeight: 'bold',
      color: colors.primary,
      letterSpacing: 0.5
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 10,
      lineHeight: 20
    },
    formSection: { width: '100%' },
    inputContainer: {
      flexDirection: 'row',
      width: '100%',
      height: 50,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      marginBottom: 16,
      backgroundColor: colors.inputBackground,
      alignItems: 'center',
      overflow: 'hidden'
    },
    inputFocused: { borderColor: colors.inputFocusBorder },
    textInput: {
      flex: 1,
      height: '100%',
      paddingHorizontal: 16,
      color: colors.text,
      fontSize: 15
    },
    eyeButton: {
      paddingHorizontal: 16,
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center'
    },
    eyeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary
    },
    authButton: {
      backgroundColor: colors.primary,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 2
    },
    authButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.inputBorder,
    },
    dividerText: {
      marginHorizontal: 10,
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '500',
    },
    googleButton: {
      flexDirection: 'row',
      backgroundColor: colors.googleButtonBg,
      borderWidth: 1.5,
      borderColor: colors.googleButtonBorder,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1
    },
    googleButtonText: {
      color: colors.googleButtonText,
      fontSize: 15,
      fontWeight: '600',
      marginLeft: 10,
    },
    switchModeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 24,
      alignItems: 'center'
    },
    switchModeText: {
      color: colors.textSecondary,
      marginRight: 6,
      fontSize: 14
    },
    switchModeButton: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 14
    },
    errorContainer: {
      backgroundColor: colors.errorBackground,
      padding: 12,
      borderRadius: 10,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.errorBorder
    },
    errorText: {
      color: colors.errorText,
      textAlign: 'center',
      fontWeight: '500',
      fontSize: 13
    },
  }), [colors]);

  // VÉRIFICATION DE SESSION ET TRANSITION SANS FLICKER
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    const checkSessionInstantly = async () => {
      try {
        const isLocallyLoggedIn = await AsyncStorage.getItem('@is_logged_in');

        if (!isMounted) return;

        if (isLocallyLoggedIn === 'true') {
          SplashScreen.hideAsync().catch(() => {});
          setTimeout(() => {
            if (isMounted) router.replace('/(tabs)');
          }, 10);
          return;
        }

        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT')), 1500)
        );

        const response = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (!isMounted) return;

        if (response?.data?.session) {
          await AsyncStorage.setItem('@is_logged_in', 'true');
          if (!isMounted) return;

          SplashScreen.hideAsync().catch(() => {});
          setTimeout(() => {
            if (isMounted) router.replace('/(tabs)');
          }, 10);
          return;
        }
      } catch (error) {
        console.log("Session check error:", error);
      }

      if (isMounted) {
        setLoading(false);
        SplashScreen.hideAsync().catch(() => {});
      }
    };

    checkSessionInstantly();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          await AsyncStorage.setItem('@is_logged_in', 'true');
          if (!isMounted) return;
          
          setTimeout(() => {
             if (isMounted) router.replace('/(tabs)');
          }, 10);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key, router]);

  // --- CONNEXION GOOGLE CORRIGÉE (PKCE FLOW) ---
  const handleGoogleLogin = useCallback(async () => {
    try {
      setError('');
      setLoading(true);

      const redirectTo = AuthSession.makeRedirectUri({
        scheme: 'ganbanaaxu',
        path: 'auth/callback',
      });

      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) throw oauthError;
      if (!data?.url) throw new Error("URL d'authentification Google introuvable.");

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

      if (res.type === 'success' && res.url) {
        const url = new URL(res.url);
        
        // Récupération du code PKCE retourné par Supabase/Google
        const code = url.searchParams.get('code');

        if (code) {
          // Échange sécurisé du code contre une session active
          const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
          if (sessionError) throw sessionError;
        } else {
          // Fallback au cas où des tokens directs seraient présents
          const accessToken = url.searchParams.get('access_token') || new URLSearchParams(url.hash.substring(1)).get('access_token');
          const refreshToken = url.searchParams.get('refresh_token') || new URLSearchParams(url.hash.substring(1)).get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }

        // Validation finale de la session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session) {
          await AsyncStorage.setItem('@is_logged_in', 'true');
          router.replace('/(tabs)');
        } else {
          throw new Error("Impossible d'établir la session après l'authentification Google.");
        }
      }
    } catch (err: any) {
      setError(err.message || "Échec de la connexion avec Google.");
      setLoading(false);
    }
  }, [router]);

  const handleAuth = useCallback(async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (isSignUpMode) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
        });
        if (signUpError) throw signUpError;

        Alert.alert(
          'Succès !',
          'Compte créé avec succès ! Connectez-vous à présent.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setPassword('');
        setLoading(false);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (err.message?.includes('already been registered')) {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (err.message?.includes('weak password')) {
        errorMessage = 'Le mot de passe est trop faible (min 6 caractères).';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setLoading(false);
    }
  }, [email, password, isSignUpMode]);

  const toggleMode = useCallback(() => {
    setError('');
    setIsSignUpMode((prev) => !prev);
    setPassword('');
  }, []);

  if (!rootNavigationState?.key || loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={Platform.OS === 'android'}
        />
        <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.primary, marginBottom: 20 }}>
          Ganbanaaxu
        </Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte pour commencer' : 'Bienvenue ! Connectez-vous à votre compte'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <View style={[styles.inputContainer, isEmailFocused && styles.inputFocused]}>
              <TextInput
                style={styles.textInput}
                placeholder="Adresse email"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
            </View>

            <View style={[styles.inputContainer, isPasswordFocused && styles.inputFocused]}>
              <TextInput
                style={styles.textInput}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                editable={!loading}
                autoCapitalize="none"
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setSecureTextEntry(!secureTextEntry)}
                activeOpacity={0.7}
              >
                <Text style={styles.eyeText}>
                  {secureTextEntry ? 'Afficher' : 'Masquer'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.authButton}
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isSignUpMode ? "Créer mon compte" : "Se connecter"}
                </Text>
              )}
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Bouton de Connexion Google */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>
                {isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
              </Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={styles.switchModeButton}>
                  {isSignUpMode ? 'Se connecter' : "S'inscrire"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
