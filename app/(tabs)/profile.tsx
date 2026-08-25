
/*
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import Purchases from 'react-native-purchases';
import PurchasesUI from 'react-native-purchases-ui';

// Components
import AdvertiserView from '../../components/AdvertiserView';
import AdminView from '../../components/AdminView';

// ========== CONFIG ==========
const CONFIG = {
  SUPABASE_URL: 'https://tuciyiawyawrhifpjmmn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1',
  BUCKET_NAME: 'ganbanaaxu-media',
  AUTH_CACHE_KEY: 'supabase_session',
  REVENUE_CAT_IOS_KEY: 'appl_votre_cle_ios_ici',
  REVENUE_CAT_ANDROID_KEY: 'goog_cIibncNEBUNZjaykqYuzaPlLUiI',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ========== TYPES ==========
type ViewMode = 'admin' | 'advertiser';
type MediaItem = { uri: string; type: string; name?: string };

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  error: string;
  onError: string;
  surface: string;
  border: string;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ========== THEME ==========
const getTheme = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  onPrimary: isDark ? '#000000' : '#FFFFFF',
  error: '#FF3B30',
  onError: '#FFFFFF',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
  border: isDark ? '#333333' : '#E0E0E0',
});

// ========== HOOKS ==========
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/');
        return;
      }
      const currentUser = session.user;
      setUser(currentUser);
      setUserEmail(currentUser?.email || '');
      setUserName(
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split('@')[0] ||
        'Utilisateur'
      );
    } catch (error) {
      console.error('Auth Error:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync(CONFIG.AUTH_CACHE_KEY).catch(() => {});
    router.replace('/');
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { user, userEmail, userName, loading, logout };
};

const useRevenueCat = () => {
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);

  const initAndCheckSubscription = useCallback(async () => {
    try {
      Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      await Purchases.configure({
        apiKey: Platform.OS === 'ios'
          ? CONFIG.REVENUE_CAT_IOS_KEY
          : CONFIG.REVENUE_CAT_ANDROID_KEY,
      });

      const customerInfo = await Purchases.getCustomerInfo();
      setIsSubscribed(!!customerInfo.entitlements.active['advertiser_access']);
    } catch (e) {
      console.error('RevenueCat Error:', e);
      setIsSubscribed(false);
    }
  }, []);

  return { isSubscribed, initAndCheckSubscription };
};

const useMedia = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
        name: asset.fileName,
      }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  }, []);

  const pickAudio = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      setRecordedAudioUri(result.assets[0].uri);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (uri) {
      setRecordedAudioUri(uri);
    }
    setRecording(null);
  }, [recording]);

  const toggleAudioPreview = useCallback(async () => {
    if (!recordedAudioUri) return;

    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlayingAudio(false);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: recordedAudioUri },
      { shouldPlay: true }
    );

    newSound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) {
        newSound.unloadAsync();
        setIsPlayingAudio(false);
      }
    });

    setSound(newSound);
    setIsPlayingAudio(true);
  }, [recordedAudioUri, sound]);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
    setRecordedAudioUri(null);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsPlayingAudio(false);
  }, [sound]);

  return {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    recording,
    sound,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  };
};

// ========== MAIN COMPONENT ==========
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getTheme(isDark);

  // Hooks
  const { user, userEmail, userName, loading: authLoading, logout } = useAuth();
  const { isSubscribed, initAndCheckSubscription } = useRevenueCat();
  const {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  } = useMedia();

  const [currentView, setCurrentView] = useState<ViewMode>('advertiser');

  useEffect(() => {
    initAndCheckSubscription();
  }, [initAndCheckSubscription]);

  const handlePublishProcess = useCallback(() => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert('⚠️ Attention', 'Aucun fichier sélectionné.');
      return;
    }
    executeUpload();
  }, [selectedMedia, recordedAudioUri]);

  const executeUpload = async () => {
    setLoading(true);
    try {
      // Votre logique d'upload existante ici
      // Exemple:
      // for (const media of selectedMedia) {
      //   const formData = new FormData();
      //   formData.append('file', {
      //     uri: media.uri,
      //     type: media.type,
      //     name: media.name || 'file',
      //   });
      //   await supabase.storage.from(CONFIG.BUCKET_NAME).upload(...);
      // }
      Alert.alert('✅ Succès', 'Fichiers téléversés avec succès!');
      clearMedia();
    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du téléversement');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }, [logout]);

  const handleViewChange = useCallback((view: ViewMode) => {
    setCurrentView(view);
    clearMedia(); // Nettoyer les médias lors du changement de vue
  }, [clearMedia]);

  // ========== RENDER ==========

  // Loading state
  if (authLoading || isSubscribed === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Paywall for non-subscribed advertisers
  if (!isSubscribed && currentView === 'advertiser') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={[styles.switchContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.switchButton, currentView === 'advertiser' && styles.activeSwitch]}
              onPress={() => handleViewChange('advertiser')}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="campaign"
                size={18}
                color={currentView === 'advertiser' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.switchText, { color: currentView === 'advertiser' ? colors.primary : colors.textSecondary }]}>
                Espace Pub
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchButton, currentView === 'admin' && styles.activeSwitch]}
              onPress={() => handleViewChange('admin')}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="admin-panel-settings"
                size={18}
                color={currentView === 'admin' ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.switchText, { color: currentView === 'admin' ? colors.primary : colors.textSecondary }]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        
        <View style={styles.paywallContainer}>
          <PurchasesUI.Paywall
            onPurchaseCompleted={(customerInfo) => {
              if (customerInfo.entitlements.active['advertiser_access']) {
                setIsSubscribed(true);
                Alert.alert('✅ Succès', 'Abonnement activé!');
              }
            }}
            onPurchaseError={() => {
              Alert.alert('❌ Erreur', 'Paiement échoué ou annulé');
            }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Main content
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
        
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <View style={[styles.switchContainer, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={[styles.switchButton, currentView === 'advertiser' && styles.activeSwitch]}
              onPress={() => handleViewChange('advertiser')}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="campaign"
                size={18}
                color={currentView === 'advertiser' ? colors.onPrimary : colors.textSecondary}
              />
              <Text style={[styles.switchText, { color: currentView === 'advertiser' ? colors.onPrimary : colors.textSecondary }]}>
                Espace Pub
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.switchButton, currentView === 'admin' && styles.activeSwitch]}
              onPress={() => handleViewChange('admin')}
              activeOpacity={0.7}
            >
              <MaterialIcons
                name="admin-panel-settings"
                size={18}
                color={currentView === 'admin' ? colors.onPrimary : colors.textSecondary}
              />
              <Text style={[styles.switchText, { color: currentView === 'admin' ? colors.onPrimary : colors.textSecondary }]}>
                Admin
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        
        <View style={styles.profileHeader}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
            <FontAwesome
              name={currentView === 'admin' ? 'user-md' : 'user'}
              size={36}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{userEmail}</Text>
        </View>

        
        {currentView === 'admin' ? (
          <AdminView
            isDark={isDark}
            selectedMedia={selectedMedia}
            recordedAudioUri={recordedAudioUri}
            isRecording={isRecording}
            isPlayingAudio={isPlayingAudio}
            loading={loading}
            pickMedia={pickMedia}
            pickAudio={pickAudio}
            setSelectedMedia={setSelectedMedia}
            setRecordedAudioUri={setRecordedAudioUri}
            setIsPlayingAudio={setIsPlayingAudio}
            startRecording={startRecording}
            stopRecording={stopRecording}
            toggleAudioPreview={toggleAudioPreview}
            handlePublishProcess={handlePublishProcess}
          />
        ) : (
          <AdvertiserView
            isDark={isDark}
            selectedMedia={selectedMedia}
            recordedAudioUri={recordedAudioUri}
            isRecording={isRecording}
            isPlayingAudio={isPlayingAudio}
            loading={loading}
            pickMedia={pickMedia}
            pickAudio={pickAudio}
            setSelectedMedia={setSelectedMedia}
            setRecordedAudioUri={setRecordedAudioUri}
            setIsPlayingAudio={setIsPlayingAudio}
            startRecording={startRecording}
            stopRecording={stopRecording}
            toggleAudioPreview={toggleAudioPreview}
            handlePublishProcess={handlePublishProcess}
          />
        )}

        
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialIcons name="logout" size={18} color={colors.onError} />
          <Text style={[styles.logoutText, { color: colors.onError }]}>
            Déconnexion
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    overflow: 'hidden',
  },
  switchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeSwitch: {
    backgroundColor: 'rgba(106, 90, 205, 0.15)',
  },
  switchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  paywallContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
*/










/*
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';

// Components
import AdminView from '../../components/AdminView';

// ========== CONFIG ==========
const CONFIG = {
  SUPABASE_URL: 'https://tuciyiawyawrhifpjmmn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1',
  BUCKET_NAME: 'ganbanaaxu-media',
  AUTH_CACHE_KEY: 'supabase_session',
  APP_VERSION: '1.0.0',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ========== TYPES ==========
type TabType = 'profile' | 'settings';
type MediaItem = { uri: string; type: string; name?: string };

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  error: string;
  onError: string;
  surface: string;
  border: string;
  success: string;
};

const getTheme = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  onPrimary: isDark ? '#000000' : '#FFFFFF',
  error: '#FF3B30',
  onError: '#FFFFFF',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
  border: isDark ? '#333333' : '#E0E0E0',
  success: '#34C759',
});

// ========== HOOKS ==========
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/');
        return;
      }
      const currentUser = session.user;
      setUser(currentUser);
      setUserEmail(currentUser?.email || '');
      setUserName(
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split('@')[0] ||
        'Utilisateur'
      );
    } catch (error) {
      console.error('Auth Error:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router]);


const logout = useCallback(async () => {
  try {
    // 1. Déconnexion Supabase
    await supabase.auth.signOut();

    // 2. Suppression du cache local
    await SecureStore.deleteItemAsync(CONFIG.AUTH_CACHE_KEY).catch(() => {});

    // 3. Redirection vers la page d'authentification (app/index.tsx)
    router.replace('/'); // ✅ '/ ' = app/index.tsx par défaut dans expo-router

    // 4. Feedback visuel (optionnel)
    Alert.alert('✅ Déconnecté', 'Vous avez été déconnecté avec succès.');
  } catch (error) {
    console.error('Logout error:', error);
    Alert.alert('❌ Erreur', 'Impossible de vous déconnecter. Veuillez réessayer.');
  }
}, [router]);


const useMedia = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
        name: asset.fileName,
      }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  }, []);

  const pickAudio = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      setRecordedAudioUri(result.assets[0].uri);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (uri) {
      setRecordedAudioUri(uri);
    }
    setRecording(null);
  }, [recording]);

  const toggleAudioPreview = useCallback(async () => {
    if (!recordedAudioUri) return;

    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlayingAudio(false);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: recordedAudioUri },
      { shouldPlay: true }
    );

    newSound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) {
        newSound.unloadAsync();
        setIsPlayingAudio(false);
      }
    });

    setSound(newSound);
    setIsPlayingAudio(true);
  }, [recordedAudioUri, sound]);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
    setRecordedAudioUri(null);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsPlayingAudio(false);
  }, [sound]);

  return {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  };
};

// ========== MAIN COMPONENT ==========
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getTheme(isDark);
  const router = useRouter();

  // States
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Hooks
  const { user, userEmail, userName, loading: authLoading, logout } = useAuth();
  const {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  } = useMedia();

  // Handlers
  const handlePublishProcess = useCallback(() => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert('⚠️ Attention', 'Aucun fichier sélectionné.');
      return;
    }
    executeUpload();
  }, [selectedMedia, recordedAudioUri]);

  const executeUpload = async () => {
    setLoading(true);
    try {
      Alert.alert('✅ Succès', 'Fichiers téléversés avec succès!');
      clearMedia();
    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du téléversement');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter votre session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }, [logout]);

  const handleTermsPress = () => {
    Linking.openURL('https://votre-app.com/conditions-generales');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://votre-app.com/politique-confidentialite');
  };

  // ========== RENDER ==========
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }]}>
            Profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'settings' ? colors.primary : colors.textSecondary }]}>
            Paramètres
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
      
        {activeTab === 'profile' && (
          <>
            
            <View style={styles.profileHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                <FontAwesome name="user-md" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userEmail}
              </Text>
            </View>

            
            <AdminView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            />
          </>
        )}

        
        {activeTab === 'settings' && (
          <>
            
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Compte
              </Text>

              <View style={styles.accountInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="person" size={28} color={colors.primary} />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    {userName}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={22} color={colors.error} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Déconnexion
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Informations légales
              </Text>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleTermsPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="description" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Conditions générales d'utilisation
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handlePrivacyPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="security" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Politique de confidentialité
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                À propos
              </Text>

              <View style={styles.settingItem}>
                <MaterialIcons name="info" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Version {CONFIG.APP_VERSION}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Scroll Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  // Profile Section
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  // Settings Section
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
  },
});
*/













