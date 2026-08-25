



/*

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useUser, useSignUp, useSignIn, useOAuth, useAuth } from '@clerk/clerk-expo';
import { Redirect, useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// On importe les fonctions utilitaires (assure-toi que ces chemins sont corrects)
import { checkCachedAuth, cacheAuthentication } from '@/lib/authCache';

// --- Configuration ---
WebBrowser.maybeCompleteAuthSession();
const AUTH_CACHE_KEY = 'user_cached_auth';

const AuthScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const { isLoaded: signUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const { isLoaded: signInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const { user } = useUser();
  const router = useRouter();
  
  const redirectUrl = Linking.createURL('oauth-native-callback');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // --- Fonctions de cache directes ---
  const saveToCache = async (userId: string) => {
    try {
      await SecureStore.setItemAsync(AUTH_CACHE_KEY, userId);
      console.log('✅ Cache mis à jour manuellement');
    } catch (e) {
      console.error('Erreur stockage cache:', e);
    }
  };

  // --- Logique d'authentification ---

  // 1. Inscription
  const handleSignUp = async () => {
    if (!signUpLoaded || loading) return;
    setError('');
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification();
      setPendingVerification(true);
      Alert.alert('Vérification requise', 'Un code a été envoyé à votre email.');
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Vérification du code (Inscription)
  const handleVerify = async () => {
    if (!signUpLoaded || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') {
        // MISE EN CACHE AVANT ACTIVATION
        if (result.createdUserId) {
          await saveToCache(result.createdUserId);
        }
        await setSignUpActive({ session: result.createdSessionId });
      } else {
        setError('Code invalide ou expiré.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Échec de la vérification.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Connexion Classique
  const handleSignIn = async () => {
    if (!signInLoaded || loading) return;
    setError('');
    setLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') {
        // MISE EN CACHE AVANT ACTIVATION
        if (result.createdUserId) {
          await saveToCache(result.createdUserId);
        }
        await setSignInActive({ session: result.createdSessionId });
      } else {
        setError('Échec de la connexion.');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Connexion échouée.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Connexion Google
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { createdSessionId, setActive, createdUserId } = await startOAuthFlow({ redirectUrl });
      if (createdSessionId && setActive) {
        // MISE EN CACHE AVANT ACTIVATION
        const userId = createdUserId || (user?.id);
        if (userId) {
          await saveToCache(userId);
        }
        await setActive({ session: createdSessionId });
      }
    } catch (err: any) {
      console.error('Erreur OAuth Google:', err);
      setError(err.errors?.[0]?.message || 'Connexion Google échouée.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setPendingVerification(false);
    setIsSignUpMode(!isSignUpMode);
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#121212' : '#f8f9fa'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {pendingVerification ? (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Vérification Email</Text>
              <TextInput
                style={styles.input}
                placeholder='Entrez votre code'
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                value={code}
                onChangeText={setCode}
                keyboardType='number-pad'
              />
              <TouchableOpacity
                style={[styles.authButton, loading && styles.buttonDisabled]}
                onPress={handleVerify}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authButtonText}>Vérifier le code</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formSection}>
              <View style={styles.socialSection}>
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  style={[styles.googleButton, loading && styles.buttonDisabled]}
                  disabled={loading}
                >
                  <Image
                    source={require('@/assets/images/google internet icon.png')}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continuer avec Google</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.separator}>
                <View style={styles.separatorLine} /><Text style={styles.separatorText}>Ou</Text><View style={styles.separatorLine} />
              </View>

              <View style={styles.emailSection}>
                <TextInput
                  style={styles.input}
                  placeholder='Adresse email'
                  placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize='none'
                />
                <TextInput
                  style={styles.input}
                  placeholder='Mot de passe'
                  placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={[styles.authButton, loading && styles.buttonDisabled]}
                  onPress={isSignUpMode ? handleSignUp : handleSignIn}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authButtonText}>{isSignUpMode ? "Créer mon compte" : 'Se connecter'}</Text>}
                </TouchableOpacity>
              </View>

              <View style={styles.switchModeContainer}>
                <Text style={styles.switchModeText}>{isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}</Text>
                <TouchableOpacity onPress={toggleMode} disabled={loading}>
                  <Text style={styles.switchModeButton}>{isSignUpMode ? 'Se connecter' : "S'inscrire"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- COMPOSANT INDEX (Logique de redirection) ---
export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const [cachedAuth, setCachedAuth] = React.useState<string | null>(null);
  const [cacheChecked, setCacheChecked] = React.useState(false);

  React.useEffect(() => {
    const init = async () => {
      try {
        const id = await SecureStore.getItemAsync(AUTH_CACHE_KEY);
        setCachedAuth(id);
      } finally {
        setCacheChecked(true);
      }
    };
    init();
  }, []);

  // Redirection immédiate si cache trouvé
  if (cacheChecked && cachedAuth) {
    return <Redirect href="/(tabs)" />;
  }

  // Redirection si session Clerk active
  if (isLoaded && isSignedIn) {
    return <Redirect href="/(tabs)" />;
  }

  // Affichage de l'écran d'auth si rien n'est trouvé
  if (isLoaded && cacheChecked && !cachedAuth && !isSignedIn) {
    return <AuthScreen />;
  }

  return null;
}

// --- Styles ---
const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE' },
    headerSubtitle: { fontSize: 16, color: isDark ? '#CCC' : '#666', textAlign: 'center' },
    formSection: { width: '100%' },
    socialSection: { marginBottom: 24 },
    emailSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: isDark ? '#FFF' : '#333', marginBottom: 16, textAlign: 'center' },
    input: { width: '100%', padding: 16, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 12, marginBottom: 16, color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
    authButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: isDark ? '#2D2D2D' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD' },
    googleIcon: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { color: isDark ? '#FFF' : '#000', fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    separatorLine: { flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#DDD' },
    separatorText: { marginHorizontal: 16, color: isDark ? '#888' : '#999' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    switchModeText: { color: isDark ? '#CCC' : '#666', marginRight: 8 },
    switchModeButton: { color: '#6200EE', fontWeight: '600' },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 24 },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center' },
  });
};

*/







/*

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';

// --- Configuration Supabase ---
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

WebBrowser.maybeCompleteAuthSession();
const AUTH_CACHE_KEY = 'supabase_session';

// Schéma de l'application pour le deep linking
const scheme = 'ganbanaaxu';
const redirectUri = makeRedirectUri({
  scheme: scheme,
  path: 'auth/callback'
});


const AuthScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vérifier si une session existe au chargement
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await saveSessionToCache(session);
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
    }
  };

  const saveSessionToCache = async (session: any) => {
    try {
      await SecureStore.setItemAsync(AUTH_CACHE_KEY, JSON.stringify(session));
      console.log('✅ Session sauvegardée dans le cache');
    } catch (e) {
      console.error('Erreur stockage session:', e);
    }
  };

  // Inscription avec email/mot de passe
  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        Alert.alert(
          'Inscription réussie!',
          'Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail.',
          [{ text: 'OK' }]
        );
        // Passer en mode connexion
        setIsSignUpMode(false);
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  // Connexion avec email/mot de passe
  const handleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        await saveSessionToCache(data.session);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  // Connexion avec Google
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });
      
      if (error) throw error;
      
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        
        if (result.type === 'success') {
          // Récupérer la session après le callback
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            await saveSessionToCache(session);
            router.replace('/(tabs)');
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur Google:', err);
      setError(err.message || "Connexion Google échouée.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#121212' : '#f8f9fa'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            
            <View style={styles.socialSection}>
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                style={[styles.googleButton, loading && styles.buttonDisabled]}
                disabled={loading}
              >
                <Image
                  source={require('@/assets/images/google internet icon.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Ou</Text>
              <View style={styles.separatorLine} />
            </View>

            
            <View style={styles.emailSection}>
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.authButton, loading && styles.buttonDisabled]}
                onPress={isSignUpMode ? handleSignUp : handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isSignUpMode ? "Créer mon compte" : "Se connecter"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          
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
};

// --- COMPOSANT INDEX (Logique de redirection) ---
export default function Index() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      // Vérifier dans le cache SecureStore
      const cachedSession = await SecureStore.getItemAsync(AUTH_CACHE_KEY);
      if (cachedSession) {
        setHasSession(true);
        setSessionChecked(true);
        router.replace('/(tabs)');
        return;
      }

      // Vérifier avec Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await SecureStore.setItemAsync(AUTH_CACHE_KEY, JSON.stringify(session));
        setHasSession(true);
        setSessionChecked(true);
        router.replace('/(tabs)');
        return;
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
    } finally {
      setSessionChecked(true);
    }
  };

  if (!sessionChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return <AuthScreen />;
}

// --- Styles ---
const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE' },
    headerSubtitle: { fontSize: 16, color: isDark ? '#CCC' : '#666', textAlign: 'center' },
    formSection: { width: '100%' },
    socialSection: { marginBottom: 24 },
    emailSection: { marginBottom: 24 },
    input: { width: '100%', padding: 16, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 12, marginBottom: 16, color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
    authButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: isDark ? '#2D2D2D' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD' },
    googleIcon: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { color: isDark ? '#FFF' : '#000', fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    separatorLine: { flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#DDD' },
    separatorText: { marginHorizontal: 16, color: isDark ? '#888' : '#999' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    switchModeText: { color: isDark ? '#CCC' : '#666', marginRight: 8 },
    switchModeButton: { color: '#6200EE', fontWeight: '600' },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 24 },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center' },
  });
};

*/



/*
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

// --- Configuration Supabase ---
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

WebBrowser.maybeCompleteAuthSession();
const AUTH_CACHE_KEY = 'supabase_session';

const AuthScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vérifier si une session existe au chargement
  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await saveSessionToCache(session);
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
    }
  };

  const saveSessionToCache = async (session: any) => {
    try {
      await SecureStore.setItemAsync(AUTH_CACHE_KEY, JSON.stringify(session));
      console.log('✅ Session sauvegardée');
    } catch (e) {
      console.error('Erreur stockage session:', e);
    }
  };

  // Inscription
  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        Alert.alert(
          'Inscription réussie!',
          'Un email de confirmation a été envoyé.',
          [{ text: 'OK' }]
        );
        setIsSignUpMode(false);
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  // Connexion
  const handleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        await saveSessionToCache(data.session);
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };



  

  const toggleMode = () => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colorScheme === 'dark' ? '#121212' : '#f8f9fa'}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            
            <View style={styles.socialSection}>
              <TouchableOpacity
                onPress={handleGoogleSignIn}
                style={[styles.googleButton, loading && styles.buttonDisabled]}
                disabled={loading}
              >
                <Image
                  source={require('@/assets/images/google internet icon.png')}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Continuer avec Google</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Ou</Text>
              <View style={styles.separatorLine} />
            </View>

            
            <View style={styles.emailSection}>
              <TextInput
                style={styles.input}
                placeholder="Adresse email"
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.authButton, loading && styles.buttonDisabled]}
                onPress={isSignUpMode ? handleSignUp : handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.authButtonText}>
                    {isSignUpMode ? "Créer mon compte" : "Se connecter"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

          
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
};

// --- COMPOSANT INDEX ---
export default function Index() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await SecureStore.setItemAsync(AUTH_CACHE_KEY, JSON.stringify(session));
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Erreur vérification session:', error);
    } finally {
      setSessionChecked(true);
    }
  };

  if (!sessionChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return <AuthScreen />;
}

// --- Styles ---
const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE' },
    headerSubtitle: { fontSize: 16, color: isDark ? '#CCC' : '#666', textAlign: 'center' },
    formSection: { width: '100%' },
    socialSection: { marginBottom: 24 },
    emailSection: { marginBottom: 24 },
    input: { width: '100%', padding: 16, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 12, marginBottom: 16, color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
    authButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: isDark ? '#2D2D2D' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD' },
    googleIcon: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { color: isDark ? '#FFF' : '#000', fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 24 },
    separatorLine: { flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#DDD' },
    separatorText: { marginHorizontal: 16, color: isDark ? '#888' : '#999' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
    switchModeText: { color: isDark ? '#CCC' : '#666', marginRight: 8 },
    switchModeButton: { color: '#6200EE', fontWeight: '600' },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 24 },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center' },
  });
};
*/

















/*
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { Session } from '@supabase/supabase-js';

// Configuration Supabase
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: async (key) => {
        return await SecureStore.getItemAsync(key);
      },
      setItem: async (key, value) => {
        await SecureStore.setItemAsync(key, value);
      },
      removeItem: async (key) => {
        await SecureStore.deleteItemAsync(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

WebBrowser.maybeCompleteAuthSession();
const AUTH_CACHE_KEY = 'supabase_session';
*/