/*
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';

// Components
import AdminView from '../../components/AdminView';

// ========== CONFIG ==========
const CONFIG = {
  SUPABASE_URL: 'https://tuciyiawyawrhifpjmmn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1',
  BUCKET_NAME: 'ganbanaaxu-media',
  AUTH_CACHE_KEY: 'supabase_session',
  APP_VERSION: '1.0.0',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ========== TYPES ==========
type TabType = 'profile' | 'settings';
type MediaItem = { uri: string; type: string; name?: string };

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  error: string;
  onError: string;
  surface: string;
  border: string;
  success: string;
};

const getTheme = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  onPrimary: isDark ? '#000000' : '#FFFFFF',
  error: '#FF3B30',
  onError: '#FFFFFF',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
  border: isDark ? '#333333' : '#E0E0E0',
  success: '#34C759',
});

// ========== HOOKS ==========
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/');
        return;
      }
      const currentUser = session.user;
      setUser(currentUser);
      setUserEmail(currentUser?.email || '');
      setUserName(
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split('@')[0] ||
        'Utilisateur'
      );
    } catch (error) {
      console.error('Auth Error:', error);
      router.replace('/');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ✅ NOUVELLE VERSION : Déconnexion COMPLÈTE (session + cache)
  const logout = useCallback(async () => {
    try {
      // 1. Déconnexion Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      // 2. Suppression du cache local
      await SecureStore.deleteItemAsync(CONFIG.AUTH_CACHE_KEY);

      // 3. Suppression de TOUS les tokens Supabase
      await SecureStore.deleteItemAsync(`sb-${CONFIG.SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`);

      // 4. Redirection vers la page d'authentification
      router.replace('./');

      // 5. Feedback visuel
      Alert.alert('✅ Déconnecté', 'Vous avez été déconnecté. Veuillez vous reconnecter.');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('❌ Erreur', 'Impossible de vous déconnecter. Veuillez réessayer.');
    }
  }, [router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { user, userEmail, userName, loading, logout };
};

const useMedia = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  const pickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
        name: asset.fileName,
      }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  }, []);

  const pickAudio = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      setRecordedAudioUri(result.assets[0].uri);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (uri) {
      setRecordedAudioUri(uri);
    }
    setRecording(null);
  }, [recording]);

  const toggleAudioPreview = useCallback(async () => {
    if (!recordedAudioUri) return;

    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlayingAudio(false);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: recordedAudioUri },
      { shouldPlay: true }
    );

    newSound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) {
        newSound.unloadAsync();
        setIsPlayingAudio(false);
      }
    });

    setSound(newSound);
    setIsPlayingAudio(true);
  }, [recordedAudioUri, sound]);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
    setRecordedAudioUri(null);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsPlayingAudio(false);
  }, [sound]);

  return {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  };
};

// ========== MAIN COMPONENT ==========
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getTheme(isDark);
  const router = useRouter();

  // States
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Hooks
  const { user, userEmail, userName, loading: authLoading, logout } = useAuth();
  const {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  } = useMedia();

  const handlePublishProcess = useCallback(() => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert('⚠️ Attention', 'Aucun fichier sélectionné.');
      return;
    }
    executeUpload();
  }, [selectedMedia, recordedAudioUri]);

  const executeUpload = async () => {
    setLoading(true);
    try {
      Alert.alert('✅ Succès', 'Fichiers téléversés avec succès!');
      clearMedia();
    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du téléversement');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ NOUVELLE VERSION : Déconnexion avec confirmation et redirection FORCÉE
  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter votre session ? Vous devrez vous reconnecter.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            await logout(); // ✅ Appelle la nouvelle fonction logout qui supprime TOUT
          },
        },
      ]
    );
  }, [logout]);

  const handleTermsPress = () => {
    Linking.openURL('https://votre-app.com/conditions-generales');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://votre-app.com/politique-confidentialite');
  };

  // ========== RENDER ==========
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }]}>
            Profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'settings' ? colors.primary : colors.textSecondary }]}>
            Paramètres
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent]}
        showsVerticalScrollIndicator={false}
      >
      
        {activeTab === 'profile' && (
          <>
            
            <View style={styles.profileHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                <FontAwesome name="user-md" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userEmail}
              </Text>
            </View>

            
            <AdminView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            />
          </>
        )}

        
        {activeTab === 'settings' && (
          <>
        
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Compte
              </Text>

              <View style={styles.accountInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="person" size={28} color={colors.primary} />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    {userName}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={22} color={colors.error} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Déconnexion
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

                        <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Informations légales
              </Text>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleTermsPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="description" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Conditions générales d'utilisation
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handlePrivacyPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="security" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Politique de confidentialité
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

          
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                À propos
              </Text>

              <View style={styles.settingItem}>
                <MaterialIcons name="info" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Version {CONFIG.APP_VERSION}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Tab Navigation
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Scroll Content
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  // Profile Section
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  // Settings Section
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
  },
});

*/








/*
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';

// Components
import AdminView from '../../components/AdminView';

// ========== CONFIG ==========
const CONFIG = {
  SUPABASE_URL: 'https://tuciyiawyawrhifpjmmn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1',
  BUCKET_NAME: 'ganbanaaxu-media',
  AUTH_CACHE_KEY: 'supabase_session',
  APP_VERSION: '1.0.0',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ========== TYPES ==========
type TabType = 'profile' | 'settings';
type MediaItem = { uri: string; type: string; name?: string };

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  error: string;
  onError: string;
  surface: string;
  border: string;
  success: string;
};

const getTheme = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  onPrimary: isDark ? '#000000' : '#FFFFFF',
  error: '#FF3B30',
  onError: '#FFFFFF',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
  border: isDark ? '#333333' : '#E0E0E0',
  success: '#34C759',
});

// ========== HOOKS ==========
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 1. Vérification initiale de la session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/');
          return;
        }
        const currentUser = session.user;
        setUser(currentUser);
        setUserEmail(currentUser?.email || '');
        setUserName(
          currentUser?.user_metadata?.full_name ||
          currentUser?.email?.split('@')[0] ||
          'Utilisateur'
        );
      } catch (error) {
        console.error('Auth Check Error:', error);
        router.replace('/');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 2. Écouteur en temps réel pour forcer la redirection au changement d'état
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setUserEmail('');
        setUserName('');
        router.replace('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // ✅ DÉCONNEXION COMPLÈTE
    const logout = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Suppression du cache local
      await SecureStore.deleteItemAsync(CONFIG.AUTH_CACHE_KEY);
      const projectRef = CONFIG.SUPABASE_URL.split('//')[1]?.split('.')[0];
      if (projectRef) {
        await SecureStore.deleteItemAsync(`sb-${projectRef}-auth-token`);
      }

      // 2. Déconnexion Supabase (déclenche SIGNED_OUT et la redirection)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 3. Redirection de sécurité explicite
      router.replace('/index');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('❌ Erreur', 'Impossible de vous déconnecter. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { user, userEmail, userName, loading, logout };
};

const useMedia = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const pickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type || 'image',
        name: asset.fileName ?? undefined,
      }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  }, []);

  const pickAudio = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['audio/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      setRecordedAudioUri(result.assets[0].uri);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (uri) {
      setRecordedAudioUri(uri);
    }
    setRecording(null);
  }, [recording]);

  const toggleAudioPreview = useCallback(async () => {
    if (!recordedAudioUri) return;

    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlayingAudio(false);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: recordedAudioUri },
      { shouldPlay: true }
    );

    newSound.setOnPlaybackStatusUpdate(status => {
      if (status.isLoaded && status.didJustFinish) {
        newSound.unloadAsync();
        setIsPlayingAudio(false);
        setSound(null);
      }
    });

    setSound(newSound);
    setIsPlayingAudio(true);
  }, [recordedAudioUri, sound]);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
    setRecordedAudioUri(null);
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setIsPlayingAudio(false);
  }, [sound]);

  return {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  };
};

// ========== MAIN COMPONENT ==========
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getTheme(isDark);

  // States
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Hooks
  const { userEmail, userName, loading: authLoading, logout } = useAuth();
  const {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  } = useMedia();

  const executeUpload = async () => {
    setLoading(true);
    try {
      Alert.alert('✅ Succès', 'Fichiers téléversés avec succès!');
      clearMedia();
    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du téléversement');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishProcess = useCallback(() => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert('⚠️ Attention', 'Aucun fichier sélectionné.');
      return;
    }
    executeUpload();
  }, [selectedMedia, recordedAudioUri]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter votre session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }, [logout]);

  const handleTermsPress = () => {
    Linking.openURL('https://votre-app.com/conditions-generales');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://votre-app.com/politique-confidentialite');
  };

  // ========== RENDER ==========
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }]}>
            Profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'settings' ? colors.primary : colors.textSecondary }]}>
            Paramètres
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && (
          <>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                <FontAwesome name="user-md" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userEmail}
              </Text>
            </View>

            <AdminView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            />
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Compte
              </Text>

              <View style={styles.accountInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="person" size={28} color={colors.primary} />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    {userName}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={22} color={colors.error} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Déconnexion
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Informations légales
              </Text>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleTermsPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="description" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Conditions générales d'utilisation
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handlePrivacyPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="security" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Politique de confidentialité
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                À propos
              </Text>

              <View style={styles.settingItem}>
                <MaterialIcons name="info" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Version {CONFIG.APP_VERSION}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
  },
});
*/






