/*
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

// Configuration Supabase identique à _layout
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: async (key) => {
        try {
          const value = await SecureStore.getItemAsync(key);
          return value ? JSON.parse(value) : null;
        } catch {
          return null;
        }
      },
      setItem: async (key, value) => {
        try {
          const minimalSession = {
            access_token: value?.access_token,
            refresh_token: value?.refresh_token,
            expires_at: value?.expires_at,
            user: {
              id: value?.user?.id,
              email: value?.user?.email,
            }
          };
          await SecureStore.setItemAsync(key, JSON.stringify(minimalSession));
        } catch (error) {
          console.error('Erreur stockage:', error);
        }
      },
      removeItem: async (key) => {
        await SecureStore.deleteItemAsync(key);
      },
    },
    autoRefreshToken: true,
    persistSession: true,
  },
});

WebBrowser.maybeCompleteAuthSession();



const AuthScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vérifier la session au chargement
  useEffect(() => {
    checkUser();
    
    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (session) {
        router.replace('/(tabs)');
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session exists:', !!session);
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  // Inscription
  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        Alert.alert(
          'Succès!',
          'Compte créé! Vous pouvez maintenant vous connecter.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  // Connexion email/password
  const handleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        console.log('Connexion réussie!');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  // Connexion Google
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://tuciyiawyawrhifpjmmn.supabase.co/auth/v1/callback',
        },
      });
      
      if (error) throw error;
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'https://tuciyiawyawrhifpjmmn.supabase.co/auth/v1/callback'
        );
        
        if (result.type === 'success') {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            router.replace('/(tabs)');
          }
        }
      }
    } catch (err: any) {
      console.error('Erreur Google:', err);
      setError(err.message || "Connexion Google échouée.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              <Image source={require('@/assets/images/google internet icon.png')} style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Ou</Text>
              <View style={styles.separatorLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            
            <TouchableOpacity
              style={[styles.authButton, loading && styles.buttonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authButtonText}>{isSignUpMode ? "Créer mon compte" : "Se connecter"}</Text>}
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>{isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}</Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={styles.switchModeButton}>{isSignUpMode ? 'Se connecter' : "S'inscrire"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Composant principal
export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session check:', !!session);
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Session error:', error);
    } finally {
      setIsReady(true);
    }
  };

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return <AuthScreen />;
}

const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE' },
    headerSubtitle: { fontSize: 16, color: isDark ? '#CCC' : '#666', textAlign: 'center' },
    formSection: { width: '100%' },
    input: { width: '100%', padding: 16, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 12, marginBottom: 16, color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
    authButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: isDark ? '#2D2D2D' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', marginBottom: 16 },
    googleIcon: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { color: isDark ? '#FFF' : '#000', fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    separatorLine: { flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#DDD' },
    separatorText: { marginHorizontal: 16, color: isDark ? '#888' : '#999' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    switchModeText: { color: isDark ? '#CCC' : '#666', marginRight: 8 },
    switchModeButton: { color: '#6200EE', fontWeight: '600' },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 20 },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center' },
  });
};

*/














/*
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

// Configuration Supabase
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vérifier la session au chargement
  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        router.replace('/(tabs)');
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        Alert.alert(
          'Succès!',
          'Compte créé! Connectez-vous maintenant.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://tuciyiawyawrhifpjmmn.supabase.co/auth/v1/callback',
        },
      });
      
      if (error) throw error;
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'https://tuciyiawyawrhifpjmmn.supabase.co/auth/v1/callback'
        );
        
        if (result.type === 'success') {
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      console.error('Erreur Google:', err);
      setError(err.message || "Connexion Google échouée.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              <Image source={require('@/assets/images/google internet icon.png')} style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Ou</Text>
              <View style={styles.separatorLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            
            <TouchableOpacity
              style={[styles.authButton, loading && styles.buttonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authButtonText}>{isSignUpMode ? "Créer mon compte" : "Se connecter"}</Text>}
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>{isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}</Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={styles.switchModeButton}>{isSignUpMode ? 'Se connecter' : "S'inscrire"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Session error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return <AuthScreen />;
}

const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE' },
    headerSubtitle: { fontSize: 16, color: isDark ? '#CCC' : '#666', textAlign: 'center' },
    formSection: { width: '100%' },
    input: { width: '100%', padding: 16, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 12, marginBottom: 16, color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
    authButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: isDark ? '#2D2D2D' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', marginBottom: 16 },
    googleIcon: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { color: isDark ? '#FFF' : '#000', fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    separatorLine: { flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#DDD' },
    separatorText: { marginHorizontal: 16, color: isDark ? '#888' : '#999' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    switchModeText: { color: isDark ? '#CCC' : '#666', marginRight: 8 },
    switchModeButton: { color: '#6200EE', fontWeight: '600' },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 20 },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center' },
  });
};

*/











/*


import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

// Configuration Supabase
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});

WebBrowser.maybeCompleteAuthSession();

const AuthScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Vérifier la session au chargement
  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (session) {
        router.replace('/(tabs)');
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  };

  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        Alert.alert(
          'Succès!',
          'Compte créé! Connectez-vous maintenant.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        console.log('Connexion réussie!');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://tuciyiawyawrhifpjmmn.supabase.co/auth/v1/callback',
        },
      });
      
      if (error) throw error;
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'https://tuciyiawyawrhifpjmmn.supabase.co/auth/v1/callback'
        );
        
        if (result.type === 'success') {
          console.log('Google connexion réussie!');
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      console.error('Erreur Google:', err);
      setError(err.message || "Connexion Google échouée.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setEmail('');
    setPassword('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              <Image source={require('@/assets/images/google internet icon.png')} style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Ou</Text>
              <View style={styles.separatorLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            
            <TouchableOpacity
              style={[styles.authButton, loading && styles.buttonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authButtonText}>{isSignUpMode ? "Créer mon compte" : "Se connecter"}</Text>}
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>{isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}</Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={styles.switchModeButton}>{isSignUpMode ? 'Se connecter' : "S'inscrire"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Session error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return <AuthScreen />;
}

const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE' },
    headerSubtitle: { fontSize: 16, color: isDark ? '#CCC' : '#666', textAlign: 'center' },
    formSection: { width: '100%' },
    input: { width: '100%', padding: 16, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 12, marginBottom: 16, color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
    authButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: isDark ? '#2D2D2D' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', marginBottom: 16 },
    googleIcon: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { color: isDark ? '#FFF' : '#000', fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    separatorLine: { flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#DDD' },
    separatorText: { marginHorizontal: 16, color: isDark ? '#888' : '#999' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    switchModeText: { color: isDark ? '#CCC' : '#666', marginRight: 8 },
    switchModeButton: { color: '#6200EE', fontWeight: '600' },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 20 },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center' },
  });
};
*/











/*

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';

// Configuration Supabase
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});

WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Cycle de vie unique : Vérification de session initiale et écoute des changements d'état
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.replace('/(tabs)');
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (session) {
        router.replace('/(tabs)');
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        Alert.alert(
          'Succès!',
          'Compte créé! Connectez-vous maintenant.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        console.log('Connexion réussie!');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };
/*
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'ganbanaaxu://auth/callback' //'ganbanaaxu://redirect' //'https://tuciyiawyawrhifpjmmn.supabase.co/auth/v1/callback',
        },
      });
      
      if (oauthError) throw oauthError;
      
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
         'https://tuciyiawyawrhifpjmmn.supabase.co/auth/v1/callback'
        );
        
        if (result.type === 'success') {
          console.log('Google connexion réussie!');
          router.replace('/(tabs)');
        }
      }
    } catch (err: any) {
      console.error('Erreur Google:', err);
      setError(err.message || "Connexion Google échouée.");
    } finally {
      setLoading(false);
    }
  };
*/



/*
const handleGoogleSignIn = async () => {
  setError('');
  setLoading(true);
  try {
    // 1. On définit l'URL de redirection (doit correspondre à votre dashboard Supabase)
    // Si vous utilisez Expo Go pour vos tests, remplacez temporairement par 'exp://localhost:8081'
    const redirectUrl = 'ganbanaaxu://auth/callback';

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl, 
      },
    });
    
    if (oauthError) throw oauthError;
    
    if (data?.url) {
      // 2. CORRECTION : On passe l'URL de redirection de l'application au WebBrowser
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl // Navigue à nouveau vers votre app mobile une fois connecté
      );
      
      if (result.type === 'success') {
        console.log('Google connexion réussie!');
        router.replace('/(tabs)');
      }
    }
  } catch (err: any) {
    console.error('Erreur Google:', err);
    setError(err.message || "Connexion Google échouée.");
  } finally {
    setLoading(false);
  }
};





  const toggleMode = () => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setEmail('');
    setPassword('');
  };

  if (isInitializing) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              <Image source={require('@/assets/images/google internet icon.png')} style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Ou</Text>
              <View style={styles.separatorLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            
            <TouchableOpacity
              style={[styles.authButton, loading && styles.buttonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authButtonText}>{isSignUpMode ? "Créer mon compte" : "Se connecter"}</Text>}
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>{isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}</Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={styles.switchModeButton}>{isSignUpMode ? 'Se connecter' : "S'inscrire"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE' },
    headerSubtitle: { fontSize: 16, color: isDark ? '#CCC' : '#666', textAlign: 'center' },
    formSection: { width: '100%' },
    input: { width: '100%', padding: 16, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 12, marginBottom: 16, color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
    authButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: isDark ? '#2D2D2D' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', marginBottom: 16 },
    googleIcon: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { color: isDark ? '#FFF' : '#000', fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    separatorLine: { flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#DDD' },
    separatorText: { marginHorizontal: 16, color: isDark ? '#888' : '#999' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    switchModeText: { color: isDark ? '#CCC' : '#666', marginRight: 8 },
    switchModeButton: { color: '#6200EE', fontWeight: '600' },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 20 },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center' },
  });
};

*/







/*
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

// Configuration Supabase
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // CRITIQUE : Empêche Supabase d'intercepter l'URL en double au même moment que WebBrowser
  },
});

// Indispensable pour éviter que la session d'authentification web reste figée en arrière-plan
WebBrowser.maybeCompleteAuthSession();

export default function Index() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Vérification de session initiale et écoute des changements d'état
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.replace('/(tabs)');
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      if (session && event === 'SIGNED_IN') {
        router.replace('/(tabs)');
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        Alert.alert(
          'Succès!',
          'Compte créé! Connectez-vous maintenant.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        console.log('Connexion réussie!');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || "Échec de la connexion.");
    } finally {
      setLoading(false);
    }
  };



const handleGoogleSignIn = async () => {
  setError('');
  setLoading(true);
  try {
    const redirectUrl = 'ganbanaaxuscheme://auth/callback';

    // 1. On demande l'authentification en forçant le flux de jeton direct (Implicit)
    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true, 
        queryParams: {
          prompt: 'select_account', // Permet de forcer le choix du compte
        }
      },
    });
    
    if (oauthError) throw oauthError;
    
    if (data?.url) {
      // 2. Ouvrir le navigateur
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
      
      if (result.type === 'success' && result.url) {
        console.log('--- URL REÇUE ---', result.url);

        // Analyse de l'URL pour extraire directement les jetons transmis par hachage (#)
        const urlObj = Linking.parse(result.url.replace('#', '?'));
        const { access_token, refresh_token, error, error_description } = urlObj.queryParams || {};

        if (error || result.url.includes('error=')) {
          const msg = error_description || error || "Erreur d'échange";
          throw new Error(`Serveur : ${decodeURIComponent(msg as string)}`);
        }

        if (access_token) {
          // 3. Connexion directe en injectant les jetons reçus
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: access_token as string,
            refresh_token: (refresh_token as string) || '',
          });

          if (sessionError) throw sessionError;
          
          console.log('Connexion réussie !');
          router.replace('/(tabs)');
        } else {
          // Si Supabase renvoie un paramètre "code", on tente de l'échanger en dernier recours
          const code = urlObj.queryParams?.code;
          if (code) {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string);
            if (exchangeError) throw exchangeError;
            router.replace('/(tabs)');
          } else {
            throw new Error("Aucun jeton d'accès n'a été trouvé dans la réponse.");
          }
        }
      }
    }
  } catch (err: any) {
    console.error('Erreur Google:', err);
    setError(err.message || "Connexion Google échouée.");
  } finally {
    setLoading(false);
  }
};




  const toggleMode = () => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setEmail('');
    setPassword('');
  };

  if (isInitializing) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Ganbanaaxu</Text>
            <Text style={styles.headerSubtitle}>
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous'}
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.formSection}>
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              style={[styles.googleButton, loading && styles.buttonDisabled]}
              disabled={loading}
            >
              <Image source={require('@/assets/images/google internet icon.png')} style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Continuer avec Google</Text>
            </TouchableOpacity>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>Ou</Text>
              <View style={styles.separatorLine} />
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
              placeholderTextColor={colorScheme === 'dark' ? '#888' : '#999'}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
            
            <TouchableOpacity
              style={[styles.authButton, loading && styles.buttonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleSignIn}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.authButtonText}>{isSignUpMode ? "Créer mon compte" : "Se connecter"}</Text>}
            </TouchableOpacity>

            <View style={styles.switchModeContainer}>
              <Text style={styles.switchModeText}>{isSignUpMode ? 'Déjà un compte ?' : 'Pas encore de compte ?'}</Text>
              <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={styles.switchModeButton}>{isSignUpMode ? 'Se connecter' : "S'inscrire"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    headerTitle: { fontSize: 32, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE' },
    headerSubtitle: { fontSize: 16, color: isDark ? '#CCC' : '#666', textAlign: 'center' },
    formSection: { width: '100%' },
    input: { width: '100%', padding: 16, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', borderRadius: 12, marginBottom: 16, color: isDark ? '#FFF' : '#000', backgroundColor: isDark ? '#1E1E1E' : '#FFF' },
    authButton: { backgroundColor: '#6200EE', padding: 16, borderRadius: 12, alignItems: 'center' },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
    googleButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: isDark ? '#2D2D2D' : '#FFF', borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#444' : '#DDD', marginBottom: 16 },
    googleIcon: { width: 20, height: 20, marginRight: 12 },
    googleButtonText: { color: isDark ? '#FFF' : '#000', fontWeight: '600' },
    separator: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    separatorLine: { flex: 1, height: 1, backgroundColor: isDark ? '#444' : '#DDD' },
    separatorText: { marginHorizontal: 16, color: isDark ? '#888' : '#999' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
    switchModeText: { color: isDark ? '#CCC' : '#666', marginRight: 8 },
    switchModeButton: { color: '#6200EE', fontWeight: '600' },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 16, borderRadius: 12, marginBottom: 20 },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center' },
  });
};
*/