/*
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';

// Components
import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// ========== CONFIG ==========
const CONFIG = {
  SUPABASE_URL: 'https://tuciyiawyawrhifpjmmn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1',
  BUCKET_NAME: 'ganbanaaxu-media',
  AUTH_CACHE_KEY: 'supabase_session',
  APP_VERSION: '1.0.0',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ========== TYPES ==========
type TabType = 'profile' | 'settings';
type MediaItem = { uri: string; type: string; name?: string };

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  error: string;
  onError: string;
  surface: string;
  border: string;
  success: string;
};

const getTheme = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  onPrimary: isDark ? '#000000' : '#FFFFFF',
  error: '#FF3B30',
  onError: '#FFFFFF',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
  border: isDark ? '#333333' : '#E0E0E0',
  success: '#34C759',
});

// ========== HOOKS ==========


const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    // 1. Vérification initiale de la session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // On ne redirige PLUS vers '/' ici si la session est vide. 
        // Cela empêche l'onglet de se refermer au premier clic.
        if (session && isMounted) {
          const currentUser = session.user;
          setUser(currentUser);
          setUserEmail(currentUser?.email || '');
          setUserName(
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'Utilisateur'
          );
        }
      } catch (error) {
        console.error('Auth Check Error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    // 2. Écouteur en temps réel pour forcer la redirection au changement d'état
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setUserEmail('');
          setUserName('');
          router.replace('/');
        }
      }
    });

    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  // ✅ DÉCONNEXION COMPLÈTE
  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Suppression du cache local
      await SecureStore.deleteItemAsync(CONFIG.AUTH_CACHE_KEY);
      const projectRef = CONFIG.SUPABASE_URL.split('//')[1]?.split('.')[0];
      if (projectRef) {
        await SecureStore.deleteItemAsync(`sb-${projectRef}-auth-token`);
      }

      // 2. Déconnexion Supabase (déclenche SIGNED_OUT et la redirection)
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 3. Redirection de sécurité explicite vers app/index.tsx
      router.replace('/');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('❌ Erreur', 'Impossible de vous déconnecter. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { user, userEmail, userName, loading, logout };
};




const useMedia = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  // Nettoyage sécurisé de l'audio lors du démontage
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(err => console.log('Audio unload error on unmount:', err));
      }
    };
  }, [sound]);

  const pickMedia = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All, // Utilisation de l'enum officiel
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName ?? undefined,
        }));
        setSelectedMedia(prev => [...prev, ...newMedia]);
      }
    } catch (error) {
      console.error('Pick Media Error:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le média.');
    }
  }, []);

  const pickAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick Audio Error:', error);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès au microphone est nécessaire.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (uri) {
        setRecordedAudioUri(uri);
      }
      setRecording(null);
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  }, [recording]);

  const toggleAudioPreview = useCallback(async () => {
    if (!recordedAudioUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlayingAudio(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedAudioUri },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync().catch(console.error);
          setIsPlayingAudio(false);
          setSound(null);
        }
      });

      setSound(newSound);
      setIsPlayingAudio(true);
    } catch (error) {
      console.error('Toggle Audio Preview Error:', error);
    }
  }, [recordedAudioUri, sound]);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
    setRecordedAudioUri(null);
    if (sound) {
      sound.unloadAsync().catch(console.error);
      setSound(null);
    }
    setIsPlayingAudio(false);
  }, [sound]);

  return {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  };
};

// ========== MAIN COMPONENT ==========
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getTheme(isDark);

  // States
  const [activeTab, setActiveTab] = useState<TabType>('profile');

  // Hooks
  const { userEmail, userName, loading: authLoading, logout } = useAuth();
  const {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  } = useMedia();

  const executeUpload = async () => {
    setLoading(true);
    try {
      // TODO: Logique de téléversement vers le bucket 'ganbanaaxu-media'
      Alert.alert('✅ Succès', 'Fichiers préparés avec succès!');
      clearMedia();
    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du téléversement');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishProcess = useCallback(() => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert('⚠️ Attention', 'Aucun fichier sélectionné.');
      return;
    }
    executeUpload();
  }, [selectedMedia, recordedAudioUri]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter votre session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }, [logout]);

  const handleTermsPress = () => {
    Linking.openURL('https://votre-app.com/conditions-generales').catch(console.error);
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://votre-app.com/politique-confidentialite').catch(console.error);
  };

  // ========== RENDER ==========
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }]}>
            Profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'settings' ? colors.primary : colors.textSecondary }]}>
            Paramètres
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && (
          <>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                <FontAwesome name="user-md" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userEmail}
              </Text>
            </View>

            <AdminView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            />
                
     
     <AdvertiserView
      isDark={isDark}
      selectedMedia={selectedMedia}
      recordedAudioUri={recordedAudioUri}
      isRecording={isRecording}
      isPlayingAudio={isPlayingAudio}
      loading={loading}
      pickMedia={pickMedia}
      pickAudio={pickAudio}
      setSelectedMedia={setSelectedMedia}
      setRecordedAudioUri={setRecordedAudioUri}
      setIsPlayingAudio={setIsPlayingAudio}
      startRecording={startRecording}
      stopRecording={stopRecording}
      toggleAudioPreview={toggleAudioPreview}
      handlePublishProcess={handlePublishProcess}
    /> 

          </>
        )}

        {activeTab === 'settings' && (
          <>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Compte
              </Text>

              <View style={styles.accountInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="person" size={28} color={colors.primary} />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    {userName}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={22} color={colors.error} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Déconnexion
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Informations légales
              </Text>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleTermsPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="description" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Conditions générales d'utilisation
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handlePrivacyPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="security" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Politique de confidentialité
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderBottomWidth: 0 }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                À propos
              </Text>

              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <MaterialIcons name="info" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Version {CONFIG.APP_VERSION}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
  },
});
*/








/*
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';

// Components (DÉCOMMENTEZ POUR ACTIVER)
import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// ========== CONFIG ==========
const CONFIG = {
  SUPABASE_URL: 'https://tuciyiawyawrhifpjmmn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1',
  BUCKET_NAME: 'ganbanaaxu-media',
  AUTH_CACHE_KEY: 'supabase_session',
  APP_VERSION: '1.0.0',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ========== TYPES ==========
type TabType = 'profile' | 'settings';
type MediaItem = { uri: string; type: string; name?: string };

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  error: string;
  onError: string;
  surface: string;
  border: string;
  success: string;
};

const getTheme = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  onPrimary: isDark ? '#000000' : '#FFFFFF',
  error: '#FF3B30',
  onError: '#FFFFFF',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
  border: isDark ? '#333333' : '#E0E0E0',
  success: '#34C759',
});

// ========== HOOKS ==========
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && isMounted) {
          const currentUser = session.user;
          setUser(currentUser);
          setUserEmail(currentUser?.email || '');
          setUserName(
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'Utilisateur'
          );
        }
      } catch (error) {
        console.error('Auth Check Error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setUserEmail('');
          setUserName('');
          router.replace('/');
        }
      }
    });

    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await SecureStore.deleteItemAsync(CONFIG.AUTH_CACHE_KEY);
      const projectRef = CONFIG.SUPABASE_URL.split('//')[1]?.split('.')[0];
      if (projectRef) {
        await SecureStore.deleteItemAsync(`sb-${projectRef}-auth-token`);
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('❌ Erreur', 'Impossible de vous déconnecter. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { user, userEmail, userName, loading, logout };
};

// ✅ HOOK useMedia CORRIGÉ (Plus d'erreurs d'enregistrement)
const useMedia = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  // Nettoyage sécurisé au démontage
  useEffect(() => {
    return () => {
      const cleanUp = async () => {
        if (recording && !recording.isUnloaded) {
          try {
            await recording.stopAndUnloadAsync();
          } catch (e) {
            console.warn('Recording déjà nettoyé:', e);
          }
        }
        if (sound) {
          try {
            await sound.unloadAsync();
          } catch (e) {
            console.warn('Sound déjà nettoyé:', e);
          }
        }
      };
      cleanUp();
    };
  }, [recording, sound]);

  const pickMedia = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName ?? undefined,
        }));
        setSelectedMedia(prev => [...prev, ...newMedia]);
      }
    } catch (error) {
      console.error('Pick Media Error:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le média.');
    }
  }, []);

  const pickAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick Audio Error:', error);
    }
  }, []);

  // ✅ CORRECTION COMPLÈTE POUR L'ENREGISTREMENT
  const startRecording = useCallback(async () => {
    try {
      // 1. Arrêter l'enregistrement en cours s'il existe
      if (isRecording && recording) {
        await stopRecording();
      }

      // 2. Nettoyer tout recording résiduel
      if (recording) {
        try {
          if (!recording.isUnloaded) {
            await recording.stopAndUnloadAsync();
          }
        } catch (e) {
          console.warn('Nettoyage forcé du recording:', e);
        }
        setRecording(null);
      }

      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès au microphone est nécessaire.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  }, [isRecording, recording]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (uri) {
        setRecordedAudioUri(uri);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      if (error.message?.includes('already been unloaded')) {
        setRecording(null);
      }
    } finally {
      setRecording(null); // Toujours mettre à null
    }
  }, [recording]);

  const toggleAudioPreview = useCallback(async () => {
    if (!recordedAudioUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlayingAudio(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedAudioUri },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync().catch(console.error);
          setIsPlayingAudio(false);
          setSound(null);
        }
      });

      setSound(newSound);
      setIsPlayingAudio(true);
    } catch (error) {
      console.error('Toggle Audio Preview Error:', error);
    }
  }, [recordedAudioUri, sound]);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
    setRecordedAudioUri(null);
    if (sound) {
      sound.unloadAsync().catch(console.error);
      setSound(null);
    }
    setIsPlayingAudio(false);
  }, [sound]);

  return {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  };
};

// ========== MAIN COMPONENT ==========
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getTheme(isDark);

  const [activeTab, setActiveTab] = useState<TabType>('profile');

  const { userEmail, userName, loading: authLoading, logout } = useAuth();
  const {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  } = useMedia();

  const executeUpload = async () => {
    setLoading(true);
    try {
      Alert.alert('✅ Succès', 'Fichiers préparés avec succès!');
      clearMedia();
    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du téléversement');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishProcess = useCallback(() => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert('⚠️ Attention', 'Aucun fichier sélectionné.');
      return;
    }
    executeUpload();
  }, [selectedMedia, recordedAudioUri]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter votre session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }, [logout]);

  const handleTermsPress = () => {
    Linking.openURL('https://votre-app.com/conditions-generales').catch(console.error);
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://votre-app.com/politique-confidentialite').catch(console.error);
  };

  // ========== RENDER ==========
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }]}>
            Profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'settings' ? colors.primary : colors.textSecondary }]}>
            Paramètres
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && (
          <>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                <FontAwesome name="user-md" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userEmail}
              </Text>
            </View>

      
                <AdminView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            /> 

            
             <AdvertiserView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            /> 
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Compte
              </Text>

              <View style={styles.accountInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  <MaterialIcons name="person" size={28} color={colors.primary} />
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    {userName}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={22} color={colors.error} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Déconnexion
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Informations légales
              </Text>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleTermsPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="description" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Conditions générales d'utilisation
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handlePrivacyPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="security" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Politique de confidentialité
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderBottomWidth: 0 }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                À propos
              </Text>

              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <MaterialIcons name="info" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Version {CONFIG.APP_VERSION}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
  },
});
*/



















/*

import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';

// Components
import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// ========== CONFIG ==========
const CONFIG = {
  SUPABASE_URL: 'https://tuciyiawyawrhifpjmmn.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1',
  BUCKET_NAME: 'ganbanaaxu-media',
  AUTH_CACHE_KEY: 'supabase_session',
  APP_VERSION: '1.0.0',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ✅ FONCTION POUR UPLOADER LA PHOTO VERS SUPABASE
const uploadProfileImageToSupabase = async (userId: string, uri: string) => {
  try {
    const formData = new FormData();
    const filename = `profile_${userId}_${Date.now()}.jpg`;

    formData.append('file', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: filename,
      type: 'image/jpeg',
    } as any);

    const { data, error } = await supabase
      .storage
      .from(CONFIG.BUCKET_NAME)
      .upload(`profile-images/${filename}`, formData, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data.path;
  } catch (error) {
    console.error('Erreur upload photo:', error);
    throw error;
  }
};

// ========== TYPES ==========
type TabType = 'profile' | 'settings';
type MediaItem = { uri: string; type: string; name?: string };

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  error: string;
  onError: string;
  surface: string;
  border: string;
  success: string;
};

const getTheme = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  onPrimary: isDark ? '#000000' : '#FFFFFF',
  error: '#FF3B30',
  onError: '#FFFFFF',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
  border: isDark ? '#333333' : '#E0E0E0',
  success: '#34C759',
});

// ========== HOOKS ==========
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && isMounted) {
          const currentUser = session.user;
          setUser(currentUser);
          setUserEmail(currentUser?.email || '');
          setUserName(
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'Utilisateur'
          );

          // ✅ RÉCUPÉRER L'AVATAR DEPUIS LA TABLE `profiles`
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', currentUser.id)
            .single();

          if (!profileError && profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Auth Check Error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setUserEmail('');
          setUserName('');
          setAvatarUrl(null);
          router.replace('/');
        }
      }
    });

    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await SecureStore.deleteItemAsync(CONFIG.AUTH_CACHE_KEY);
      const projectRef = CONFIG.SUPABASE_URL.split('//')[1]?.split('.')[0];
      if (projectRef) {
        await SecureStore.deleteItemAsync(`sb-${projectRef}-auth-token`);
      }
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (error) {
      console.error('Logout Error:', error);
      Alert.alert('❌ Erreur', 'Impossible de vous déconnecter. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { user, userEmail, userName, avatarUrl, loading, logout };
};

const useMedia = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      const cleanUp = async () => {
        if (recording && !recording.isUnloaded) {
          try {
            await recording.stopAndUnloadAsync();
          } catch (e) {
            console.warn('Recording déjà nettoyé:', e);
          }
        }
        if (sound) {
          try {
            await sound.unloadAsync();
          } catch (e) {
            console.warn('Sound déjà nettoyé:', e);
          }
        }
      };
      cleanUp();
    };
  }, [recording, sound]);

  const pickMedia = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName ?? undefined,
        }));
        setSelectedMedia(prev => [...prev, ...newMedia]);
      }
    } catch (error) {
      console.error('Pick Media Error:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le média.');
    }
  }, []);

  const pickAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick Audio Error:', error);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (isRecording && recording) {
        await stopRecording();
      }

      if (recording) {
        try {
          if (!recording.isUnloaded) {
            await recording.stopAndUnloadAsync();
          }
        } catch (e) {
          console.warn('Nettoyage forcé du recording:', e);
        }
        setRecording(null);
      }

      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès au microphone est nécessaire.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  }, [isRecording, recording]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (uri) {
        setRecordedAudioUri(uri);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      if (error.message?.includes('already been unloaded')) {
        setRecording(null);
      }
    } finally {
      setRecording(null);
    }
  }, [recording]);

  const toggleAudioPreview = useCallback(async () => {
    if (!recordedAudioUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlayingAudio(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedAudioUri },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync().catch(console.error);
          setIsPlayingAudio(false);
          setSound(null);
        }
      });

      setSound(newSound);
      setIsPlayingAudio(true);
    } catch (error) {
      console.error('Toggle Audio Preview Error:', error);
    }
  }, [recordedAudioUri, sound]);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
    setRecordedAudioUri(null);
    if (sound) {
      sound.unloadAsync().catch(console.error);
      setSound(null);
    }
    setIsPlayingAudio(false);
  }, [sound]);

  return {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  };
};

// ========== MAIN COMPONENT ==========
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getTheme(isDark);

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { user, userEmail, userName, avatarUrl, loading: authLoading, logout } = useAuth();
  const {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  } = useMedia();

  // ✅ INITIALISER profileImageUri AVEC avatarUrl DE SUPABASE
  useEffect(() => {
    if (avatarUrl) {
      setProfileImageUri(avatarUrl);
    }
  }, [avatarUrl]);

  // ✅ FONCTION POUR SÉLECTIONNER ET UPLOADER LA PHOTO
  const pickProfileImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'accès aux photos pour changer votre avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0] && user?.id) {
        const uri = result.assets[0].uri;
        setProfileImageUri(uri); // Affiche l'image immédiatement
        setIsUploading(true);

        try {
          // ✅ UPLOAD VERS SUPABASE
          const uploadedPath = await uploadProfileImageToSupabase(user.id, uri);

          // ✅ METTRE À JOUR LA TABLE `profiles` AVEC L'URL
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              avatar_url: uploadedPath,
              full_name: userName,
            });

          // ✅ METTRE À JOUR avatarUrl DANS useAuth (optionnel)
          setAvatarUrl(uploadedPath);
          Alert.alert('✅ Succès', 'Votre photo de profil a été mise à jour !');
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('❌ Erreur', 'Impossible d\'uploader la photo. Veuillez réessayer.');
          setProfileImageUri(null); // Réinitialiser si l'upload échoue
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Profile Image Error:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo.');
      setIsUploading(false);
    }
  }, [user, userName]);

  // ✅ FONCTION POUR SUPPRIMER LA PHOTO
  const removeProfileImage = useCallback(async () => {
    if (!user?.id) return;

    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);
              // ✅ SUPPRIMER LE FICHIER DE STORAGE
              const filename = avatarUrl?.split('/').pop();
              if (filename) {
                await supabase
                  .storage
                  .from(CONFIG.BUCKET_NAME)
                  .remove([`profile-images/${filename}`]);
              }

              // ✅ SUPPRIMER L'URL DE LA TABLE `profiles`
              await supabase
                .from('profiles')
                .upsert({
                  id: user.id,
                  avatar_url: null,
                });

              setProfileImageUri(null);
              setAvatarUrl(null);
              Alert.alert('✅ Photo supprimée', 'Votre photo de profil a été supprimée.');
            } catch (error) {
              console.error('Error deleting profile image:', error);
              Alert.alert('❌ Erreur', 'Impossible de supprimer la photo.');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  }, [user, avatarUrl]);

  const executeUpload = async () => {
    setLoading(true);
    try {
      Alert.alert('✅ Succès', 'Fichiers préparés avec succès!');
      clearMedia();
    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du téléversement');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishProcess = useCallback(() => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert('⚠️ Attention', 'Aucun fichier sélectionné.');
      return;
    }
    executeUpload();
  }, [selectedMedia, recordedAudioUri]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter votre session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }, [logout]);

  const handleTermsPress = () => {
    Linking.openURL('https://votre-app.com/conditions-generales').catch(console.error);
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://votre-app.com/politique-confidentialite').catch(console.error);
  };

  // ========== RENDER ==========
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }]}>
            Profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'settings' ? colors.primary : colors.textSecondary }]}>
            Paramètres
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && (
          <>
            <View style={styles.profileHeader}>
             
              <TouchableOpacity
                onPress={pickProfileImage}
                activeOpacity={0.7}
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : profileImageUri ? (
                  <>
                    <Image
                      source={{ uri: profileImageUri }}
                      style={styles.avatarImage}
                    />
                    <TouchableOpacity
                      style={styles.removeAvatarButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        removeProfileImage();
                      }}
                    >
                      <MaterialIcons name="close" size={20} color={colors.onError} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                    <FontAwesome name="user-md" size={36} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userEmail}
              </Text>

              {!profileImageUri && !isUploading && (
                <TouchableOpacity
                  style={[styles.changeAvatarButton, { backgroundColor: colors.surface }]}
                  onPress={pickProfileImage}
                >
                  <MaterialIcons name="camera-alt" size={16} color={colors.primary} />
                  <Text style={[styles.changeAvatarText, { color: colors.primary }]}>
                    Ajouter une photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <AdminView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            />

            
             <AdvertiserView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
          
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Compte
              </Text>

              <View style={styles.accountInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  {profileImageUri ? (
                    <Image source={{ uri: profileImageUri }} style={styles.settingsAvatarImage} />
                  ) : (
                    <MaterialIcons name="person" size={28} color={colors.primary} />
                  )}
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    {userName}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setActiveTab('profile');
                  setTimeout(() => pickProfileImage(), 300); // Petit délai pour le changement d'onglet
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="camera-alt" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Changer la photo de profil
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={22} color={colors.error} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Déconnexion
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Informations légales
              </Text>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleTermsPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="description" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Conditions générales d'utilisation
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handlePrivacyPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="security" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Politique de confidentialité
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderBottomWidth: 0 }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                À propos
              </Text>

              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <MaterialIcons name="info" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Version {CONFIG.APP_VERSION}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  // Styles pour la photo de profil
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  removeAvatarButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
  },
});
*/



















/*
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';

// Components
import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// ========== CONFIG ==========
const CONFIG = {

  BUCKET_NAME: 'ganbanaaxu-media',
  AUTH_CACHE_KEY: 'supabase_session',
  APP_VERSION: '1.0.0',
};

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ✅ FONCTION POUR UPLOADER LA PHOTO VERS SUPABASE (CORRIGÉE : BLOB + URL PUBLIQUE)
const uploadProfileImageToSupabase = async (userId: string, uri: string) => {
  try {
    const filename = `profile_${userId}_${Date.now()}.jpg`;
    const filePath = `profile-images/${filename}`;

    // 1. Convertir l'URI locale en Blob (Méthode robuste pour React Native)
    const response = await fetch(uri);
    const blob = await response.blob();

    // 2. Uploader le Blob
    const { data, error } = await supabase
      .storage
      .from(CONFIG.BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // 3. Récupérer l'URL publique complète pour l'affichage
    const { data: publicUrlData } = supabase
      .storage
      .from(CONFIG.BUCKET_NAME)
      .getPublicUrl(data?.path || filePath);

    return publicUrlData.publicUrl; // Retourne l'URL https://...
  } catch (error) {
    console.error('Erreur upload photo:', error);
    throw error;
  }
};

// ========== TYPES ==========
type TabType = 'profile' | 'settings';
type MediaItem = { uri: string; type: string; name?: string };

type ThemeColors = {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  onPrimary: string;
  error: string;
  onError: string;
  surface: string;
  border: string;
  success: string;
};

const getTheme = (isDark: boolean): ThemeColors => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  onPrimary: isDark ? '#000000' : '#FFFFFF',
  error: '#FF3B30',
  onError: '#FFFFFF',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
  border: isDark ? '#333333' : '#E0E0E0',
  success: '#34C759',
});

// ========== HOOKS ==========
const useAuth = () => {
  const [user, setUser] = useState<any>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session && isMounted) {
          const currentUser = session.user;
          setUser(currentUser);
          setUserEmail(currentUser?.email || '');
          setUserName(
            currentUser?.user_metadata?.full_name ||
            currentUser?.email?.split('@')[0] ||
            'Utilisateur'
          );

          // ✅ RÉCUPÉRER L'AVATAR DEPUIS LA TABLE `profiles`
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('avatar_url')
            .eq('id', currentUser.id)
            .single();

          if (!profileError && profile?.avatar_url) {
            setAvatarUrl(profile.avatar_url);
          }
        }
      } catch (error) {
        console.error('Auth Check Error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setUserEmail('');
          setUserName('');
          setAvatarUrl(null);
          router.replace('/');
        }
      }
    });

    return () => {
      isMounted = false;
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [router]);

 


  const logout = useCallback(async () => {
  try {
    setLoading(true);
    // Supabase se charge déjà de supprimer les tokens dans SecureStore
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    router.replace('/');
  } catch (error) {
    console.error('Logout Error:', error);
    Alert.alert('❌ Erreur', 'Impossible de vous déconnecter. Veuillez réessayer.');
  } finally {
    setLoading(false);
  }
}, [router]);

  return { user, userEmail, userName, avatarUrl, loading, logout };
};

const useMedia = () => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      const cleanUp = async () => {
        if (recording && !recording.isUnloaded) {
          try {
            await recording.stopAndUnloadAsync();
          } catch (e) {
            console.warn('Recording déjà nettoyé:', e);
          }
        }
        if (sound) {
          try {
            await sound.unloadAsync();
          } catch (e) {
            console.warn('Sound déjà nettoyé:', e);
          }
        }
      };
      cleanUp();
    };
  }, [recording, sound]);

  const pickMedia = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newMedia = result.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type || 'image',
          name: asset.fileName ?? undefined,
        }));
        setSelectedMedia(prev => [...prev, ...newMedia]);
      }
    } catch (error) {
      console.error('Pick Media Error:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner le média.');
    }
  }, []);

  const pickAudio = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick Audio Error:', error);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (isRecording && recording) {
        await stopRecording();
      }

      if (recording) {
        try {
          if (!recording.isUnloaded) {
            await recording.stopAndUnloadAsync();
          }
        } catch (e) {
          console.warn('Nettoyage forcé du recording:', e);
        }
        setRecording(null);
      }

      const permissionResponse = await Audio.requestPermissionsAsync();
      if (permissionResponse.status !== 'granted') {
        Alert.alert('Permission refusée', 'L\'accès au microphone est nécessaire.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording error:', err);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  }, [isRecording, recording]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      if (uri) {
        setRecordedAudioUri(uri);
      }
    } catch (error) {
      console.error('Stop recording error:', error);
      if (error.message?.includes('already been unloaded')) {
        setRecording(null);
      }
    } finally {
      setRecording(null);
    }
  }, [recording]);

  const toggleAudioPreview = useCallback(async () => {
    if (!recordedAudioUri) return;

    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlayingAudio(false);
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: recordedAudioUri },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          newSound.unloadAsync().catch(console.error);
          setIsPlayingAudio(false);
          setSound(null);
        }
      });

      setSound(newSound);
      setIsPlayingAudio(true);
    } catch (error) {
      console.error('Toggle Audio Preview Error:', error);
    }
  }, [recordedAudioUri, sound]);

  const clearMedia = useCallback(() => {
    setSelectedMedia([]);
    setRecordedAudioUri(null);
    if (sound) {
      sound.unloadAsync().catch(console.error);
      setSound(null);
    }
    setIsPlayingAudio(false);
  }, [sound]);

  return {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  };
};

// ========== MAIN COMPONENT ==========
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = getTheme(isDark);

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { user, userEmail, userName, avatarUrl, loading: authLoading, logout } = useAuth();
  const {
    selectedMedia,
    recordedAudioUri,
    isRecording,
    isPlayingAudio,
    loading,
    pickMedia,
    pickAudio,
    startRecording,
    stopRecording,
    toggleAudioPreview,
    clearMedia,
    setSelectedMedia,
    setRecordedAudioUri,
    setIsPlayingAudio,
    setLoading,
  } = useMedia();

  // ✅ INITIALISER profileImageUri AVEC avatarUrl DE SUPABASE
  useEffect(() => {
    if (avatarUrl) {
      setProfileImageUri(avatarUrl);
    }
  }, [avatarUrl]);

  // ✅ FONCTION POUR SÉLECTIONNER ET UPLOADER LA PHOTO
  const pickProfileImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorisez l\'accès aux photos pour changer votre avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0] && user?.id) {
        const uri = result.assets[0].uri;
        setProfileImageUri(uri); // Affiche l'image immédiatement
        setIsUploading(true);

        try {
          // ✅ UPLOAD VERS SUPABASE ET RÉCUPÉRATION URL PUBLIQUE
          const uploadedUrl = await uploadProfileImageToSupabase(user.id, uri);

          // ✅ METTRE À JOUR LA TABLE `profiles` AVEC L'URL
          await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              avatar_url: uploadedUrl,
              full_name: userName,
            });

          // ✅ Mettre à jour l'image finale
          setProfileImageUri(uploadedUrl);
          Alert.alert('✅ Succès', 'Votre photo de profil a été mise à jour !');
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          Alert.alert('❌ Erreur', 'Impossible d\'uploader la photo. Veuillez réessayer.');
          // Si on avait un vieil avatar on le remet, sinon null
          setProfileImageUri(avatarUrl); 
        } finally {
          setIsUploading(false);
        }
      }
    } catch (error) {
      console.error('Profile Image Error:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner la photo.');
      setIsUploading(false);
    }
  }, [user, userName, avatarUrl]);

  // ✅ FONCTION POUR SUPPRIMER LA PHOTO
  const removeProfileImage = useCallback(async () => {
    if (!user?.id) return;

    Alert.alert(
      'Supprimer la photo',
      'Êtes-vous sûr de vouloir supprimer votre photo de profil ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploading(true);
              // ✅ SUPPRIMER LE FICHIER DE STORAGE
              const filename = avatarUrl?.split('/').pop();
              if (filename) {
                await supabase
                  .storage
                  .from(CONFIG.BUCKET_NAME)
                  .remove([`profile-images/${filename}`]);
              }

              // ✅ SUPPRIMER L'URL DE LA TABLE `profiles`
              await supabase
                .from('profiles')
                .upsert({
                  id: user.id,
                  avatar_url: null,
                });

              setProfileImageUri(null);
              Alert.alert('✅ Photo supprimée', 'Votre photo de profil a été supprimée.');
            } catch (error) {
              console.error('Error deleting profile image:', error);
              Alert.alert('❌ Erreur', 'Impossible de supprimer la photo.');
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  }, [user, avatarUrl]);

  const executeUpload = async () => {
    setLoading(true);
    try {
      Alert.alert('✅ Succès', 'Fichiers préparés avec succès!');
      clearMedia();
    } catch (error) {
      Alert.alert('❌ Erreur', 'Échec du téléversement');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishProcess = useCallback(() => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert('⚠️ Attention', 'Aucun fichier sélectionné.');
      return;
    }
    executeUpload();
  }, [selectedMedia, recordedAudioUri]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter votre session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  }, [logout]);

  const handleTermsPress = () => {
    Linking.openURL('https://votre-app.com/conditions-generales').catch(console.error);
  };

  const handlePrivacyPress = () => {
    Linking.openURL('https://votre-app.com/politique-confidentialite').catch(console.error);
  };

  // ========== RENDER ==========
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.tabContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={activeTab === 'profile' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? colors.primary : colors.textSecondary }]}>
            Profil
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.tabText, { color: activeTab === 'settings' ? colors.primary : colors.textSecondary }]}>
            Paramètres
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'profile' && (
          <>
            <View style={styles.profileHeader}>
             
              <TouchableOpacity
                onPress={pickProfileImage}
                activeOpacity={0.7}
                disabled={isUploading}
              >
                {isUploading ? (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : profileImageUri ? (
                  <>
                    <Image
                      source={{ uri: profileImageUri }}
                      style={styles.avatarImage}
                    />
                    <TouchableOpacity
                      style={styles.removeAvatarButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        removeProfileImage();
                      }}
                    >
                      <MaterialIcons name="close" size={20} color={colors.onError} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={[styles.avatarCircle, { backgroundColor: colors.surface }]}>
                    <FontAwesome name="user-md" size={36} color={colors.primary} />
                  </View>
                )}
              </TouchableOpacity>

              <Text style={[styles.userName, { color: colors.text }]}>{userName}</Text>
              <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
                {userEmail}
              </Text>

              {!profileImageUri && !isUploading && (
                <TouchableOpacity
                  style={[styles.changeAvatarButton, { backgroundColor: colors.surface }]}
                  onPress={pickProfileImage}
                >
                  <MaterialIcons name="camera-alt" size={16} color={colors.primary} />
                  <Text style={[styles.changeAvatarText, { color: colors.primary }]}>
                    Ajouter une photo
                  </Text>
                </TouchableOpacity>
              )}
            </View>

          
            <AdminView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            />

         
             <AdvertiserView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            /> 
          </>
        )}

        {activeTab === 'settings' && (
          <>
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Compte
              </Text>

              <View style={styles.accountInfo}>
                <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
                  {profileImageUri ? (
                    <Image source={{ uri: profileImageUri }} style={styles.settingsAvatarImage} />
                  ) : (
                    <MaterialIcons name="person" size={28} color={colors.primary} />
                  )}
                </View>
                <View style={styles.accountDetails}>
                  <Text style={[styles.accountName, { color: colors.text }]}>
                    {userName}
                  </Text>
                  <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>
                    {userEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setActiveTab('profile');
                  setTimeout(() => pickProfileImage(), 300); // Petit délai pour le changement d'onglet
                }}
                activeOpacity={0.7}
              >
                <MaterialIcons name="camera-alt" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Changer la photo de profil
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <MaterialIcons name="logout" size={22} color={colors.error} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Déconnexion
                </Text>
                <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                Informations légales
              </Text>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handleTermsPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="description" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Conditions générales d'utilisation
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={handlePrivacyPress}
                activeOpacity={0.7}
              >
                <MaterialIcons name="security" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Politique de confidentialité
                </Text>
                <MaterialIcons name="open-in-new" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card, borderBottomWidth: 0 }]}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                À propos
              </Text>

              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <MaterialIcons name="info" size={22} color={colors.primary} />
                <Text style={[styles.settingItemText, { color: colors.text }]}>
                  Version {CONFIG.APP_VERSION}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: 'rgba(106, 90, 205, 0.1)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  // Styles pour la photo de profil
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  removeAvatarButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF3B30',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  changeAvatarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingsAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginTop: 8,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '400',
  },
  section: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountEmail: {
    fontSize: 14,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  settingItemText: {
    flex: 1,
    fontSize: 16,
  },
});
*/