/*
import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default function Index() {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // États pour gérer l'effet de focus sur les bordures
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Vérification de session initiale et écoute des changements d'état
  useEffect(() => {
    async function initAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.replace('/(tabs)');
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        router.replace('/(tabs)');
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });
      
      if (signUpError) throw signUpError;
      
      if (data.user) {
        Alert.alert(
          'Succès !',
          'Compte créé avec succès ! Connectez-vous à présent.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setPassword('');
      }
    } catch (err: any) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });
      
      if (signInError) throw signInError;
      
      if (data.session) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      setError(err.message || "Email ou mot de passe incorrect.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setPassword('');
  };

  if (isInitializing) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoid}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
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
          
            <View style={[
              styles.inputContainer, 
              isEmailFocused && styles.inputFocused
            ]}>
              <TextInput
                style={styles.textInput}
                placeholder="Adresse email"
                placeholderTextColor={colorScheme === 'dark' ? '#777' : '#999'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
              
              <View style={styles.eyeButtonPlaceholder} />
            </View>

            
            <View style={[
              styles.inputContainer, 
              isPasswordFocused && styles.inputFocused
            ]}>
              <TextInput
                style={styles.textInput}
                placeholder="Mot de passe"
                placeholderTextColor={colorScheme === 'dark' ? '#777' : '#999'}
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
              style={[styles.authButton, loading && styles.buttonDisabled]}
              onPress={isSignUpMode ? handleSignUp : handleSignIn}
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

const getStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#121212' : '#f8f9fa' },
    keyboardAvoid: { flex: 1 },
    scrollContent: { flexGrow: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 36 },
    headerTitle: { fontSize: 34, fontWeight: 'bold', color: isDark ? '#BB86FC' : '#6200EE', letterSpacing: 0.5 },
    headerSubtitle: { fontSize: 14, color: isDark ? '#AAA' : '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 10, lineHeight: 20 },
    formSection: { width: '100%' },
    
    // Conteneur à taille fixe et unique, basé sur l'input email originel
    inputContainer: { 
      flexDirection: 'row', 
      width: '100%', 
      height: 50, // Hauteur fixe stricte pour éliminer tout écart de rendu
      borderWidth: 1.5, 
      borderColor: isDark ? '#2D2D2D' : '#E2E8F0', 
      borderRadius: 12, 
      marginBottom: 16, 
      backgroundColor: isDark ? '#1A1A1A' : '#FFF', 
      alignItems: 'center',
      overflow: 'hidden'
    },
    
    // Zone de texte
    textInput: { 
      flex: 1, 
      height: '100%',
      paddingHorizontal: 16, 
      color: isDark ? '#FFF' : '#1A202C', 
      fontSize: 15
    },
    
    // Style appliqué dynamiquement lors du focus (clic)
    inputFocused: { borderColor: isDark ? '#BB86FC' : '#6200EE' },
    
    // Bouton de droite pour le mot de passe
    eyeButton: { 
      paddingHorizontal: 16, 
      height: '100%', 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    eyeText: { fontSize: 13, fontWeight: '600', color: isDark ? '#BB86FC' : '#6200EE' },
    
    // Compensateur pour l'input email afin d'équilibrer parfaitement la structure
    eyeButtonPlaceholder: {
      width: 75, // Largeur équivalente moyenne à l'espace occupé par le bouton "Afficher"
      height: '100%'
    },
    
    authButton: { backgroundColor: '#6200EE', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 12, shadowColor: '#6200EE', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 2 },
    buttonDisabled: { opacity: 0.6 },
    authButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    switchModeContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24, alignItems: 'center' },
    switchModeText: { color: isDark ? '#AAA' : '#666', marginRight: 6, fontSize: 14 },
    switchModeButton: { color: '#6200EE', fontWeight: '700', fontSize: 14 },
    errorContainer: { backgroundColor: isDark ? '#D32F2F20' : '#FFEBEE', padding: 12, borderRadius: 10, marginBottom: 18, borderWidth: 1, borderColor: isDark ? '#D32F2F40' : '#FFCDD2' },
    errorText: { color: isDark ? '#ff6b6b' : '#D32F2F', textAlign: 'center', fontWeight: '500', fontSize: 13 },
  });
};
*/


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
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

// ========== TYPES & THEME ==========
type ThemeColors = {
  background: string;
  text: string;
  textSecondary: string;
  primary: string;
  inputBackground: string;
  inputBorder: string;
  inputFocusBorder: string;
  errorBackground: string;
  errorText: string;
  errorBorder: string;
};