/*

import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
});

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);

  useEffect(() => {
    // Récupérer les informations de l'utilisateur connecté
    const getUserData = async () => {
      try {
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(currentUser);
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error } = await supabase.auth.signOut();
              if (error) throw error;

              // Redirection directe vers la page de connexion
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 24,
    },
    card: {
      width: '100%',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    value: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 16,
    },
    signOutButton: {
      width: '100%',
      backgroundColor: colors.danger,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
    },
    signOutButtonText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Text style={styles.title}>Mon Profil</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Adresse Email</Text>
          <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>

          <Text style={styles.label}>Identifiant Utilisateur</Text>
          <Text style={[styles.value, { marginBottom: 0 }]}>{user?.id || 'Inconnu'}</Text>
        </View>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
          disabled={signOutLoading}
          activeOpacity={0.8}
        >
          {signOutLoading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.signOutButtonText}>Se déconnecter</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
*/










/*

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Image, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { createClient } from '@supabase/supabase-js';



import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';




// Configuration Supabase directement intégrée
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET_NAME = 'ganbanaaxu-media';

export default function ProfileScreen({ isDark }: { isDark?: boolean }) {
  // États utilisateur
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'advertiser' | 'user'>('user');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // États médias & audio
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  // Référence pour l'enregistrement audio
  const [recordingObject, setRecordingObject] = useState<Audio.Recording | null>(null);

  // ---------------------------------------------------------------------------
  // INITIALISATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchUserProfile();

    return () => {
      if (recordingObject) {
        recordingObject.stopAndUnloadAsync();
      }
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUserId(session.user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (profile) {
          setUserRole(profile.role || 'user');
          setProfileImage(profile.avatar_url || null);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GESTION DE L'AVATAR
  // ---------------------------------------------------------------------------
  const handleUpdateAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && userId) {
        setLoading(true);
        const imageUri = result.assets[0].uri;
        const filePath = `profile-images/${userId}.jpg`;

        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

        await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', userId);

        setProfileImage(newAvatarUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour.');
      }
    } catch (error) {
      Alert.alert('Erreur', "Impossible de mettre à jour l'image de profil.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GESTION DES MÉDIAS & AUDIO
  // ---------------------------------------------------------------------------
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setSelectedMedia(result.assets[0]);
  };

  const pickAudio = async () => {
    // Sélection audio
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecordingObject(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur lors du démarrage de l'enregistrement", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingObject) {
      await recordingObject.stopAndUnloadAsync();
      const uri = recordingObject.getURI();
      setRecordedAudioUri(uri);
      setRecordingObject(null);
    }
  };

  const toggleAudioPreview = async () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handlePublishProcess = async () => {
    Alert.alert('Publication', 'Média publié avec succès !');
  };

  // ---------------------------------------------------------------------------
  // RENDU
  // ---------------------------------------------------------------------------
  return (
    <ScrollView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
    
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUpdateAvatar} disabled={loading}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.placeholderText}>+</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.darkText]}>Mon Profil</Text>
      </View>

      {userRole === 'admin' && (
        <AdminView
          isDark={isDark}
          selectedMedia={selectedMedia}
          recordedAudioUri={recordedAudioUri}
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          loading={loading}
          pickMedia={pickMedia}
          pickAudio={pickAudio}
          setSelectedMedia={setSelectedMedia}
          setRecordedAudioUri={setRecordedAudioUri}
          setIsPlayingAudio={setIsPlayingAudio}
          startRecording={startRecording}
          stopRecording={stopRecording}
          toggleAudioPreview={toggleAudioPreview}
          handlePublishProcess={handlePublishProcess}
        />
      )}

      {userRole === 'advertiser' && (
        <AdvertiserView
          isDark={isDark}
          selectedMedia={selectedMedia}
          recordedAudioUri={recordedAudioUri}
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          loading={loading}
          pickMedia={pickMedia}
          pickAudio={pickAudio}
          setSelectedMedia={setSelectedMedia}
          setRecordedAudioUri={setRecordedAudioUri}
          setIsPlayingAudio={setIsPlayingAudio}
          startRecording={startRecording}
          stopRecording={stopRecording}
          toggleAudioPreview={toggleAudioPreview}
          handlePublishProcess={handlePublishProcess}
        />
      )}

      {userRole === 'user' && (
        <View style={styles.userView}>
          <Text style={[styles.infoText, isDark && styles.darkText]}>
            Bienvenue ! Vous êtes actuellement connecté en tant qu'utilisateur standard.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  lightContainer: {
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 40,
    color: '#757575',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  darkText: {
    color: '#FFFFFF',
  },
  infoText: {
    textAlign: 'center',
    color: '#333333',
  },
  userView: {
    padding: 20,
    alignItems: 'center',
  },
});

*/








/*

import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity, Image, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { createClient } from '@supabase/supabase-js';

// Importation des sous-composants existants
import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// Configuration Supabase avec vos identifiants en dur (Syntaxe corrigée)
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET_NAME = 'ganbanaaxu-media';

export default function ProfileScreen({ isDark }: { isDark?: boolean }) {
  // États utilisateur
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'advertiser' | 'user'>('user');
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // États médias & audio
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [loading, setLoading] = useState(false);

  // Référence pour l'enregistrement audio
  const [recordingObject, setRecordingObject] = useState<Audio.Recording | null>(null);

  // ---------------------------------------------------------------------------
  // INITIALISATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchUserProfile();

    return () => {
      if (recordingObject) {
        recordingObject.stopAndUnloadAsync();
      }
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUserId(session.user.id);

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, avatar_url')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (profile) {
          setUserRole(profile.role || 'user');
          setProfileImage(profile.avatar_url || null);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GESTION DE L'AVATAR
  // ---------------------------------------------------------------------------
  const handleUpdateAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && userId) {
        setLoading(true);
        const imageUri = result.assets[0].uri;
        const filePath = `profile-images/${userId}.jpg`;

        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

        await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', userId);

        setProfileImage(newAvatarUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour.');
      }
    } catch (error) {
      Alert.alert('Erreur', "Impossible de mettre à jour l'image de profil.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GESTION DES MÉDIAS & AUDIO
  // ---------------------------------------------------------------------------
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setSelectedMedia(result.assets[0]);
  };

  const pickAudio = async () => {
    // Sélection audio
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecordingObject(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur lors du démarrage de l'enregistrement", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingObject) {
      await recordingObject.stopAndUnloadAsync();
      const uri = recordingObject.getURI();
      setRecordedAudioUri(uri);
      setRecordingObject(null);
    }
  };

  const toggleAudioPreview = async () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handlePublishProcess = async () => {
    Alert.alert('Publication', 'Média publié avec succès !');
  };

  // ---------------------------------------------------------------------------
  // RENDU
  // ---------------------------------------------------------------------------
  return (
    <ScrollView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
     
      <View style={styles.header}>
        <TouchableOpacity onPress={handleUpdateAvatar} disabled={loading}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.avatar} />
          ) : (
            <View style={styles.placeholderAvatar}>
              <Text style={styles.placeholderText}>+</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={[styles.title, isDark && styles.darkText]}>Mon Profil</Text>
      </View>

     
        <AdminView
          isDark={isDark}
          selectedMedia={selectedMedia}
          recordedAudioUri={recordedAudioUri}
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          loading={loading}
          pickMedia={pickMedia}
          pickAudio={pickAudio}
          setSelectedMedia={setSelectedMedia}
          setRecordedAudioUri={setRecordedAudioUri}
          setIsPlayingAudio={setIsPlayingAudio}
          startRecording={startRecording}
          stopRecording={stopRecording}
          toggleAudioPreview={toggleAudioPreview}
          handlePublishProcess={handlePublishProcess}
        />
        
        <AdvertiserView
          isDark={isDark}
          selectedMedia={selectedMedia}
          recordedAudioUri={recordedAudioUri}
          isRecording={isRecording}
          isPlayingAudio={isPlayingAudio}
          loading={loading}
          pickMedia={pickMedia}
          pickAudio={pickAudio}
          setSelectedMedia={setSelectedMedia}
          setRecordedAudioUri={setRecordedAudioUri}
          setIsPlayingAudio={setIsPlayingAudio}
          startRecording={startRecording}
          stopRecording={stopRecording}
          toggleAudioPreview={toggleAudioPreview}
          handlePublishProcess={handlePublishProcess}
        />
    

     
        <View style={styles.userView}>
          <Text style={[styles.infoText, isDark && styles.darkText]}>
            Bienvenue ! Vous êtes actuellement connecté en tant qu'utilisateur standard.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  lightContainer: {
    backgroundColor: '#FFFFFF',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  placeholderText: {
    fontSize: 40,
    color: '#757575',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  darkText: {
    color: '#FFFFFF',
  },
  infoText: {
    textAlign: 'center',
    color: '#333333',
  },
  userView: {
    padding: 20,
    alignItems: 'center',
  },
});

*/



