const getThemeColors = (isDark: boolean): ThemeColors => ({
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

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { session, loading: authLoading } = useAuth();

  // ✅✅✅ STYLES DÉPLACÉS ICI, AVANT LE PREMIER RETURN ✅✅✅
  const styles = useMemo(() => StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center'
    },
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
    eyeButtonPlaceholder: { width: 75, height: '100%' },
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
    buttonDisabled: { opacity: 0.6 },
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
    }
  }), [colors]);

  // ✅ Maintenant ce return peut utiliser styles.loadingContainer
  if (!rootNavigationState?.key || authLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  // ... (le reste de votre code inchangé : useEffect, handleAuth, etc.)
}
*/









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
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

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

// ========== STYLES ==========
const getStyles = (colors: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
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
  eyeButtonPlaceholder: { width: 75, height: '100%' },
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
  buttonDisabled: { opacity: 0.6 },
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
  }
});

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { session, loading: authLoading } = useAuth();
  const styles = getStyles(colors);

  // Redirection automatique si session existe
  useEffect(() => {
    if (rootNavigationState?.key && session) {
      router.replace('/(tabs)');
    }
  }, [session, rootNavigationState?.key, router]);

  // Écoute des changements d'auth
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          router.replace('/(tabs)');
        } else if (event === 'SIGNED_OUT') {
          router.replace('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [rootNavigationState?.key, router]);

  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setError('');
    setFormLoading(true);

    try {
      if (isSignUpMode) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        Alert.alert(
          'Succès !',
          'Compte créé avec succès ! Connectez-vous à présent.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setPassword('');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message.includes('invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (err.message.includes('already been registered')) {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (err.message.includes('weak password')) {
        errorMessage = 'Le mot de passe est trop faible (min 6 caractères).';
      }
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  }, [email, password, isSignUpMode, router]);

  const toggleMode = useCallback(() => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setPassword('');
  }, [isSignUpMode]);

  // ⚡ NOUVEAU : Ne JAMAIS afficher le formulaire si session existe
  if (!rootNavigationState?.key || authLoading || session) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ✅ Afficher le formulaire UNIQUEMENT si pas de session
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
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous'}
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
                editable={!formLoading}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
              <View style={styles.eyeButtonPlaceholder} />
            </View>

            <View style={[styles.inputContainer, isPasswordFocused && styles.inputFocused]}>
              <TextInput
                style={styles.textInput}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                editable={!formLoading}
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
              style={[styles.authButton, formLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={formLoading}
              activeOpacity={0.8}
            >
              {formLoading ? (
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
              <TouchableOpacity onPress={toggleMode} disabled={formLoading}>
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
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

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

// ========== STYLES ==========
const getStyles = (colors: any) => StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
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
  eyeButtonPlaceholder: { width: 75, height: '100%' },
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
  buttonDisabled: { opacity: 0.6 },
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
  }
});

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  const { session } = useAuth();
  const styles = getStyles(colors);

  // Vérification initiale de la session (fonctionne OFFLINE avec AsyncStorage)
  useEffect(() => {
    const checkSession = async () => {
      try {
        // supabase.auth.getSession() utilise AsyncStorage et fonctionne OFFLINE
        const { data: { session } } = await supabase.auth.getSession();
        if (session && rootNavigationState?.key) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.log('Erreur vérification session:', error);
      } finally {
        setSessionChecked(true);
      }
    };

    if (rootNavigationState?.key && !sessionChecked) {
      checkSession();
    }
  }, [rootNavigationState?.key, sessionChecked, router]);

  // Écoute des changements d'auth (fonctionne aussi OFFLINE)
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          router.replace('/(tabs)');
        } else if (event === 'SIGNED_OUT') {
          router.replace('/');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [rootNavigationState?.key, router]);

  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setError('');
    setFormLoading(true);

    try {
      if (isSignUpMode) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        Alert.alert(
          'Succès !',
          'Compte créé avec succès ! Connectez-vous à présent.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setPassword('');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message.includes('invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (err.message.includes('already been registered')) {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (err.message.includes('weak password')) {
        errorMessage = 'Le mot de passe est trop faible (min 6 caractères).';
      } else if (err.message.includes('network')) {
        errorMessage = 'Pas de connexion internet. Essayez en mode hors ligne.';
      }
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  }, [email, password, isSignUpMode, router]);

  const toggleMode = useCallback(() => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setPassword('');
  }, [isSignUpMode]);

  // ⚡ Ne pas afficher le formulaire pendant la vérification ou si session existe
  if (!rootNavigationState?.key || !sessionChecked) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ✅ Afficher le formulaire UNIQUEMENT si pas de session
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
              {isSignUpMode ? 'Créez votre compte' : 'Connectez-vous'}
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
                editable={!formLoading}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
              />
              <View style={styles.eyeButtonPlaceholder} />
            </View>

            <View style={[styles.inputContainer, isPasswordFocused && styles.inputFocused]}>
              <TextInput
                style={styles.textInput}
                placeholder="Mot de passe"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                editable={!formLoading}
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
              style={[styles.authButton, formLoading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={formLoading}
              activeOpacity={0.8}
            >
              {formLoading ? (
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
              <TouchableOpacity onPress={toggleMode} disabled={formLoading}>
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
}*/








/*


// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}

import 'react-native-get-random-values';
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
import { supabase } from '../lib/supabase';

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

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Vérification initiale de la session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && rootNavigationState?.key) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (rootNavigationState?.key) {
      checkSession();
    }
  }, [rootNavigationState?.key, router]);

  // Écouteur des changements d'auth
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session && rootNavigationState?.key) {
          router.replace('/(tabs)');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [rootNavigationState?.key, router]);

  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
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
          email: email.trim(),
          password,
        });
        if (signUpError) throw signUpError;
        Alert.alert(
          'Succès !',
          'Compte créé avec succès ! Connectez-vous à présent.',
          [{ text: 'OK', onPress: () => setIsSignUpMode(false) }]
        );
        setPassword('');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message.includes('invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (err.message.includes('already been registered')) {
        errorMessage = 'Cet email est déjà utilisé.';
      } else if (err.message.includes('weak password')) {
        errorMessage = 'Le mot de passe est trop faible (min 6 caractères).';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [email, password, isSignUpMode, router]);

  const toggleMode = useCallback(() => {
    setError('');
    setIsSignUpMode(!isSignUpMode);
    setPassword('');
  }, [isSignUpMode]);

  // Loader si le root navigator n'est pas prêt ou si on vérifie la session
  if (!rootNavigationState?.key || loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  // Styles
  const styles = StyleSheet.create({
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
  });

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












/*
// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}

import 'react-native-get-random-values';
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
import { supabase } from '../lib/supabase';

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

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Gestion unifiée de la session et des changements d'état Auth
  useEffect(() => {
    // Ne pas tenter d'exécuter la logique tant que le navigateur racine n'est pas prêt
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    // 1. Vérification initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    });

    // 2. Écouteur en temps réel pour les connexions / déconnexions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (session) {
          router.replace('/(tabs)');
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key]);

  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
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
          email: email.trim(),
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
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        // La redirection vers /(tabs) est automatiquement déclenchée par onAuthStateChange
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message?.includes('invalid login credentials')) {
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

  // Afficher l'indicateur de chargement tant que le routeur ou la session ne sont pas prêts
  if (!rootNavigationState?.key || loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  // Styles
  const styles = StyleSheet.create({
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
  });

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











/*

// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}

import 'react-native-get-random-values';
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
  Image,
} from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';

// ========== ICONS (Google) ==========
// Vous pouvez utiliser une icône SVG ou une image locale pour le bouton Google
// Exemple avec une image locale (à ajouter dans vos assets) :
// import GoogleIcon from '../assets/google-icon.png';

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
  googleButton: '#4285F4', // Bleu Google
});

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // URL de callback pour OAuth (Google)
  const redirectUri = makeRedirectUri({ path: 'callback' });

  // Initialiser WebBrowser pour OAuth
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  // Gestion du deep link pour le retour de Google OAuth
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      // Supabase gère automatiquement le callback OAuth
      // L'écouteur onAuthStateChange sera déclenché
    };

    Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    return () => {
      Linking.removeAllListeners('url');
    };
  }, []);

  // Gestion unifiée de la session et des changements d'état Auth
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (session) {
          router.replace('/(tabs)');
        } else {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key]);

  // Connexion avec Google
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) throw error;

      if (data.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google');
      setLoading(false);
    }
  }, [redirectUri]);

  // Authentification classique (email/mot de passe)
  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
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
          email: email.trim(),
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
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
        // La redirection vers /(tabs) est gérée par onAuthStateChange
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message?.includes('invalid login credentials')) {
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

  // Afficher l'indicateur de chargement tant que le routeur ou la session ne sont pas prêts
  if (!rootNavigationState?.key || loading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
      </View>
    );
  }

  // Styles
  const styles = StyleSheet.create({
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
    googleButton: {
      backgroundColor: colors.googleButton,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginTop: 12,
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
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      width: '100%',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.inputBorder,
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingHorizontal: 12,
    },
    googleIcon: {
      width: 20,
      height: 20,
    },
  });

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

          
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              
            
              <Text style={styles.authButtonText}>Continuer avec Google</Text>
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








/*
// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}

import 'react-native-get-random-values';
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
  Image,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import { useRouter, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

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
  googleButton: '#4285F4',
});

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Gestion unifiée de la session et des changements d'état Auth
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' && session) {
          router.replace('/(tabs)');
        } else if (!session) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key]);



const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Utiliser un scheme dynamique (comme dans votre 1ère app)
      // Assurez-vous d'avoir "scheme": "ganbanaaxu" dans votre app.json
      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'ganbanaaxu' });
          console.log("URL de redirection utilisée :", redirectUrl);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Indispensable sur mobile
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        // 2. Ouvrir le navigateur et écouter le résultat
        const authResult = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        // 3. Récupérer les tokens et créer la session Supabase
        if (authResult.type === 'success' && authResult.url) {
          const urlObj = new URL(authResult.url);
          const params = new URLSearchParams(urlObj.hash.substring(1)); 
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  }, []);



  // Authentification classique (email/mot de passe)
  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
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
          email: email.trim(),
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
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message?.includes('invalid login credentials')) {
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

  // Afficher l'indicateur de chargement tant que le routeur ou la session ne sont pas prêts
  if (!rootNavigationState?.key || loading) {
    return (
<>
      <StatusBar
        style={isDark ? 'light' : 'dark'}
        backgroundColor={colors.background}
        translucent={Platform.OS === 'android'}
      />
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
      </View>
      </>
    );
  }

  // Styles
  const styles = StyleSheet.create({
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
    googleButton: {
      backgroundColor: colors.googleButton,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginTop: 12,
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
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      width: '100%',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.inputBorder,
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingHorizontal: 12,
    },
  });

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

            // Bouton Google 
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.authButtonText}>Continuer avec Google</Text>
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








/*

// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}

import 'react-native-get-random-values';
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
import * as AuthSession from 'expo-auth-session';
import { useRouter, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

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
  googleButton: '#4285F4',
});

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Gestion unifiée de la session et des changements d'état Auth
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    // 1. Vérification lors du chargement initial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        // Redirection explicite vers app/(tabs)/index.tsx
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    });

    // 2. Écouteur des évènements de connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' && session) {
          // Redirection explicite vers app/(tabs)/index.tsx
          router.replace('/(tabs)');
        } else if (!session) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'ganbanaaxu' });
      console.log("URL de redirection utilisée :", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        const authResult = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (authResult.type === 'success' && authResult.url) {
          const urlObj = new URL(authResult.url);
          const params = new URLSearchParams(urlObj.hash.substring(1)); 
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  }, []);

  // Authentification classique (email/mot de passe)
  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
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
          email: email.trim(),
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
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message?.includes('invalid login credentials')) {
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

  // Afficher l'indicateur de chargement
  if (!rootNavigationState?.key || loading) {
    return (
      <>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={Platform.OS === 'android'}
        />
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
        </View>
      </>
    );
  }

  // Styles
  const styles = StyleSheet.create({
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
    googleButton: {
      backgroundColor: colors.googleButton,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginTop: 12,
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
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      width: '100%',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.inputBorder,
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingHorizontal: 12,
    },
  });

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

            // Séparateur "OU" 
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            // Bouton Google 
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.authButtonText}>Continuer avec Google</Text>
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









/*

// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}

import 'react-native-get-random-values';
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
import * as AuthSession from 'expo-auth-session';
import { useRouter, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

// Initialisation d'Expo WebBrowser pour la gestion des callbacks
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
  googleButton: '#4285F4',
});

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Gestion unifiée de la session et des changements d'état Auth
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    // 1. Vérification lors du chargement initial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    });

    // 2. Écouteur des évènements de connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' && session) {
          router.replace('/(tabs)');
        } else if (!session) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'ganbanaaxu' });
      console.log("URL de redirection utilisée :", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        const authResult = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (authResult.type === 'success' && authResult.url) {
          const rawUrl = authResult.url;

          // Extraction complète des paramètres (pour PKCE ou Implicit)
          const params = new URLSearchParams();
          const parts = rawUrl.split(/[?#]/);
          parts.forEach((part) => {
            if (part.includes('=')) {
              const p = new URLSearchParams(part);
              p.forEach((value, key) => params.set(key, value));
            }
          });

          const code = params.get('code');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          // Flow PKCE (comportement par défaut Supabase)
          if (code) {
            const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
            if (sessionError) throw sessionError;
            router.replace('/(tabs)');
          } 
          // Flow Implicit (alternative)
          else if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            router.replace('/(tabs)');
          } else {
            const authError = params.get('error_description') || params.get('error');
            if (authError) {
              throw new Error(authError);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Authentification classique (email/mot de passe)
  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
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
          email: email.trim(),
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
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;

        router.replace('/(tabs)');
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message?.includes('invalid login credentials')) {
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
  }, [email, password, isSignUpMode, router]);

  const toggleMode = useCallback(() => {
    setError('');
    setIsSignUpMode((prev) => !prev);
    setPassword('');
  }, []);

  // Afficher l'indicateur de chargement
  if (!rootNavigationState?.key || loading) {
    return (
      <>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={Platform.OS === 'android'}
        />
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
        </View>
      </>
    );
  }

  // Styles
  const styles = StyleSheet.create({
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
    googleButton: {
      backgroundColor: colors.googleButton,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginTop: 12,
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
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      width: '100%',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.inputBorder,
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingHorizontal: 12,
    },
  });

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

            //
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            //
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.authButtonText}>Continuer avec Google</Text>
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










/*
// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}

import 'react-native-get-random-values';
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
import * as AuthSession from 'expo-auth-session';
import { useRouter, useRootNavigationState } from 'expo-router';
import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';

// Initialisation d'Expo WebBrowser pour la gestion des callbacks
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
  googleButton: '#4285F4',
});

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Gestion unifiée de la session et des changements d'état Auth
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    // 1. Vérification lors du chargement initial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    });

    // 2. Écouteur des évènements de connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' && session) {
          router.replace('/(tabs)');
        } else if (!session) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key]);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const redirectUrl = AuthSession.makeRedirectUri({ scheme: 'ganbanaaxu' });
      console.log("URL de redirection utilisée :", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      if (data.url) {
        const authResult = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );

        if (authResult.type === 'success' && authResult.url) {
          const rawUrl = authResult.url;

          // Extraction complète des paramètres (pour PKCE ou Implicit)
          const params = new URLSearchParams();
          const parts = rawUrl.split(/[?#]/);
          parts.forEach((part) => {
            if (part.includes('=')) {
              const p = new URLSearchParams(part);
              p.forEach((value, key) => params.set(key, value));
            }
          });

          const code = params.get('code');
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          // Flow PKCE (comportement par défaut Supabase)
          if (code) {
            const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
            if (sessionError) throw sessionError;
            router.replace('/(tabs)');
          } 
          // Flow Implicit (alternative)
          else if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            router.replace('/(tabs)');
          } else {
            const authError = params.get('error_description') || params.get('error');
            if (authError) {
              throw new Error(authError);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Authentification classique (email/mot de passe)
  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
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
          email: email.trim(),
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
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;

        router.replace('/(tabs)');
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      if (err.message?.includes('invalid login credentials')) {
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
  }, [email, password, isSignUpMode, router]);

  const toggleMode = useCallback(() => {
    setError('');
    setIsSignUpMode((prev) => !prev);
    setPassword('');
  }, []);

  // Afficher l'indicateur de chargement
  if (!rootNavigationState?.key || loading) {
    return (
      <>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={Platform.OS === 'android'}
        />
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
        </View>
      </>
    );
  }

  // Styles
  const styles = StyleSheet.create({
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
    googleButton: {
      backgroundColor: colors.googleButton,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginTop: 12,
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
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 16,
      width: '100%',
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.inputBorder,
    },
    dividerText: {
      color: colors.textSecondary,
      fontSize: 13,
      paddingHorizontal: 12,
    },
  });

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

            //
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            //
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleSignIn}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={styles.authButtonText}>Continuer avec Google</Text>
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





// Polyfill WeakRef
if (typeof WeakRef === 'undefined') {
  (global as any).WeakRef = class WeakRef<T extends object> {
    private target: T | null = null;
    constructor(target: T) { this.target = target; }
    deref(): T | undefined { return this.target || undefined; }
  };
}

import 'react-native-get-random-values';
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
import { supabase } from '../lib/supabase';

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

// ========== MAIN COMPONENT ==========
export default function Index() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // États du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Gestion unifiée de la session et des changements d'état Auth
  useEffect(() => {
    if (!rootNavigationState?.key) return;

    let isMounted = true;

    // 1. Vérification lors du chargement initial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session) {
        router.replace('/(tabs)');
      } else {
        setLoading(false);
      }
    });

    // 2. Écouteur des évènements de connexion
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (event === 'SIGNED_IN' && session) {
          router.replace('/(tabs)');
        } else if (!session) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [rootNavigationState?.key]);

  // Authentification classique (email/mot de passe)
  const handleAuth = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Veuillez remplir tous les champs.');
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
          email: email.trim(),
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
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;

        router.replace('/(tabs)');
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur est survenue.';
      
      // Il faut chercher le texte anglais renvoyé par Supabase
      if (err.message?.toLowerCase().includes('invalid login credentials')) {
        errorMessage = 'Email ou mot de passe incorrect. (Ou vous n\'avez pas de compte)';
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
  }, [email, password, isSignUpMode, router]);

  const toggleMode = useCallback(() => {
    setError('');
    setIsSignUpMode((prev) => !prev);
    setPassword('');
  }, []);

  // Afficher l'indicateur de chargement
  if (!rootNavigationState?.key || loading) {
    return (
      <>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.background}
          translucent={Platform.OS === 'android'}
        />
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background
        }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 10 }}>Chargement...</Text>
        </View>
      </>
    );
  }

  // Styles
  const styles = StyleSheet.create({
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
  });

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