/*
import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useColorScheme,
  Alert,
  ActivityIndicator,
  Linking,
  Image,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { createClient } from '@supabase/supabase-js';

// Importation des sous-composants
import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// Configuration Supabase avec vos identifiants
const SUPABASE_URL = 'https://tuciyiawyawrhifpjmmn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET_NAME = 'ganbanaaxu-media';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  // États généraux (Onglets et Utilisateur)
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<'admin' | 'advertiser' | 'user'>('user');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // États médias & audio
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingObject, setRecordingObject] = useState<Audio.Recording | null>(null);

  // ---------------------------------------------------------------------------
  // INITIALISATION
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchUserProfile();
    return () => {
      if (recordingObject) {
        recordingObject.stopAndUnloadAsync();
      }
    };
  }, []);

  const fetchUserProfile = async () => {
    try {
      setAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email || '');

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, avatar_url, full_name')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (profile) {
          setUserRole(profile.role || 'user');
          setProfileImage(profile.avatar_url || null);
          setUserName(profile.full_name || session.user.email?.split('@')[0] || 'Utilisateur');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GESTION DE L'AVATAR
  // ---------------------------------------------------------------------------
  const handleUpdateAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && userId) {
        setLoading(true);
        const imageUri = result.assets[0].uri;
        const filePath = `profile-images/${userId}_${Date.now()}.jpg`;

        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        const newAvatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

        await supabase
          .from('profiles')
          .update({ avatar_url: newAvatarUrl })
          .eq('id', userId);

        setProfileImage(newAvatarUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour.');
      }
    } catch (error) {
      Alert.alert('Erreur', "Impossible de mettre à jour l'image de profil.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // GESTION DES MÉDIAS & AUDIO
  // ---------------------------------------------------------------------------
  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled) setSelectedMedia([result.assets[0]]);
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Pick Audio Error:', error);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecordingObject(recording);
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur lors du démarrage de l'enregistrement", err);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingObject) {
      await recordingObject.stopAndUnloadAsync();
      const uri = recordingObject.getURI();
      if (uri) setRecordedAudioUri(uri);
      setRecordingObject(null);
    }
  };

  const toggleAudioPreview = async () => {
    setIsPlayingAudio(!isPlayingAudio);
  };

  const handlePublishProcess = async () => {
    Alert.alert('Publication', 'Média publié avec succès !');
  };

  // ---------------------------------------------------------------------------
  // DÉCONNEXION & LIENS
  // ---------------------------------------------------------------------------
  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir quitter votre session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/');
          },
        },
      ]
    );
  };

  const handleTermsPress = () => Linking.openURL('https://votre-app.com/conditions-generales');
  const handlePrivacyPress = () => Linking.openURL('https://votre-app.com/politique-confidentialite');

  // ---------------------------------------------------------------------------
  // RENDU PRINCIPAL
  // ---------------------------------------------------------------------------
  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6A5ACD" />
          <Text style={[styles.loadingText, isDark && styles.darkText]}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
      
      
      <View style={[styles.tabContainer, isDark && styles.darkCard]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <MaterialIcons name="person" size={20} color={activeTab === 'profile' ? '#6A5ACD' : '#6C757D'} />
          <Text style={[styles.tabText, { color: activeTab === 'profile' ? '#6A5ACD' : '#6C757D' }]}>Profil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <MaterialIcons name="settings" size={20} color={activeTab === 'settings' ? '#6A5ACD' : '#6C757D'} />
          <Text style={[styles.tabText, { color: activeTab === 'settings' ? '#6A5ACD' : '#6C757D' }]}>Paramètres</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
   
        {activeTab === 'profile' && (
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleUpdateAvatar} disabled={loading}>
                {loading ? (
                  <View style={styles.placeholderAvatar}>
                    <ActivityIndicator size="small" color="#6A5ACD" />
                  </View>
                ) : profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={styles.placeholderAvatar}>
                    <FontAwesome name="user" size={40} color="#757575" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={[styles.title, isDark && styles.darkText]}>{userName || 'Mon Profil'}</Text>
              <Text style={[styles.userEmail, isDark && styles.darkTextSecondary]}>{userEmail}</Text>
            </View>

           
            
            <AdminView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            /> 
            

            
            <AdvertiserView
              isDark={isDark}
              selectedMedia={selectedMedia}
              recordedAudioUri={recordedAudioUri}
              isRecording={isRecording}
              isPlayingAudio={isPlayingAudio}
              loading={loading}
              pickMedia={pickMedia}
              pickAudio={pickAudio}
              setSelectedMedia={setSelectedMedia}
              setRecordedAudioUri={setRecordedAudioUri}
              setIsPlayingAudio={setIsPlayingAudio}
              startRecording={startRecording}
              stopRecording={stopRecording}
              toggleAudioPreview={toggleAudioPreview}
              handlePublishProcess={handlePublishProcess}
            /> 
            

            <View style={styles.userView}>
              <Text style={[styles.infoText, isDark && styles.darkText]}>
                Bienvenue ! Vous êtes actuellement connecté en tant que {userRole}.
              </Text>
            </View>
          </>
        )}

        
        {activeTab === 'settings' && (
          <>
            <View style={[styles.section, isDark && styles.darkCard]}>
              <Text style={styles.sectionTitle}>Compte</Text>
              
              <TouchableOpacity 
                style={styles.settingItem} 
                onPress={() => { setActiveTab('profile'); handleUpdateAvatar(); }}
              >
                <MaterialIcons name="camera-alt" size={22} color="#6A5ACD" />
                <Text style={[styles.settingItemText, isDark && styles.darkText]}>Changer la photo de profil</Text>
                <MaterialIcons name="chevron-right" size={22} color="#6C757D" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                <MaterialIcons name="logout" size={22} color="#FF3B30" />
                <Text style={[styles.settingItemText, isDark && styles.darkText]}>Déconnexion</Text>
                <MaterialIcons name="chevron-right" size={22} color="#6C757D" />
              </TouchableOpacity>
            </View>

            <View style={[styles.section, isDark && styles.darkCard]}>
              <Text style={styles.sectionTitle}>Informations légales</Text>
              
              <TouchableOpacity style={styles.settingItem} onPress={handleTermsPress}>
                <MaterialIcons name="description" size={22} color="#6A5ACD" />
                <Text style={[styles.settingItemText, isDark && styles.darkText]}>Conditions générales</Text>
                <MaterialIcons name="open-in-new" size={18} color="#6C757D" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.settingItem, { borderBottomWidth: 0 }]} onPress={handlePrivacyPress}>
                <MaterialIcons name="security" size={22} color="#6A5ACD" />
                <Text style={[styles.settingItemText, isDark && styles.darkText]}>Confidentialité</Text>
                <MaterialIcons name="open-in-new" size={18} color="#6C757D" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1 },
  lightContainer: { backgroundColor: '#F8F9FA' },
  darkContainer: { backgroundColor: '#121212' },
  
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 16, fontWeight: '500' },
  
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  darkCard: { backgroundColor: '#1E1E1E', borderBottomColor: '#333' },
  tab: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6, 
    paddingVertical: 10, 
    borderRadius: 10 
  },
  activeTab: { backgroundColor: 'rgba(106, 90, 205, 0.1)' },
  tabText: { fontSize: 14, fontWeight: '600' },
  
  scrollContent: { padding: 16 },
  
  header: { alignItems: 'center', marginBottom: 24, marginTop: 20 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10 },
  placeholderAvatar: {
    width: 100, 
    height: 100, 
    borderRadius: 50,
    backgroundColor: '#E0E0E0',
    alignItems: 'center', 
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 22, fontWeight: 'bold' },
  userEmail: { fontSize: 14, color: '#6C757D', marginTop: 4 },
  darkText: { color: '#FFFFFF' },
  darkTextSecondary: { color: '#A0A0A0' },
  
  userView: { padding: 20, alignItems: 'center' },
  infoText: { textAlign: 'center', color: '#6C757D' },

  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    color: '#6C757D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingItemText: { flex: 1, fontSize: 16, color: '#1C1E21' },
});
*/

























/*


import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
});

type ViewMode = 'main' | 'settings';

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  // États
  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupération des données utilisateur (Compatible Hors Ligne)
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  // Déconnexion
  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  // Styles
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginBottom: 16,
      marginTop: 8,
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 4,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 16,
    },
    menuButton: {
      width: '100%',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      elevation: 1,
    },
    menuLeftContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 12,
    },
    card: {
      width: '100%',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    value: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 16,
    },
    signOutButton: {
      width: '100%',
      backgroundColor: colors.danger,
      padding: 15,
      borderRadius: 12,
      alignItems: 'center',
    },
    signOutButtonText: {
      color: '#FFF',
      fontSize: 15,
      fontWeight: '700',
    },
    errorText: {
      color: colors.danger,
      marginBottom: 16,
      textAlign: 'center',
    },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        // PAGE PRINCIPALE : PROFIL 
        {activeView === 'main' && (
          <View>
            <Text style={styles.title}>Mon Profil</Text>
            <AdminView />

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        // PAGE : PARAMÈTRES (AFFICHE LES DEUX PARTIES)
        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            // PARTIE 1 : INFORMATIONS PERSONNELLES 
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>

              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>

              <Text style={styles.label}>Identifiant Utilisateur</Text>
              <Text style={[styles.value, { marginBottom: 0 }]}>{user?.id || 'Inconnu'}</Text>
            </View>

            // PARTIE 2 : DÉCONNEXION
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
*/





















/*
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
});

type ViewMode = 'main' | 'settings';

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  // États
  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('advertiser'); // <-- NOUVEL ÉTAT POUR LE RÔLE
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupération des données utilisateur
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          setUser(session.user);
          
          // --- LOGIQUE POUR RÉCUPÉRER LE RÔLE ---
          // Exemple 1: Si le rôle est dans les metadata de Supabase
          // const role = session.user.user_metadata?.role || 'advertiser';
          
          // Exemple 2: Simulé pour l'instant (à remplacer par ta propre logique)
          const role = 'admin'; // Change ceci en 'advertiser' pour tester l'autre vue
          setUserRole(role);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  // Déconnexion
  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  // Styles (inchangés)
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16, marginTop: 8 },
    backButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    menuButton: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    menuLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuButtonText: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12 },
    card: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
    signOutButton: { width: '100%', backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
    signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        
        {activeView === 'main' && (
          <View>
            <Text style={styles.title}>Mon Profil</Text>

             
            {userRole === 'admin' ? (
              <AdminView />
            ) : (
              <AdvertiserView />
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        
        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations personnelles</Text>
              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>
              <Text style={styles.label}>Identifiant Utilisateur</Text>
              <Text style={[styles.value, { marginBottom: 0 }]}>{user?.id || 'Inconnu'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
*/










/*

import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';


import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  success: '#388E3C',
});

type ViewMode = 'main' | 'settings';

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  // États existants
  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('advertiser');
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nouveaux états pour le profil
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // Récupération des données utilisateur
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          setUser(session.user);
          
          // Récupérer le nom et l'avatar depuis la table profiles
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setFullName(profileData.full_name || '');
            setAvatarUrl(profileData.avatar_url || '');
          }
          
          // Simulation du rôle
          const role = 'admin'; 
          setUserRole(role);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  // --- MISE À JOUR DU NOM ---
  const handleUpdateName = async () => {
    if (!user) return;
    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (updateError) throw updateError;
      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };





// --- UPLOAD PHOTO DE PROFIL ---
const handlePickImage = async () => {
  if (!user) return;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.3,
  });

  if (!result.canceled) {
    try {
      setUpdating(true);
      const imageUri = result.assets[0].uri;

      // 1. Lire le fichier local en Base64 via FileSystem
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // 2. Convertir la chaîne Base64 en ArrayBuffer
      const arrayBuffer = decode(base64);

      // 3. Définir le chemin d'accès unique
      const filePath = `${user.id}/${Date.now()}.jpg`;

      // 4. Upload de l'ArrayBuffer dans Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true, // Écrase si un fichier existe déjà
        });

      if (uploadError) throw uploadError;

      // 5. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 6. Mettre à jour la table profiles
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      Alert.alert('Succès', 'Photo de profil mise à jour !');
    } catch (err: any) {
      console.error('Erreur Upload:', err);
      Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
    } finally {
      setUpdating(false);
    }
  }
};










  // Déconnexion
  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  // Styles
  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16, marginTop: 8 },
    backButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    menuButton: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    menuLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuButtonText: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12 },
    card: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
    signOutButton: { width: '100%', backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
    signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
    
    // Nouveaux styles pour le profil
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    input: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
    saveButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        // VUE PRINCIPALE 
        {activeView === 'main' && (
          <View>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24}}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                   <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View>
                <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]}>
                  {fullName || 'Mon Profil'}
                </Text>
                <Text style={{color: colors.textSecondary}}>{user?.email}</Text>
              </View>
            </View>

            {userRole === 'admin' ? (
              <AdminView />
            ) : (
              <AdvertiserView />
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres du profil</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        // VUE PARAMÈTRES 
        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            // CARTE : MODIFICATION DU PROFIL
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Modifier mon profil</Text>
              
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handlePickImage} disabled={updating}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer le nom</Text>
                )}
              </TouchableOpacity>
            </View>

            // CARTE : INFOS SESSION 
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations de compte</Text>
              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>
            </View>

            // CARTE : DÉCONNEXION 
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
*/




















/*
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  success: '#388E3C',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRE : EXTRAIRE LA PREMIÈRE IMAGE ---
const getFirstMediaUrl = (mediaData: any): string | null => {
  if (!mediaData) return null;
  try {
    let parsed = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
    if (!Array.isArray(parsed)) parsed = [parsed];
    const urls = parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http'));
    return urls.length > 0 ? urls[0] : null;
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    const matches = (typeof mediaData === 'string' ? mediaData : JSON.stringify(mediaData)).match(regex);
    return matches && matches.length > 0 ? matches[0] : null;
  }
};

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  // États existants
  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('advertiser');
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nouveaux états pour le profil
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // Nouveaux états pour les publications de l'utilisateur
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Récupération des données utilisateur et de ses publications
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          setUser(session.user);
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setFullName(profileData.full_name || '');
            setAvatarUrl(profileData.avatar_url || '');
          }

          fetchMyPosts(session.user.id);
          
          const role = 'admin'; 
          setUserRole(role);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPosts(data || []);
    } catch (err: any) {
      console.error('Erreur récupération posts :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      "Supprimer la publication",
      "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;
              
              setMyPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (updateError) throw updateError;
      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const imageUri = result.assets[0].uri;

        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const arrayBuffer = decode(base64);
        const filePath = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true, 
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (err: any) {
        console.error('Erreur Upload:', err);
        Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16, marginTop: 8 },
    backButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    menuButton: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    menuLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuButtonText: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12 },
    card: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
    signOutButton: { width: '100%', backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
    signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
    
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    input: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
    saveButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    // NOUVEAUX STYLES POUR LA LISTE DES PUBLICATIONS AVEC MINIATURES
    postItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    postThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border },
    iconThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    postContent: { flex: 1, marginRight: 12 },
    postCaption: { fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 4 },
    postDate: { fontSize: 12, color: colors.textSecondary },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        // VUE PRINCIPALE
        {activeView === 'main' && (
          <View>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24}}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                   <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View>
                <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]}>
                  {fullName || 'Mon Profil'}
                </Text>
                <Text style={{color: colors.textSecondary}}>{user?.email}</Text>
              </View>
            </View>

            {userRole === 'admin' ? (
              <AdminView />
            ) : (
              <AdvertiserView />
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres du profil</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            // CARTE : MES PUBLICATIONS 
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Mes Publications</Text>
              
              {loadingPosts ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : myPosts.length === 0 ? (
                <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
              ) : (
                myPosts.map((post) => {
                  // On cherche la première image/vidéo du post
                  const firstMediaUrl = getFirstMediaUrl(post.media_urls);
                  const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                  return (
                    <View key={post.id} style={styles.postItem}>
                      
                      // MINIATURE DYNAMIQUE 
                      {firstMediaUrl ? (
                        <Image source={{ uri: firstMediaUrl }} style={styles.postThumbnail} />
                      ) : hasAudio ? (
                        <View style={styles.iconThumbnail}>
                          <Ionicons name="mic" size={24} color={colors.textSecondary} />
                        </View>
                      ) : (
                        <View style={styles.iconThumbnail}>
                          <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
                        </View>
                      )}

                      <View style={styles.postContent}>
                        <Text style={styles.postCaption} numberOfLines={2}>
                          {post.caption || (hasAudio ? "Note vocale" : "Publication sans texte")}
                        </Text>
                        <Text style={styles.postDate}>
                          {new Date(post.created_at).toLocaleDateString()}
                        </Text>
                      </View>

                      <TouchableOpacity 
                        onPress={() => handleDeletePost(post.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Ionicons name="trash-outline" size={22} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>

          </View>
        )}

        // VUE PARAMÈTRES (inchangée)
        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Modifier mon profil</Text>
              
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handlePickImage} disabled={updating}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer le nom</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations de compte</Text>
              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
*/

















/*
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  success: '#388E3C',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRE : EXTRAIRE LA PREMIÈRE IMAGE ---
const getFirstMediaUrl = (mediaData: any): string | null => {
  if (!mediaData) return null;
  try {
    let parsed = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
    if (!Array.isArray(parsed)) parsed = [parsed];
    const urls = parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http'));
    return urls.length > 0 ? urls[0] : null;
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    const matches = (typeof mediaData === 'string' ? mediaData : JSON.stringify(mediaData)).match(regex);
    return matches && matches.length > 0 ? matches[0] : null;
  }
};

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  // États existants
  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user'); // "user" par défaut
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour le profil
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // États pour les publications de l'utilisateur
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Récupération des données utilisateur et de ses publications
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          setUser(session.user);
          
          // Récupération du profil ET du rôle
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setFullName(profileData.full_name || '');
            setAvatarUrl(profileData.avatar_url || '');
            setUserRole(profileData.role || 'user'); // Assigne le rôle ou "user" par défaut
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPosts(data || []);
    } catch (err: any) {
      console.error('Erreur récupération posts :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      "Supprimer la publication",
      "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;
              
              setMyPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (updateError) throw updateError;
      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const imageUri = result.assets[0].uri;

        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const arrayBuffer = decode(base64);
        const filePath = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true, 
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (err: any) {
        console.error('Erreur Upload:', err);
        Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16, marginTop: 8 },
    backButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    menuButton: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    menuLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuButtonText: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12 },
    card: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
    signOutButton: { width: '100%', backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
    signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
    
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    input: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
    saveButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    postItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    postThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border },
    iconThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    postContent: { flex: 1, marginRight: 12 },
    postCaption: { fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 4 },
    postDate: { fontSize: 12, color: colors.textSecondary },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        // ========================================== 
        // VUE PRINCIPALE 
        // ========================================== 
        {activeView === 'main' && (
          <View>
            // EN-TÊTE DU PROFIL (VISIBLE POUR TOUS) 
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24}}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                   <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View>
                <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]}>
                  {fullName || 'Mon Profil'}
                </Text>
                <Text style={{color: colors.textSecondary}}>{user?.email}</Text>
              </View>
            </View>

            // VUES CONDITIONNELLES SELON LE RÔLE 
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            // BOUTON PARAMÈTRES (VISIBLE POUR TOUS) 
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres du profil</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            // CARTE : MES PUBLICATIONS (VISIBLE SEULEMENT POUR ADMIN ET ANNONCEUR) 
            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Mes Publications</Text>
                
                {loadingPosts ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const firstMediaUrl = getFirstMediaUrl(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    return (
                      <View key={post.id} style={styles.postItem}>
                        
                        {firstMediaUrl ? (
                          <Image source={{ uri: firstMediaUrl }} style={styles.postThumbnail} />
                        ) : hasAudio ? (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="mic" size={24} color={colors.textSecondary} />
                          </View>
                        ) : (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
                          </View>
                        )}

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || (hasAudio ? "Note vocale" : "Publication sans texte")}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        <TouchableOpacity 
                          onPress={() => handleDeletePost(post.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={22} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}

          </View>
        )}

        // ========================================== 
        // VUE PARAMÈTRES 
        // ========================================== 
        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Modifier mon profil</Text>
              
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handlePickImage} disabled={updating}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer le nom</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations de compte</Text>
              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
*/
























/*
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  BackHandler, // *** AJOUT POUR LE BOUTON RETOUR ***
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  success: '#388E3C',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRE : EXTRAIRE LA PREMIÈRE IMAGE ---
const getFirstMediaUrl = (mediaData: any): string | null => {
  if (!mediaData) return null;
  try {
    let parsed = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
    if (!Array.isArray(parsed)) parsed = [parsed];
    const urls = parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http'));
    return urls.length > 0 ? urls[0] : null;
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    const matches = (typeof mediaData === 'string' ? mediaData : JSON.stringify(mediaData)).match(regex);
    return matches && matches.length > 0 ? matches[0] : null;
  }
};

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  // États existants
  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user'); // "user" par défaut
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour le profil
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // États pour les publications de l'utilisateur
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // *** GESTION DU BOUTON RETOUR PHYSIQUE ANDROID ***
  useEffect(() => {
    const backAction = () => {
      if (activeView === 'settings') {
        setActiveView('main');
        return true; // Empêche l'application de se fermer et retourne à la vue principale
      }
      return false; // Laisse le comportement par défaut (quitter l'écran/app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeView]);

  // Récupération des données utilisateur et de ses publications
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          setUser(session.user);
          
          // Récupération du profil ET du rôle
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setFullName(profileData.full_name || '');
            setAvatarUrl(profileData.avatar_url || '');
            setUserRole(profileData.role || 'user'); // Assigne le rôle ou "user" par défaut
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPosts(data || []);
    } catch (err: any) {
      console.error('Erreur récupération posts :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      "Supprimer la publication",
      "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;
              
              setMyPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (updateError) throw updateError;
      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const imageUri = result.assets[0].uri;

        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const arrayBuffer = decode(base64);
        const filePath = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true, 
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (err: any) {
        console.error('Erreur Upload:', err);
        Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16, marginTop: 8 },
    backButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    menuButton: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    menuLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuButtonText: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12 },
    card: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
    signOutButton: { width: '100%', backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
    signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
    
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    input: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
    saveButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    postItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    postThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border },
    iconThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    postContent: { flex: 1, marginRight: 12 },
    postCaption: { fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 4 },
    postDate: { fontSize: 12, color: colors.textSecondary },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {activeView === 'main' && (
          <View>
          
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24}}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                   <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View>
                <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]}>
                  {fullName || 'Mon Profil'}
                </Text>
                <Text style={{color: colors.textSecondary}}>{user?.email}</Text>
              </View>
            </View>

            
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

          
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres du profil</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Mes Publications</Text>
                
                {loadingPosts ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const firstMediaUrl = getFirstMediaUrl(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    return (
                      <View key={post.id} style={styles.postItem}>
                        
                        {firstMediaUrl ? (
                          <Image source={{ uri: firstMediaUrl }} style={styles.postThumbnail} />
                        ) : hasAudio ? (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="mic" size={24} color={colors.textSecondary} />
                          </View>
                        ) : (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
                          </View>
                        )}

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || (hasAudio ? "Note vocale" : "Publication sans texte")}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        <TouchableOpacity 
                          onPress={() => handleDeletePost(post.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={22} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}

          </View>
        )}

     
        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Modifier mon profil</Text>
              
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handlePickImage} disabled={updating}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer le nom</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations de compte</Text>
              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
*/







/*
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  BackHandler, // *** AJOUT POUR LE BOUTON RETOUR ***
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  success: '#388E3C',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRE : EXTRAIRE LA PREMIÈRE IMAGE ---
const getFirstMediaUrl = (mediaData: any): string | null => {
  if (!mediaData) return null;
  try {
    let parsed = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
    if (!Array.isArray(parsed)) parsed = [parsed];
    const urls = parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http'));
    return urls.length > 0 ? urls[0] : null;
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    const matches = (typeof mediaData === 'string' ? mediaData : JSON.stringify(mediaData)).match(regex);
    return matches && matches.length > 0 ? matches[0] : null;
  }
};

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  // États existants
  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user'); // "user" par défaut
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour le profil
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // États pour les publications de l'utilisateur
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // *** GESTION DU BOUTON RETOUR PHYSIQUE ANDROID ***
  useEffect(() => {
    const backAction = () => {
      if (activeView === 'settings') {
        setActiveView('main');
        return true; // Empêche l'application de se fermer et retourne à la vue principale
      }
      return false; // Laisse le comportement par défaut (quitter l'écran/app)
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeView]);

  // Récupération des données utilisateur et de ses publications
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          setUser(session.user);
          
          // Récupération du profil ET du rôle
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setFullName(profileData.full_name || '');
            setAvatarUrl(profileData.avatar_url || '');
            setUserRole(profileData.role || 'user'); // Assigne le rôle ou "user" par défaut
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPosts(data || []);
    } catch (err: any) {
      console.error('Erreur récupération posts :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      "Supprimer la publication",
      "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;
              
              setMyPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (updateError) throw updateError;
      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.3,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const imageUri = result.assets[0].uri;

        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const arrayBuffer = decode(base64);
        const filePath = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true, 
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (err: any) {
        console.error('Erreur Upload:', err);
        Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16, marginTop: 8 },
    backButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    menuButton: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    menuLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuButtonText: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12 },
    card: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
    signOutButton: { width: '100%', backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
    signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
    
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    input: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
    saveButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    postItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    postThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border },
    iconThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    postContent: { flex: 1, marginRight: 12 },
    postCaption: { fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 4 },
    postDate: { fontSize: 12, color: colors.textSecondary },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {activeView === 'main' && (
          <View>
          
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24}}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                   <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View>
                <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]}>
                  {fullName || 'Mon Profil'}
                </Text>
                <Text style={{color: colors.textSecondary}}>{user?.email}</Text>
              </View>
            </View>

            
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

          
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres du profil</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Mes Publications</Text>
                
                {loadingPosts ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const firstMediaUrl = getFirstMediaUrl(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    return (
                      <View key={post.id} style={styles.postItem}>
                        
                        {firstMediaUrl ? (
                          <Image source={{ uri: firstMediaUrl }} style={styles.postThumbnail} />
                        ) : hasAudio ? (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="mic" size={24} color={colors.textSecondary} />
                          </View>
                        ) : (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
                          </View>
                        )}

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || (hasAudio ? "Note vocale" : "Publication sans texte")}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        <TouchableOpacity 
                          onPress={() => handleDeletePost(post.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={22} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}

          </View>
        )}

      
        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Modifier mon profil</Text>
              
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handlePickImage} disabled={updating}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer le nom</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations de compte</Text>
              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
*/


















/*
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
  TextInput,
  Image,
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageCompressor } from 'react-native-compressor';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  success: '#388E3C',
});

type ViewMode = 'main' | 'settings';

const getFirstMediaUrl = (mediaData: any): string | null => {
  if (!mediaData) return null;
  try {
    let parsed = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
    if (!Array.isArray(parsed)) parsed = [parsed];
    const urls = parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http'));
    return urls.length > 0 ? urls[0] : null;
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    const matches = (typeof mediaData === 'string' ? mediaData : JSON.stringify(mediaData)).match(regex);
    return matches && matches.length > 0 ? matches[0] : null;
  }
};

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    const backAction = () => {
      if (activeView === 'settings') {
        setActiveView('main');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [activeView]);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          setUser(session.user);
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setFullName(profileData.full_name || '');
            setAvatarUrl(profileData.avatar_url || '');
            setUserRole(profileData.role || 'user');
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPosts(data || []);
    } catch (err: any) {
      console.error('Erreur récupération posts :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      "Supprimer la publication",
      "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;
              
              setMyPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (updateError) throw updateError;
      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const originalUri = result.assets[0].uri;

        // Compression de la photo de profil via react-native-compressor
        const compressedUri = await ImageCompressor.compress(originalUri, {
          compressionMethod: 'auto',
          quality: 0.7,
        });

        const base64 = await FileSystem.readAsStringAsync(compressedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const arrayBuffer = decode(base64);
        const filePath = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true, 
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (err: any) {
        console.error('Erreur Upload:', err);
        Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16, marginTop: 8 },
    backButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    menuButton: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    menuLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuButtonText: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12 },
    card: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
    signOutButton: { width: '100%', backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
    signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
    
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    input: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
    saveButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    postItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    postThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border },
    iconThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    postContent: { flex: 1, marginRight: 12 },
    postCaption: { fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 4 },
    postDate: { fontSize: 12, color: colors.textSecondary },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {activeView === 'main' && (
          <View>
          
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24}}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                   <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View>
                <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]}>
                  {fullName || 'Mon Profil'}
                </Text>
                <Text style={{color: colors.textSecondary}}>{user?.email}</Text>
              </View>
            </View>

            {userRole === 'admin' && (
              <AdminView onPostCreated={() => user && fetchMyPosts(user.id)} />
            )}
            {userRole === 'advertiser' && (
              <AdvertiserView onPostCreated={() => user && fetchMyPosts(user.id)} />
            )}

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres du profil</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Mes Publications</Text>
                
                {loadingPosts ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const firstMediaUrl = getFirstMediaUrl(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    return (
                      <View key={post.id} style={styles.postItem}>
                        
                        {firstMediaUrl ? (
                          <Image source={{ uri: firstMediaUrl }} style={styles.postThumbnail} />
                        ) : hasAudio ? (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="mic" size={24} color={colors.textSecondary} />
                          </View>
                        ) : (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
                          </View>
                        )}

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || (hasAudio ? "Note vocale" : "Publication sans texte")}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        <TouchableOpacity 
                          onPress={() => handleDeletePost(post.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={22} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}

          </View>
        )}

        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Modifier mon profil</Text>
              
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handlePickImage} disabled={updating}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer le nom</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations de compte</Text>
              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
*/




















import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StatusBar,
  ScrollView,
  TextInput,
  Image, // Image de React Native
  BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// *** AJOUT : Import du compresseur en le renommant pour éviter le conflit avec <Image> ***
import { Image as ImageCompressor } from 'react-native-compressor'; 

import AdminView from '../../components/AdminView';
import AdvertiserView from '../../components/AdvertiserView';

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  success: '#388E3C',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRE : EXTRAIRE LA PREMIÈRE IMAGE ---
const getFirstMediaUrl = (mediaData: any): string | null => {
  if (!mediaData) return null;
  try {
    let parsed = typeof mediaData === 'string' ? JSON.parse(mediaData) : mediaData;
    if (!Array.isArray(parsed)) parsed = [parsed];
    const urls = parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http'));
    return urls.length > 0 ? urls[0] : null;
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    const matches = (typeof mediaData === 'string' ? mediaData : JSON.stringify(mediaData)).match(regex);
    return matches && matches.length > 0 ? matches[0] : null;
  }
};

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  // États existants
  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user'); // "user" par défaut
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // États pour le profil
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  // États pour les publications de l'utilisateur
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // GESTION DU BOUTON RETOUR PHYSIQUE ANDROID
  useEffect(() => {
    const backAction = () => {
      if (activeView === 'settings') {
        setActiveView('main');
        return true; 
      }
      return false; 
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeView]);

  // Récupération des données utilisateur et de ses publications
  useEffect(() => {
    const getUserData = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        
        if (session?.user) {
          setUser(session.user);
          
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, role')
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setFullName(profileData.full_name || '');
            setAvatarUrl(profileData.avatar_url || '');
            setUserRole(profileData.role || 'user');
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil :', err.message);
        setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyPosts(data || []);
    } catch (err: any) {
      console.error('Erreur récupération posts :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      "Supprimer la publication",
      "Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;
              
              setMyPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  const handleUpdateName = async () => {
    if (!user) return;
    try {
      setUpdating(true);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (updateError) throw updateError;
      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handlePickImage = async () => {
    if (!user) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // Laisser le compresseur gérer la qualité finale
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const originalUri = result.assets[0].uri;

        // *** AJOUT : Compression de l'image ***
        const compressedUri = await ImageCompressor.compress(originalUri, {
          compressionMethod: 'auto',
          quality: 0.7, // Ajustez la qualité de compression selon vos besoins
        });

        // Lecture du fichier compressé (au lieu de l'original)
        const base64 = await FileSystem.readAsStringAsync(compressedUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const arrayBuffer = decode(base64);
        const filePath = `${user.id}/${Date.now()}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true, 
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (err: any) {
        console.error('Erreur Upload:', err);
        Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
      } finally {
        setUpdating(false);
      }
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              setSignOutLoading(true);
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
              setSignOutLoading(false);
            }
          },
        },
      ]
    );
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 16, marginTop: 8 },
    backButtonText: { fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 4 },
    title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
    menuButton: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 16, flexDirection: 'row', alignItems: 'center', elevation: 1 },
    menuLeftContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    menuButtonText: { fontSize: 16, fontWeight: '600', color: colors.text, marginLeft: 12 },
    card: { width: '100%', backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
    signOutButton: { width: '100%', backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center' },
    signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
    
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border, marginBottom: 12, justifyContent: 'center', alignItems: 'center' },
    changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
    input: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 12 },
    saveButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
    saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

    postItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    postThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border },
    iconThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    postContent: { flex: 1, marginRight: 12 },
    postCaption: { fontSize: 14, color: colors.text, fontWeight: '500', marginBottom: 4 },
    postDate: { fontSize: 12, color: colors.textSecondary },
    emptyText: { color: colors.textSecondary, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {activeView === 'main' && (
          <View>
          
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 24}}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                   <Ionicons name="person" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View>
                <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]}>
                  {fullName || 'Mon Profil'}
                </Text>
                <Text style={{color: colors.textSecondary}}>{user?.email}</Text>
              </View>
            </View>

            
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

          
            <TouchableOpacity 
              style={styles.menuButton} 
              onPress={() => setActiveView('settings')}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeftContent}>
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
                <Text style={styles.menuButtonText}>Paramètres du profil</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Mes Publications</Text>
                
                {loadingPosts ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const firstMediaUrl = getFirstMediaUrl(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    return (
                      <View key={post.id} style={styles.postItem}>
                        
                        {firstMediaUrl ? (
                          <Image source={{ uri: firstMediaUrl }} style={styles.postThumbnail} />
                        ) : hasAudio ? (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="mic" size={24} color={colors.textSecondary} />
                          </View>
                        ) : (
                          <View style={styles.iconThumbnail}>
                            <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
                          </View>
                        )}

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || (hasAudio ? "Note vocale" : "Publication sans texte")}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        <TouchableOpacity 
                          onPress={() => handleDeletePost(post.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="trash-outline" size={22} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}

          </View>
        )}

      
        {activeView === 'settings' && (
          <View>
            <TouchableOpacity style={styles.backButton} onPress={() => setActiveView('main')}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>Retour au profil</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Paramètres</Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Modifier mon profil</Text>
              
              <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handlePickImage} disabled={updating}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>Changer la photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdateName} disabled={updating}>
                {updating ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Enregistrer le nom</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informations de compte</Text>
              <Text style={styles.label}>Adresse Email</Text>
              <Text style={styles.value}>{user?.email || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Session</Text>
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
                disabled={signOutLoading}
                activeOpacity={0.8}
              >
                {signOutLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.signOutButtonText}>Se déconnecter</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}










