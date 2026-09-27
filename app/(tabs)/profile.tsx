










/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import {
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system/legacy'; 
import { decode } from 'base64-arraybuffer';
import { Image as ImageCompressor } from 'react-native-compressor'; 

// Import d'AsyncStorage pour le cache
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRES DÉTECTION DES MÉDIAS ---
const isImageUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif');
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm');
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };

  let urls: string[] = [];
  if (Array.isArray(mediaData)) {
    urls = mediaData;
  } else if (typeof mediaData === 'string') {
    try {
      const parsed = JSON.parse(mediaData);
      urls = Array.isArray(parsed) ? parsed : [mediaData];
    } catch {
      urls = [mediaData];
    }
  }

  const imageUrl = urls.find(url => typeof url === 'string' && isImageUrl(url)) || null;
  const videoUrl = urls.find(url => typeof url === 'string' && isVideoUrl(url)) || null;

  return { imageUrl, videoUrl };
};

// --- NOUVEAU : SKELETON LOADER POUR LE PROFIL ---
const ProfileSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
     
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Animated.View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.skeletonBase, marginRight: 16, opacity: fadeAnim }} />
          <View style={{ flex: 1 }}>
            <Animated.View style={{ height: 24, width: '70%', backgroundColor: colors.skeletonBase, borderRadius: 4, marginBottom: 8, opacity: fadeAnim }} />
            <Animated.View style={{ height: 14, width: '90%', backgroundColor: colors.skeletonBase, borderRadius: 4, opacity: fadeAnim }} />
          </View>
        </View>
        <Animated.View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.skeletonBase, opacity: fadeAnim }} />
      </View>

    
      <Animated.View style={{ width: '100%', backgroundColor: colors.skeletonBase, borderRadius: 16, padding: 20, marginBottom: 20, opacity: fadeAnim }}>
        <View style={{ height: 18, width: '40%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 24 }} />
        
      
        {[1, 2, 3].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: colors.background, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ height: 14, width: '80%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ height: 12, width: '40%', backgroundColor: colors.background, borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// --- COMPOSANT MINIATURE INTELLIGENT ---
const MediaThumbnail = ({ imageUrl, videoUrl, hasAudio, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      if (videoUrl && !imageUrl) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
          if (isMounted) setVideoThumb(uri);
        } catch (e) {
          console.log("Erreur de génération de miniature vidéo", e);
        }
      }
    };
    fetchThumbnail();
    return () => { isMounted = false; };
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image source={{ uri: videoThumb }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
        ) : (
          <View style={[styles.iconThumbnail, { marginRight: 0, width: '100%', height: '100%' }]}>
             <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}>
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.iconThumbnail}>
        <Ionicons name="mic" size={24} color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
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
  const [cachedEmail, setCachedEmail] = useState(''); 
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

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [activeView]);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsedData = JSON.parse(cachedProfile);
          setFullName(parsedData.full_name || '');
          setAvatarUrl(parsedData.avatar_url || '');
          setUserRole(parsedData.role || 'user');
          setCachedEmail(parsedData.email || ''); 
        }

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

            await AsyncStorage.setItem('@profile_data', JSON.stringify({
              ...profileData,
              email: session.user.email 
            }));
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil ou Mode hors ligne :', err.message);
        if (!fullName) setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const cacheKey = `@my_posts_${userId}`;
      const cachedPosts = await AsyncStorage.getItem(cacheKey);
      if (cachedPosts) {
        setMyPosts(JSON.parse(cachedPosts));
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setMyPosts(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Erreur récupération posts ou Mode hors ligne :', err.message);
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

              const updatedPosts = myPosts.filter(post => post.id !== postId);
              setMyPosts(updatedPosts);
              
              if (user) {
                await AsyncStorage.setItem(`@my_posts_${user.id}`, JSON.stringify(updatedPosts));
              }

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
      
      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.full_name = fullName;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

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
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const originalUri = result.assets[0].uri;

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
        
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          parsed.avatar_url = publicUrl;
          await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
        }

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
              
              await AsyncStorage.removeItem('@is_logged_in');
              await AsyncStorage.removeItem('@profile_data');
              if (user) await AsyncStorage.removeItem(`@my_posts_${user.id}`);

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

  if (loading && !fullName) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProfileSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      
        {activeView === 'main' && (
          <View>

           
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              
            
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                     <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]} numberOfLines={1}>
                    {fullName || 'Mon Profil'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || cachedEmail}
                  </Text>
                </View>
              </View>

            
              <TouchableOpacity 
                onPress={() => setActiveView('settings')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  backgroundColor: colors.cardBackground,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>

            </View>

         
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Mes Publications</Text>

                {loadingPosts && myPosts.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    const defaultCaption = imageUrl 
                      ? "Publication avec image" 
                      : videoUrl 
                      ? "Vidéo" 
                      : hasAudio 
                      ? "Note vocale" 
                      : "Publication";

                    return (
                      <View key={post.id} style={styles.postItem}>
                        <MediaThumbnail 
                          imageUrl={imageUrl} 
                          videoUrl={videoUrl} 
                          hasAudio={hasAudio} 
                          colors={colors} 
                          styles={styles} 
                        />

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || defaultCaption}
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
              <Text style={styles.value}>{user?.email || cachedEmail || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
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
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
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
  Animated,
  RefreshControl, // Ajouté pour le Pull-to-refresh
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system/legacy'; 
import { decode } from 'base64-arraybuffer';
import { Image as ImageCompressor } from 'react-native-compressor'; 

// Import d'AsyncStorage pour le cache
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRES DÉTECTION DES MÉDIAS ---
const isImageUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif');
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm');
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };

  let urls: string[] = [];
  if (Array.isArray(mediaData)) {
    urls = mediaData;
  } else if (typeof mediaData === 'string') {
    try {
      const parsed = JSON.parse(mediaData);
      urls = Array.isArray(parsed) ? parsed : [mediaData];
    } catch {
      urls = [mediaData];
    }
  }

  const imageUrl = urls.find(url => typeof url === 'string' && isImageUrl(url)) || null;
  const videoUrl = urls.find(url => typeof url === 'string' && isVideoUrl(url)) || null;

  return { imageUrl, videoUrl };
};

// --- NOUVEAU : SKELETON LOADER POUR LE PROFIL ---
const ProfileSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Animated.View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.skeletonBase, marginRight: 16, opacity: fadeAnim }} />
          <View style={{ flex: 1 }}>
            <Animated.View style={{ height: 24, width: '70%', backgroundColor: colors.skeletonBase, borderRadius: 4, marginBottom: 8, opacity: fadeAnim }} />
            <Animated.View style={{ height: 14, width: '90%', backgroundColor: colors.skeletonBase, borderRadius: 4, opacity: fadeAnim }} />
          </View>
        </View>
        <Animated.View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.skeletonBase, opacity: fadeAnim }} />
      </View>

      <Animated.View style={{ width: '100%', backgroundColor: colors.skeletonBase, borderRadius: 16, padding: 20, marginBottom: 20, opacity: fadeAnim }}>
        <View style={{ height: 18, width: '40%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 24 }} />
        
        {[1, 2, 3].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: colors.background, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ height: 14, width: '80%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ height: 12, width: '40%', backgroundColor: colors.background, borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// --- COMPOSANT MINIATURE INTELLIGENT ---
const MediaThumbnail = ({ imageUrl, videoUrl, hasAudio, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      if (videoUrl && !imageUrl) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
          if (isMounted) setVideoThumb(uri);
        } catch (e) {
          console.log("Erreur de génération de miniature vidéo", e);
        }
      }
    };
    fetchThumbnail();
    return () => { isMounted = false; };
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image source={{ uri: videoThumb }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
        ) : (
          <View style={[styles.iconThumbnail, { marginRight: 0, width: '100%', height: '100%' }]}>
             <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}>
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.iconThumbnail}>
        <Ionicons name="mic" size={24} color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
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
  const [cachedEmail, setCachedEmail] = useState(''); 
  const [updating, setUpdating] = useState(false);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false); // État pour le pull-to-refresh

  // Calcul du nombre de publications du mois en cours
  const currentMonthPostsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return myPosts.filter((post) => {
      const postDate = new Date(post.created_at);
      return (
        postDate.getMonth() === currentMonth &&
        postDate.getFullYear() === currentYear
      );
    }).length;
  }, [myPosts]);

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

  useEffect(() => {
    const getUserData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsedData = JSON.parse(cachedProfile);
          setFullName(parsedData.full_name || '');
          setAvatarUrl(parsedData.avatar_url || '');
          setUserRole(parsedData.role || 'user');
          setCachedEmail(parsedData.email || ''); 
        }

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

            await AsyncStorage.setItem('@profile_data', JSON.stringify({
              ...profileData,
              email: session.user.email 
            }));
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil ou Mode hors ligne :', err.message);
        if (!fullName) setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const cacheKey = `@my_posts_${userId}`;
      const cachedPosts = await AsyncStorage.getItem(cacheKey);
      if (cachedPosts) {
        setMyPosts(JSON.parse(cachedPosts));
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setMyPosts(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Erreur récupération posts ou Mode hors ligne :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fonction appelée lors du pull-to-refresh ou via le bouton rafraichir
  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchMyPosts(user.id);
    setRefreshing(false);
  }, [user]);

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

              const updatedPosts = myPosts.filter(post => post.id !== postId);
              setMyPosts(updatedPosts);
              
              if (user) {
                await AsyncStorage.setItem(`@my_posts_${user.id}`, JSON.stringify(updatedPosts));
              }

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
      
      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.full_name = fullName;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

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
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const originalUri = result.assets[0].uri;

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
        
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          parsed.avatar_url = publicUrl;
          await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
        }

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
              
              await AsyncStorage.removeItem('@is_logged_in');
              await AsyncStorage.removeItem('@profile_data');
              if (user) await AsyncStorage.removeItem(`@my_posts_${user.id}`);

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

  if (loading && !fullName) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProfileSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

        {activeView === 'main' && (
          <View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              
         
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                     <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]} numberOfLines={1}>
                    {fullName || 'Mon Profil'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || cachedEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setActiveView('settings')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  backgroundColor: colors.cardBackground,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>

            </View>

            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            
            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Mes Publications</Text>
                  <TouchableOpacity 
                    onPress={handleRefresh} 
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={refreshing || loadingPosts}
                  >
                    <Ionicons name="refresh" size={22} color={refreshing || loadingPosts ? colors.textSecondary : colors.primary} />
                  </TouchableOpacity>
                </View>

                
                <View style={{ 
                  backgroundColor: colors.background, 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                    Annonces publiées ce mois-ci
                  </Text>
                  <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {currentMonthPostsCount}
                    </Text>
                  </View>
                </View>

                {loadingPosts && myPosts.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    const defaultCaption = imageUrl 
                      ? "Publication avec image" 
                      : videoUrl 
                      ? "Vidéo" 
                      : hasAudio 
                      ? "Note vocale" 
                      : "Publication";

                    return (
                      <View key={post.id} style={styles.postItem}>
                        <MediaThumbnail 
                          imageUrl={imageUrl} 
                          videoUrl={videoUrl} 
                          hasAudio={hasAudio} 
                          colors={colors} 
                          styles={styles} 
                        />

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || defaultCaption}
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
              <Text style={styles.value}>{user?.email || cachedEmail || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
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
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
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
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system/legacy'; 
import * as Sharing from 'expo-sharing'; // <-- NOUVEL IMPORT POUR LE TÉLÉCHARGEMENT
import { decode } from 'base64-arraybuffer';
import { Image as ImageCompressor } from 'react-native-compressor'; 

// Import d'AsyncStorage pour le cache
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRES DÉTECTION DES MÉDIAS ---
const isImageUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif');
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm');
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };

  let urls: string[] = [];
  if (Array.isArray(mediaData)) {
    urls = mediaData;
  } else if (typeof mediaData === 'string') {
    try {
      const parsed = JSON.parse(mediaData);
      urls = Array.isArray(parsed) ? parsed : [mediaData];
    } catch {
      urls = [mediaData];
    }
  }

  const imageUrl = urls.find(url => typeof url === 'string' && isImageUrl(url)) || null;
  const videoUrl = urls.find(url => typeof url === 'string' && isVideoUrl(url)) || null;

  return { imageUrl, videoUrl };
};

// --- SKELETON LOADER POUR LE PROFIL ---
const ProfileSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Animated.View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.skeletonBase, marginRight: 16, opacity: fadeAnim }} />
          <View style={{ flex: 1 }}>
            <Animated.View style={{ height: 24, width: '70%', backgroundColor: colors.skeletonBase, borderRadius: 4, marginBottom: 8, opacity: fadeAnim }} />
            <Animated.View style={{ height: 14, width: '90%', backgroundColor: colors.skeletonBase, borderRadius: 4, opacity: fadeAnim }} />
          </View>
        </View>
        <Animated.View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.skeletonBase, opacity: fadeAnim }} />
      </View>

      <Animated.View style={{ width: '100%', backgroundColor: colors.skeletonBase, borderRadius: 16, padding: 20, marginBottom: 20, opacity: fadeAnim }}>
        <View style={{ height: 18, width: '40%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 24 }} />
        
        {[1, 2, 3].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: colors.background, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ height: 14, width: '80%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ height: 12, width: '40%', backgroundColor: colors.background, borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// --- COMPOSANT MINIATURE INTELLIGENT ---
const MediaThumbnail = ({ imageUrl, videoUrl, hasAudio, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      if (videoUrl && !imageUrl) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
          if (isMounted) setVideoThumb(uri);
        } catch (e) {
          console.log("Erreur de génération de miniature vidéo", e);
        }
      }
    };
    fetchThumbnail();
    return () => { isMounted = false; };
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image source={{ uri: videoThumb }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
        ) : (
          <View style={[styles.iconThumbnail, { marginRight: 0, width: '100%', height: '100%' }]}>
             <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}>
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.iconThumbnail}>
        <Ionicons name="mic" size={24} color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
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
  const [cachedEmail, setCachedEmail] = useState(''); 
  const [updating, setUpdating] = useState(false);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(null); // NOUVEAU STATE TÉLÉCHARGEMENT

  const currentMonthPostsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return myPosts.filter((post) => {
      const postDate = new Date(post.created_at);
      return (
        postDate.getMonth() === currentMonth &&
        postDate.getFullYear() === currentYear
      );
    }).length;
  }, [myPosts]);

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

  useEffect(() => {
    const getUserData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsedData = JSON.parse(cachedProfile);
          setFullName(parsedData.full_name || '');
          setAvatarUrl(parsedData.avatar_url || '');
          setUserRole(parsedData.role || 'user');
          setCachedEmail(parsedData.email || ''); 
        }

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

            await AsyncStorage.setItem('@profile_data', JSON.stringify({
              ...profileData,
              email: session.user.email 
            }));
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil ou Mode hors ligne :', err.message);
        if (!fullName) setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []); 

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const cacheKey = `@my_posts_${userId}`;
      const cachedPosts = await AsyncStorage.getItem(cacheKey);
      if (cachedPosts) {
        setMyPosts(JSON.parse(cachedPosts));
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setMyPosts(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Erreur récupération posts ou Mode hors ligne :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchMyPosts(user.id);
    setRefreshing(false);
  }, [user]);

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

              const updatedPosts = myPosts.filter(post => post.id !== postId);
              setMyPosts(updatedPosts);
              
              if (user) {
                await AsyncStorage.setItem(`@my_posts_${user.id}`, JSON.stringify(updatedPosts));
              }

              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  // NOUVELLE FONCTION: TÉLÉCHARGEMENT DE MÉDIA
  const handleDownloadPost = async (post: any) => {
    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;
    
    const mediaUrlToDownload = imageUrl || videoUrl || (hasAudio ? post.audio_url : null);

    if (!mediaUrlToDownload) {
      Alert.alert("Info", "Aucun média téléchargeable pour cette publication.");
      return;
    }

    try {
      setDownloadingPostId(post.id);
      
      // Extraction de l'extension depuis l'URL
      const urlWithoutQuery = mediaUrlToDownload.split('?')[0];
      const extension = urlWithoutQuery.split('.').pop() || 'tmp';
      
      // Création du chemin de fichier local
      const fileUri = `${FileSystem.documentDirectory}media_${post.id}.${extension}`;
      
      const { uri } = await FileSystem.downloadAsync(mediaUrlToDownload, fileUri);
      
      // Ouvre le menu de partage/enregistrement natif
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          dialogTitle: 'Enregistrer ou partager le média',
        });
      } else {
        Alert.alert('Succès', 'Fichier téléchargé dans le cache local.');
      }
    } catch (error) {
      console.error("Erreur de téléchargement:", error);
      Alert.alert("Erreur", "Le téléchargement a échoué.");
    } finally {
      setDownloadingPostId(null);
    }
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
      
      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.full_name = fullName;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

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
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const originalUri = result.assets[0].uri;

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
        
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          parsed.avatar_url = publicUrl;
          await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
        }

        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (err: any) {
        console.error('Erreur Upload:', err);
        Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
      } finally {
        setUpdating(false);
      }
    }
  };

  // CORRECTION: AJOUT DU BLOC FINALLY POUR ÉVITER LE CHARGEMENT INFINI
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
              
              await AsyncStorage.removeItem('@is_logged_in');
              await AsyncStorage.removeItem('@profile_data');
              if (user) await AsyncStorage.removeItem(`@my_posts_${user.id}`);

              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
            } finally {
              // Réinitialise toujours le loader, qu'il y ait erreur ou succès
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

  if (loading && !fullName) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProfileSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

       
        {activeView === 'main' && (
          <View>

            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              
              
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                     <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]} numberOfLines={1}>
                    {fullName || 'Mon Profil'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || cachedEmail}
                  </Text>
                </View>
              </View>

              
              <TouchableOpacity 
                onPress={() => setActiveView('settings')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  backgroundColor: colors.cardBackground,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>

            </View>

            
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            
            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Mes Publications</Text>
                  <TouchableOpacity 
                    onPress={handleRefresh} 
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={refreshing || loadingPosts}
                  >
                    <Ionicons name="refresh" size={22} color={refreshing || loadingPosts ? colors.textSecondary : colors.primary} />
                  </TouchableOpacity>
                </View>

            
                <View style={{ 
                  backgroundColor: colors.background, 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                    Annonces publiées ce mois-ci
                  </Text>
                  <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {currentMonthPostsCount}
                    </Text>
                  </View>
                </View>

                {loadingPosts && myPosts.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    const defaultCaption = imageUrl 
                      ? "Publication avec image" 
                      : videoUrl 
                      ? "Vidéo" 
                      : hasAudio 
                      ? "Note vocale" 
                      : "Publication";

                    return (
                      <View key={post.id} style={styles.postItem}>
                        <MediaThumbnail 
                          imageUrl={imageUrl} 
                          videoUrl={videoUrl} 
                          hasAudio={hasAudio} 
                          colors={colors} 
                          styles={styles} 
                        />

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || defaultCaption}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </View>

                        
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity 
                            onPress={() => handleDownloadPost(post)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginRight: 16 }}
                            disabled={downloadingPostId === post.id}
                          >
                            {downloadingPostId === post.id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="download-outline" size={22} color={colors.primary} />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => handleDeletePost(post.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="trash-outline" size={22} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
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
              <Text style={styles.value}>{user?.email || cachedEmail || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
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
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
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
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system/legacy'; 
// Remplacement de expo-sharing par expo-media-library pour forcer le téléchargement en galerie
import * as MediaLibrary from 'expo-media-library'; 
import { decode } from 'base64-arraybuffer';
import { Image as ImageCompressor } from 'react-native-compressor'; 

// Import d'AsyncStorage pour le cache
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRES DÉTECTION DES MÉDIAS ---
const isImageUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif');
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm');
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };

  let urls: string[] = [];
  if (Array.isArray(mediaData)) {
    urls = mediaData;
  } else if (typeof mediaData === 'string') {
    try {
      const parsed = JSON.parse(mediaData);
      urls = Array.isArray(parsed) ? parsed : [mediaData];
    } catch {
      urls = [mediaData];
    }
  }

  const imageUrl = urls.find(url => typeof url === 'string' && isImageUrl(url)) || null;
  const videoUrl = urls.find(url => typeof url === 'string' && isVideoUrl(url)) || null;

  return { imageUrl, videoUrl };
};

// --- SKELETON LOADER POUR LE PROFIL ---
const ProfileSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Animated.View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.skeletonBase, marginRight: 16, opacity: fadeAnim }} />
          <View style={{ flex: 1 }}>
            <Animated.View style={{ height: 24, width: '70%', backgroundColor: colors.skeletonBase, borderRadius: 4, marginBottom: 8, opacity: fadeAnim }} />
            <Animated.View style={{ height: 14, width: '90%', backgroundColor: colors.skeletonBase, borderRadius: 4, opacity: fadeAnim }} />
          </View>
        </View>
        <Animated.View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.skeletonBase, opacity: fadeAnim }} />
      </View>

      <Animated.View style={{ width: '100%', backgroundColor: colors.skeletonBase, borderRadius: 16, padding: 20, marginBottom: 20, opacity: fadeAnim }}>
        <View style={{ height: 18, width: '40%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 24 }} />
        
        {[1, 2, 3].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: colors.background, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ height: 14, width: '80%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ height: 12, width: '40%', backgroundColor: colors.background, borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// --- COMPOSANT MINIATURE INTELLIGENT ---
const MediaThumbnail = ({ imageUrl, videoUrl, hasAudio, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      if (videoUrl && !imageUrl) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
          if (isMounted) setVideoThumb(uri);
        } catch (e) {
          console.log("Erreur de génération de miniature vidéo", e);
        }
      }
    };
    fetchThumbnail();
    return () => { isMounted = false; };
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image source={{ uri: videoThumb }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
        ) : (
          <View style={[styles.iconThumbnail, { marginRight: 0, width: '100%', height: '100%' }]}>
             <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}>
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.iconThumbnail}>
        <Ionicons name="mic" size={24} color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
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
  const [cachedEmail, setCachedEmail] = useState(''); 
  const [updating, setUpdating] = useState(false);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(null);

  const currentMonthPostsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return myPosts.filter((post) => {
      const postDate = new Date(post.created_at);
      return (
        postDate.getMonth() === currentMonth &&
        postDate.getFullYear() === currentYear
      );
    }).length;
  }, [myPosts]);

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

  useEffect(() => {
    const getUserData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsedData = JSON.parse(cachedProfile);
          setFullName(parsedData.full_name || '');
          setAvatarUrl(parsedData.avatar_url || '');
          setUserRole(parsedData.role || 'user');
          setCachedEmail(parsedData.email || ''); 
        }

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

            await AsyncStorage.setItem('@profile_data', JSON.stringify({
              ...profileData,
              email: session.user.email 
            }));
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil ou Mode hors ligne :', err.message);
        if (!fullName) setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []); 

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const cacheKey = `@my_posts_${userId}`;
      const cachedPosts = await AsyncStorage.getItem(cacheKey);
      if (cachedPosts) {
        setMyPosts(JSON.parse(cachedPosts));
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setMyPosts(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Erreur récupération posts ou Mode hors ligne :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchMyPosts(user.id);
    setRefreshing(false);
  }, [user]);

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

              const updatedPosts = myPosts.filter(post => post.id !== postId);
              setMyPosts(updatedPosts);
              
              if (user) {
                await AsyncStorage.setItem(`@my_posts_${user.id}`, JSON.stringify(updatedPosts));
              }

              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  // NOUVELLE FONCTION: TÉLÉCHARGEMENT DE MÉDIA DIRECTEMENT DANS LA GALERIE
  const handleDownloadPost = async (post: any) => {
    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;
    
    const mediaUrlToDownload = imageUrl || videoUrl || (hasAudio ? post.audio_url : null);

    if (!mediaUrlToDownload) {
      Alert.alert("Info", "Aucun média téléchargeable pour cette publication.");
      return;
    }

    try {
      // 1. Vérifier / Demander la permission d'accès à la galerie
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin de votre permission pour sauvegarder des fichiers dans votre galerie.'
        );
        return;
      }

      setDownloadingPostId(post.id);
      
      // 2. Extraction de l'extension depuis l'URL (ou valeur par défaut)
      const urlWithoutQuery = mediaUrlToDownload.split('?')[0];
      const extension = urlWithoutQuery.split('.').pop() || (videoUrl ? 'mp4' : (imageUrl ? 'jpg' : 'mp3'));
      
      // 3. Création du chemin de fichier local temporaire
      const fileUri = `${FileSystem.documentDirectory}media_${post.id}.${extension}`;
      
      // 4. Téléchargement depuis Supabase vers le dossier temporaire de l'app
      const { uri } = await FileSystem.downloadAsync(mediaUrlToDownload, fileUri);
      
      // 5. Sauvegarde du fichier temporaire dans la galerie de l'appareil (Migration vers la nouvelle API Class-based)
      await MediaLibrary.Asset.create(uri);

      // 6. Suppression du fichier temporaire pour ne pas encombrer l'espace
      await FileSystem.deleteAsync(uri, { idempotent: true });

      Alert.alert('Succès', 'Le média a été sauvegardé dans votre galerie !');

    } catch (error) {
      console.error("Erreur de téléchargement:", error);
      Alert.alert("Erreur", "Le téléchargement a échoué.");
    } finally {
      setDownloadingPostId(null);
    }
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
      
      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.full_name = fullName;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

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
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const originalUri = result.assets[0].uri;

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
        
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          parsed.avatar_url = publicUrl;
          await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
        }

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
              
              await AsyncStorage.removeItem('@is_logged_in');
              await AsyncStorage.removeItem('@profile_data');
              if (user) await AsyncStorage.removeItem(`@my_posts_${user.id}`);

              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
            } finally {
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

  if (loading && !fullName) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProfileSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

     
        {activeView === 'main' && (
          <View>

            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              
              
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                     <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]} numberOfLines={1}>
                    {fullName || 'Mon Profil'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || cachedEmail}
                  </Text>
                </View>
              </View>

            
              <TouchableOpacity 
                onPress={() => setActiveView('settings')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  backgroundColor: colors.cardBackground,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>

            </View>

            
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            
            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
              
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Mes Publications</Text>
                  <TouchableOpacity 
                    onPress={handleRefresh} 
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={refreshing || loadingPosts}
                  >
                    <Ionicons name="refresh" size={22} color={refreshing || loadingPosts ? colors.textSecondary : colors.primary} />
                  </TouchableOpacity>
                </View>
                <View style={{ 
                  backgroundColor: colors.background, 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                    Annonces publiées ce mois-ci
                  </Text>
                  <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {currentMonthPostsCount}
                    </Text>
                  </View>
                </View>

                {loadingPosts && myPosts.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    const defaultCaption = imageUrl 
                      ? "Publication avec image" 
                      : videoUrl 
                      ? "Vidéo" 
                      : hasAudio 
                      ? "Note vocale" 
                      : "Publication";

                    return (
                      <View key={post.id} style={styles.postItem}>
                        <MediaThumbnail 
                          imageUrl={imageUrl} 
                          videoUrl={videoUrl} 
                          hasAudio={hasAudio} 
                          colors={colors} 
                          styles={styles} 
                        />

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || defaultCaption}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity 
                            onPress={() => handleDownloadPost(post)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginRight: 16 }}
                            disabled={downloadingPostId === post.id}
                          >
                            {downloadingPostId === post.id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="download-outline" size={22} color={colors.primary} />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => handleDeletePost(post.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="trash-outline" size={22} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
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
              <Text style={styles.value}>{user?.email || cachedEmail || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
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
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
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
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// MISE À JOUR : On utilise directement expo-file-system sans /legacy
import * as FileSystem from 'expo-file-system'; 
import * as MediaLibrary from 'expo-media-library'; 
import { decode } from 'base64-arraybuffer';
import { Image as ImageCompressor } from 'react-native-compressor'; 

// Import d'AsyncStorage pour le cache
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRES DÉTECTION DES MÉDIAS ---
const isImageUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif');
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm');
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };

  let urls: string[] = [];
  if (Array.isArray(mediaData)) {
    urls = mediaData;
  } else if (typeof mediaData === 'string') {
    try {
      const parsed = JSON.parse(mediaData);
      urls = Array.isArray(parsed) ? parsed : [mediaData];
    } catch {
      urls = [mediaData];
    }
  }

  const imageUrl = urls.find(url => typeof url === 'string' && isImageUrl(url)) || null;
  const videoUrl = urls.find(url => typeof url === 'string' && isVideoUrl(url)) || null;

  return { imageUrl, videoUrl };
};

// --- SKELETON LOADER POUR LE PROFIL ---
const ProfileSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Animated.View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.skeletonBase, marginRight: 16, opacity: fadeAnim }} />
          <View style={{ flex: 1 }}>
            <Animated.View style={{ height: 24, width: '70%', backgroundColor: colors.skeletonBase, borderRadius: 4, marginBottom: 8, opacity: fadeAnim }} />
            <Animated.View style={{ height: 14, width: '90%', backgroundColor: colors.skeletonBase, borderRadius: 4, opacity: fadeAnim }} />
          </View>
        </View>
        <Animated.View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.skeletonBase, opacity: fadeAnim }} />
      </View>

      <Animated.View style={{ width: '100%', backgroundColor: colors.skeletonBase, borderRadius: 16, padding: 20, marginBottom: 20, opacity: fadeAnim }}>
        <View style={{ height: 18, width: '40%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 24 }} />
        
        {[1, 2, 3].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: colors.background, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ height: 14, width: '80%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ height: 12, width: '40%', backgroundColor: colors.background, borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// --- COMPOSANT MINIATURE INTELLIGENT ---
const MediaThumbnail = ({ imageUrl, videoUrl, hasAudio, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      if (videoUrl && !imageUrl) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
          if (isMounted) setVideoThumb(uri);
        } catch (e) {
          console.log("Erreur de génération de miniature vidéo", e);
        }
      }
    };
    fetchThumbnail();
    return () => { isMounted = false; };
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image source={{ uri: videoThumb }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
        ) : (
          <View style={[styles.iconThumbnail, { marginRight: 0, width: '100%', height: '100%' }]}>
             <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}>
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.iconThumbnail}>
        <Ionicons name="mic" size={24} color={colors.textSecondary} />
      </View>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
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
  const [cachedEmail, setCachedEmail] = useState(''); 
  const [updating, setUpdating] = useState(false);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(null);

  const currentMonthPostsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return myPosts.filter((post) => {
      const postDate = new Date(post.created_at);
      return (
        postDate.getMonth() === currentMonth &&
        postDate.getFullYear() === currentYear
      );
    }).length;
  }, [myPosts]);

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

  useEffect(() => {
    const getUserData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsedData = JSON.parse(cachedProfile);
          setFullName(parsedData.full_name || '');
          setAvatarUrl(parsedData.avatar_url || '');
          setUserRole(parsedData.role || 'user');
          setCachedEmail(parsedData.email || ''); 
        }

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

            await AsyncStorage.setItem('@profile_data', JSON.stringify({
              ...profileData,
              email: session.user.email 
            }));
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil ou Mode hors ligne :', err.message);
        if (!fullName) setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []); 

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const cacheKey = `@my_posts_${userId}`;
      const cachedPosts = await AsyncStorage.getItem(cacheKey);
      if (cachedPosts) {
        setMyPosts(JSON.parse(cachedPosts));
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setMyPosts(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Erreur récupération posts ou Mode hors ligne :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchMyPosts(user.id);
    setRefreshing(false);
  }, [user]);

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

              const updatedPosts = myPosts.filter(post => post.id !== postId);
              setMyPosts(updatedPosts);
              
              if (user) {
                await AsyncStorage.setItem(`@my_posts_${user.id}`, JSON.stringify(updatedPosts));
              }

              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  // NOUVELLE FONCTION: TÉLÉCHARGEMENT DE MÉDIA DIRECTEMENT DANS LA GALERIE
  const handleDownloadPost = async (post: any) => {
    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;
    
    const mediaUrlToDownload = imageUrl || videoUrl || (hasAudio ? post.audio_url : null);

    if (!mediaUrlToDownload) {
      Alert.alert("Info", "Aucun média téléchargeable pour cette publication.");
      return;
    }

    try {
      // 1. Vérifier / Demander la permission d'accès à la galerie
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin de votre permission pour sauvegarder des fichiers dans votre galerie.'
        );
        return;
      }

      setDownloadingPostId(post.id);
      
      // 2. Extraction de l'extension depuis l'URL (ou valeur par défaut)
      const urlWithoutQuery = mediaUrlToDownload.split('?')[0];
      const extension = urlWithoutQuery.split('.').pop() || (videoUrl ? 'mp4' : (imageUrl ? 'jpg' : 'mp3'));
      
      // 3. Création du chemin de fichier local temporaire avec le nouveau expo-file-system
      const fileUri = `${FileSystem.documentDirectory}media_${post.id}.${extension}`;
      
      // 4. Téléchargement depuis Supabase vers le dossier temporaire de l'app
      const { uri } = await FileSystem.downloadAsync(mediaUrlToDownload, fileUri);
      
      // 5. Sauvegarde du fichier temporaire dans la galerie de l'appareil
      await MediaLibrary.saveToLibraryAsync(uri); // Utilisation de saveToLibraryAsync

      // 6. Suppression du fichier temporaire pour ne pas encombrer l'espace
      await FileSystem.deleteAsync(uri, { idempotent: true });

      Alert.alert('Succès', 'Le média a été sauvegardé dans votre galerie !');

    } catch (error) {
      console.error("Erreur de téléchargement:", error);
      Alert.alert("Erreur", "Le téléchargement a échoué.");
    } finally {
      setDownloadingPostId(null);
    }
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
      
      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.full_name = fullName;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

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
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        const originalUri = result.assets[0].uri;

        const compressedUri = await ImageCompressor.compress(originalUri, {
          compressionMethod: 'auto',
          quality: 0.7,
        });

        const base64 = await FileSystem.readAsStringAsync(compressedUri, {
          encoding: 'base64', // Modification de EncodingType.Base64 vers 'base64'
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
        
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          parsed.avatar_url = publicUrl;
          await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
        }

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
              
              await AsyncStorage.removeItem('@is_logged_in');
              await AsyncStorage.removeItem('@profile_data');
              if (user) await AsyncStorage.removeItem(`@my_posts_${user.id}`);

              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
            } finally {
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

  if (loading && !fullName) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProfileSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >

      
        {activeView === 'main' && (
          <View>

            
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              
              
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                     <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]} numberOfLines={1}>
                    {fullName || 'Mon Profil'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || cachedEmail}
                  </Text>
                </View>
              </View>

            
              <TouchableOpacity 
                onPress={() => setActiveView('settings')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  backgroundColor: colors.cardBackground,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>

            </View>

            
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            
            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
              
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Mes Publications</Text>
                  <TouchableOpacity 
                    onPress={handleRefresh} 
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={refreshing || loadingPosts}
                  >
                    <Ionicons name="refresh" size={22} color={refreshing || loadingPosts ? colors.textSecondary : colors.primary} />
                  </TouchableOpacity>
                </View>
                <View style={{ 
                  backgroundColor: colors.background, 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                    Annonces publiées ce mois-ci
                  </Text>
                  <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {currentMonthPostsCount}
                    </Text>
                  </View>
                </View>

                {loadingPosts && myPosts.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    const defaultCaption = imageUrl 
                      ? "Publication avec image" 
                      : videoUrl 
                      ? "Vidéo" 
                      : hasAudio 
                      ? "Note vocale" 
                      : "Publication";

                    return (
                      <View key={post.id} style={styles.postItem}>
                        <MediaThumbnail 
                          imageUrl={imageUrl} 
                          videoUrl={videoUrl} 
                          hasAudio={hasAudio} 
                          colors={colors} 
                          styles={styles} 
                        />

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || defaultCaption}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity 
                            onPress={() => handleDownloadPost(post)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginRight: 16 }}
                            disabled={downloadingPostId === post.id}
                          >
                            {downloadingPostId === post.id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="download-outline" size={22} color={colors.primary} />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => handleDeletePost(post.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="trash-outline" size={22} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
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
              <Text style={styles.value}>{user?.email || cachedEmail || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
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
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
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
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system'; 
import * as MediaLibrary from 'expo-media-library'; 
import { decode } from 'base64-arraybuffer';
import { Image as ImageCompressor } from 'react-native-compressor'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import de expo-audio pour la lecture audio moderne
import { useAudioPlayer } from 'expo-audio';

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
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRES DÉTECTION DES MÉDIAS ---
const isImageUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg') || cleanUrl.endsWith('.png') || cleanUrl.endsWith('.webp') || cleanUrl.endsWith('.gif');
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.mov') || cleanUrl.endsWith('.m4v') || cleanUrl.endsWith('.webm');
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };

  let urls: string[] = [];
  if (Array.isArray(mediaData)) {
    urls = mediaData;
  } else if (typeof mediaData === 'string') {
    try {
      const parsed = JSON.parse(mediaData);
      urls = Array.isArray(parsed) ? parsed : [mediaData];
    } catch {
      urls = [mediaData];
    }
  }

  const imageUrl = urls.find(url => typeof url === 'string' && isImageUrl(url)) || null;
  const videoUrl = urls.find(url => typeof url === 'string' && isVideoUrl(url)) || null;

  return { imageUrl, videoUrl };
};

// --- COMPOSANT DE LECTURE AUDIO ---
const AudioPostPlayer = ({ audioUrl, colors }: { audioUrl: string; colors: any }) => {
  const player = useAudioPlayer(audioUrl);

  const togglePlay = () => {
    if (!player) return;
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  return (
    <TouchableOpacity 
      onPress={togglePlay} 
      style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: colors.border, 
        paddingVertical: 6, 
        paddingHorizontal: 10, 
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 6
      }}
    >
      <Ionicons name={player?.playing ? "pause-circle" : "play-circle"} size={20} color={colors.primary} />
      <Text style={{ color: colors.text, marginLeft: 6, fontSize: 13, fontWeight: '600' }}>
        {player?.playing ? "Pause" : "Écouter l'audio"}
      </Text>
    </TouchableOpacity>
  );
};

// --- SKELETON LOADER POUR LE PROFIL ---
const ProfileSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Animated.View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: colors.skeletonBase, marginRight: 16, opacity: fadeAnim }} />
          <View style={{ flex: 1 }}>
            <Animated.View style={{ height: 24, width: '70%', backgroundColor: colors.skeletonBase, borderRadius: 4, marginBottom: 8, opacity: fadeAnim }} />
            <Animated.View style={{ height: 14, width: '90%', backgroundColor: colors.skeletonBase, borderRadius: 4, opacity: fadeAnim }} />
          </View>
        </View>
        <Animated.View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.skeletonBase, opacity: fadeAnim }} />
      </View>

      <Animated.View style={{ width: '100%', backgroundColor: colors.skeletonBase, borderRadius: 16, padding: 20, marginBottom: 20, opacity: fadeAnim }}>
        <View style={{ height: 18, width: '40%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 24 }} />
        
        {[1, 2, 3].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 50, height: 50, borderRadius: 8, backgroundColor: colors.background, marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <View style={{ height: 14, width: '80%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ height: 12, width: '40%', backgroundColor: colors.background, borderRadius: 4 }} />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// --- COMPOSANT MINIATURE INTELLIGENT ---
const MediaThumbnail = ({ imageUrl, videoUrl, hasAudio, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      if (videoUrl && !imageUrl) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
          if (isMounted) setVideoThumb(uri);
        } catch (e) {
          console.log("Erreur de génération de miniature vidéo", e);
        }
      }
    };
    fetchThumbnail();
    return () => { isMounted = false; };
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image source={{ uri: videoThumb }} style={{ width: '100%', height: '100%', borderRadius: 8 }} resizeMode="cover" />
        ) : (
          <View style={[styles.iconThumbnail, { marginRight: 0, width: '100%', height: '100%' }]}>
             <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 }}>
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.iconThumbnail}>
        <Ionicons name="mic" size={24} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
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
  const [cachedEmail, setCachedEmail] = useState(''); 
  const [updating, setUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // État pour la barre de progression

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(null);

  const currentMonthPostsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return myPosts.filter((post) => {
      const postDate = new Date(post.created_at);
      return (
        postDate.getMonth() === currentMonth &&
        postDate.getFullYear() === currentYear
      );
    }).length;
  }, [myPosts]);

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

  useEffect(() => {
    const getUserData = async () => {
      try {
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsedData = JSON.parse(cachedProfile);
          setFullName(parsedData.full_name || '');
          setAvatarUrl(parsedData.avatar_url || '');
          setUserRole(parsedData.role || 'user');
          setCachedEmail(parsedData.email || ''); 
        }

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

            await AsyncStorage.setItem('@profile_data', JSON.stringify({
              ...profileData,
              email: session.user.email 
            }));
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil ou Mode hors ligne :', err.message);
        if (!fullName) setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []); 

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const cacheKey = `@my_posts_${userId}`;
      const cachedPosts = await AsyncStorage.getItem(cacheKey);
      if (cachedPosts) {
        setMyPosts(JSON.parse(cachedPosts));
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setMyPosts(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Erreur récupération posts ou Mode hors ligne :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchMyPosts(user.id);
    setRefreshing(false);
  }, [user]);

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

              const updatedPosts = myPosts.filter(post => post.id !== postId);
              setMyPosts(updatedPosts);
              
              if (user) {
                await AsyncStorage.setItem(`@my_posts_${user.id}`, JSON.stringify(updatedPosts));
              }

              Alert.alert("Succès", "La publication a été supprimée.");
            } catch (err: any) {
              Alert.alert("Erreur", "Impossible de supprimer la publication.");
            }
          }
        }
      ]
    );
  };

  const handleDownloadPost = async (post: any) => {
    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;
    
    const mediaUrlToDownload = imageUrl || videoUrl || (hasAudio ? post.audio_url : null);

    if (!mediaUrlToDownload) {
      Alert.alert("Info", "Aucun média téléchargeable pour cette publication.");
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'L\'application a besoin de votre permission pour sauvegarder des fichiers dans votre galerie.'
        );
        return;
      }

      setDownloadingPostId(post.id);
      
      const urlWithoutQuery = mediaUrlToDownload.split('?')[0];
      const extension = urlWithoutQuery.split('.').pop() || (videoUrl ? 'mp4' : (imageUrl ? 'jpg' : 'mp3'));
      
      const fileUri = `${FileSystem.documentDirectory}media_${post.id}.${extension}`;
      
      const { uri } = await FileSystem.downloadAsync(mediaUrlToDownload, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);
      await FileSystem.deleteAsync(uri, { idempotent: true });

      Alert.alert('Succès', 'Le média a été sauvegardé dans votre galerie !');

    } catch (error) {
      console.error("Erreur de téléchargement:", error);
      Alert.alert("Erreur", "Le téléchargement a échoué.");
    } finally {
      setDownloadingPostId(null);
    }
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
      
      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.full_name = fullName;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  // SÉLECTION, RETOUCHE (CROP) ET UPLOAD AVEC SUIVI DE PROGRESSION
  const handlePickImage = async () => {
    if (!user) return;

    // L'option allowsEditing: true active l'éditeur natif (recadrage/retouche) au moment du choix
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      try {
        setUpdating(true);
        setUploadProgress(0);
        const originalUri = result.assets[0].uri;

        const compressedUri = await ImageCompressor.compress(originalUri, {
          compressionMethod: 'auto',
          quality: 0.7,
        });

        const filePath = `${user.id}/${Date.now()}.jpg`;
        const uploadUrl = `${supabase.supabaseUrl}/storage/v1/object/avatars/${filePath}`;
        const sessionData = await supabase.auth.getSession();
        const token = sessionData.data.session?.access_token;

        // Utilisation de FileSystem.createUploadTask pour obtenir la barre de progression en temps réel
        const uploadTask = FileSystem.createUploadTask(
          uploadUrl,
          compressedUri,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: supabase.supabaseKey,
              'x-upsert': 'true',
              'Content-Type': 'image/jpeg',
            },
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          },
          (data) => {
            const progress = Math.round((data.totalBytesSent / data.totalBytesExpectedToSend) * 100);
            setUploadProgress(progress);
          }
        );

        const uploadResult = await uploadTask.uploadAsync();
        if (!uploadResult || (uploadResult.status !== 200 && uploadResult.status !== 205)) {
          throw new Error("L'envoi du fichier a échoué.");
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setAvatarUrl(publicUrl);
        
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          parsed.avatar_url = publicUrl;
          await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
        }

        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } catch (err: any) {
        console.error('Erreur Upload:', err);
        Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
      } finally {
        setUpdating(false);
        setUploadProgress(0);
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
              
              await AsyncStorage.removeItem('@is_logged_in');
              await AsyncStorage.removeItem('@profile_data');
              if (user) await AsyncStorage.removeItem(`@my_posts_${user.id}`);

              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) throw signOutError;
              
              router.replace('/');
            } catch (err: any) {
              Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
            } finally {
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

  if (loading && !fullName) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProfileSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeView === 'main' && (
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}>
                     <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]} numberOfLines={1}>
                    {fullName || 'Mon Profil'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || cachedEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setActiveView('settings')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  backgroundColor: colors.cardBackground,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Mes Publications</Text>
                  <TouchableOpacity 
                    onPress={handleRefresh} 
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={refreshing || loadingPosts}
                  >
                    <Ionicons name="refresh" size={22} color={refreshing || loadingPosts ? colors.textSecondary : colors.primary} />
                  </TouchableOpacity>
                </View>

                <View style={{ 
                  backgroundColor: colors.background, 
                  padding: 12, 
                  borderRadius: 8, 
                  marginBottom: 16, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                    Annonces publiées ce mois-ci
                  </Text>
                  <View style={{ backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {currentMonthPostsCount}
                    </Text>
                  </View>
                </View>

                {loadingPosts && myPosts.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    const defaultCaption = imageUrl 
                      ? "Publication avec image" 
                      : videoUrl 
                      ? "Vidéo" 
                      : hasAudio 
                      ? "Note vocale" 
                      : "Publication";

                    return (
                      <View key={post.id} style={styles.postItem}>
                        <MediaThumbnail 
                          imageUrl={imageUrl} 
                          videoUrl={videoUrl} 
                          hasAudio={hasAudio} 
                          colors={colors} 
                          styles={styles} 
                        />

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || defaultCaption}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                          {hasAudio && <AudioPostPlayer audioUrl={post.audio_url} colors={colors} />}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity 
                            onPress={() => handleDownloadPost(post)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginRight: 16 }}
                            disabled={downloadingPostId === post.id}
                          >
                            {downloadingPostId === post.id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="download-outline" size={22} color={colors.primary} />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => handleDeletePost(post.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="trash-outline" size={22} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
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
                  <Text style={styles.changePhotoText}>Changer et retoucher la photo</Text>
                </TouchableOpacity>

            
                {updating && (
                  <View style={{ width: '100%', marginTop: 12 }}>
                    <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: colors.primary }} />
                    </View>
                    <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                      Envoi en cours : {uploadProgress}%
                    </Text>
                  </View>
                )}
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
              <Text style={styles.value}>{user?.email || cachedEmail || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
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
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
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
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ expo-audio UNIQUEMENT (expo-av est obsolète et supprimé dans SDK 55)
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';

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
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRES DÉTECTION DES MÉDIAS ---
const isImageUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.webp') ||
    cleanUrl.endsWith('.gif')
  );
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.endsWith('.webm')
  );
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };

  let urls: string[] = [];
  if (Array.isArray(mediaData)) {
    urls = mediaData;
  } else if (typeof mediaData === 'string') {
    try {
      const parsed = JSON.parse(mediaData);
      urls = Array.isArray(parsed) ? parsed : [mediaData];
    } catch {
      urls = [mediaData];
    }
  }

  const imageUrl = urls.find((url) => typeof url === 'string' && isImageUrl(url)) || null;
  const videoUrl = urls.find((url) => typeof url === 'string' && isVideoUrl(url)) || null;

  return { imageUrl, videoUrl };
};

// ============================================================
// 🎵 COMPOSANT DE LECTURE AUDIO — CORRIGÉ POUR iOS
// ============================================================
// Solutions appliquées pour corriger les bugs iOS d'expo-audio :
// 1. Téléchargement du fichier dans le cache local AVANT lecture
//    (contourne le bug AVURLAsset avec les URI distantes et base64)
// 2. Appel de setAudioModeAsync AVANT chaque lecture sur iOS
//    (requis pour que l'audio sorte du mode silencieux)
// 3. Utilisation de useAudioPlayerStatus pour forcer le re-render
// 4. seekTo(0) quand l'audio est terminé (expo-audio ne le fait pas auto)
// ============================================================
const AudioPostPlayer = ({ audioUrl, colors }: { audioUrl: string; colors: any }) => {
  const [localUri, setLocalUri] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [prepError, setPrepError] = useState<string | null>(null);

  // --- ÉTAPE 1 : Télécharger l'audio dans le cache local (fix iOS) ---
  useEffect(() => {
    let isMounted = true;

    const prepareAudio = async () => {
      setIsPreparing(true);
      setPrepError(null);

      try {
        // Si l'URI est déjà locale, pas besoin de télécharger
        if (audioUrl.startsWith('file://') || audioUrl.startsWith('content://')) {
          if (isMounted) {
            setLocalUri(audioUrl);
            setIsPreparing(false);
          }
          return;
        }

        // Construire un chemin de fichier unique dans le cache
        const urlWithoutQuery = audioUrl.split('?')[0];
        const extension = urlWithoutQuery.split('.').pop()?.toLowerCase() || 'mp3';
        const fileName = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

        // Télécharger le fichier
        const { uri } = await FileSystem.downloadAsync(audioUrl, fileUri);

        if (isMounted) {
          setLocalUri(uri);
          setIsPreparing(false);
        }
      } catch (err: any) {
        console.warn('Erreur préparation audio:', err);
        if (isMounted) {
          // Fallback : essayer directement l'URI originale
          setLocalUri(audioUrl);
          setIsPreparing(false);
        }
      }
    };

    prepareAudio();

    return () => {
      isMounted = false;
      // Nettoyer le fichier temporaire au démontage
      if (localUri && localUri.includes(FileSystem.cacheDirectory || '') && localUri !== audioUrl) {
        FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => {});
      }
    };
  }, [audioUrl]);

  // --- ÉTAPE 2 : Créer le player avec l'URI locale ---
  const player = useAudioPlayer(localUri ? { uri: localUri } : null);
  const status = useAudioPlayerStatus(player);

  const togglePlay = useCallback(async () => {
    if (!player || !localUri || isPreparing) return;

    try {
      // ⚠️ CRUCIAL sur iOS : configurer le mode audio AVANT de jouer
      // Sans cela, l'audio ne sort pas du mode silencieux sur iPhone
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: 'duckOthers',
      });

      if (status?.playing) {
        player.pause();
      } else {
        // Remettre au début si l'audio est terminé
        // (expo-audio ne le fait pas automatiquement, contrairement à expo-av)
        if (status?.didJustFinish) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (err) {
      console.warn('Erreur lecture audio:', err);
    }
  }, [player, localUri, isPreparing, status?.playing, status?.didJustFinish]);

  const isPlaying = status?.playing === true;

  // --- Affichage pendant le chargement ---
  if (isPreparing) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.border,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 8,
          alignSelf: 'flex-start',
          marginTop: 6,
        }}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginLeft: 6, fontSize: 12 }}>
          Préparation...
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={togglePlay}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.border,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 6,
      }}
    >
      <Ionicons
        name={isPlaying ? 'pause-circle' : 'play-circle'}
        size={20}
        color={colors.primary}
      />
      <Text
        style={{
          color: colors.text,
          marginLeft: 6,
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        {isPlaying ? 'Pause' : "Écouter l'audio"}
      </Text>
      {status?.duration > 0 && (
        <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 11 }}>
          {Math.round(status.currentTime || 0)}s / {Math.round(status.duration)}s
        </Text>
      )}
    </TouchableOpacity>
  );
};

// --- SKELETON LOADER POUR LE PROFIL ---
const ProfileSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Animated.View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.skeletonBase,
              marginRight: 16,
              opacity: fadeAnim,
            }}
          />
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{
                height: 24,
                width: '70%',
                backgroundColor: colors.skeletonBase,
                borderRadius: 4,
                marginBottom: 8,
                opacity: fadeAnim,
              }}
            />
            <Animated.View
              style={{
                height: 14,
                width: '90%',
                backgroundColor: colors.skeletonBase,
                borderRadius: 4,
                opacity: fadeAnim,
              }}
            />
          </View>
        </View>
        <Animated.View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.skeletonBase,
            opacity: fadeAnim,
          }}
        />
      </View>

      <Animated.View
        style={{
          width: '100%',
          backgroundColor: colors.skeletonBase,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          opacity: fadeAnim,
        }}
      >
        <View
          style={{
            height: 18,
            width: '40%',
            backgroundColor: colors.background,
            borderRadius: 4,
            marginBottom: 24,
          }}
        />

        {[1, 2, 3].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 8,
                backgroundColor: colors.background,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  height: 14,
                  width: '80%',
                  backgroundColor: colors.background,
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <View
                style={{
                  height: 12,
                  width: '40%',
                  backgroundColor: colors.background,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// --- COMPOSANT MINIATURE INTELLIGENT ---
const MediaThumbnail = ({ imageUrl, videoUrl, hasAudio, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      if (videoUrl && !imageUrl) {
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 });
          if (isMounted) setVideoThumb(uri);
        } catch (e) {
          console.log('Erreur de génération de miniature vidéo', e);
        }
      }
    };
    fetchThumbnail();
    return () => {
      isMounted = false;
    };
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image
            source={{ uri: videoThumb }}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.iconThumbnail,
              { marginRight: 0, width: '100%', height: '100%' },
            ]}
          >
            <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 12,
            padding: 2,
          }}
        >
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.iconThumbnail}>
        <Ionicons name="mic" size={24} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
};

// ============================================================
// 🔧 HELPER : Copier un fichier en local (corrige Samsung + content://)
// ============================================================
const copyToPersistentStorage = async (sourceUri: string, suffix: string): Promise<string> => {
  if (sourceUri.startsWith(FileSystem.documentDirectory || '')) {
    return sourceUri;
  }

  const extension = sourceUri.split('?')[0].split('.').pop() || 'jpg';
  const destUri = `${FileSystem.documentDirectory}upload_${Date.now()}_${suffix}.${extension}`;

  try {
    await FileSystem.copyAsync({ from: sourceUri, to: destUri });
    return destUri;
  } catch (err) {
    console.warn('copyAsync échoué, fallback vers URI original:', err);
    return sourceUri;
  }
};

// ============================================================
// 🔧 HELPER : Redimensionner + compresser une image (fiable iOS/Android)
// ============================================================
const processImage = async (uri: string, maxWidth = 800): Promise<string> => {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      {
        compress: 0.7,
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false,
      }
    );
    return result.uri;
  } catch (err) {
    console.warn("ImageManipulator échoué, utilisation de l'image originale:", err);
    return uri;
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
  const [cachedEmail, setCachedEmail] = useState('');
  const [updating, setUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(null);

  // ============================================================
  // 🎵 CONFIGURATION AUDIO GLOBALE AU MONTAGE
  // ============================================================
  // Sur iOS, il est crucial de configurer le mode audio AVANT toute lecture.
  // Sans cela, l'audio ne sort pas si le téléphone est en mode silencieux.
  // ============================================================
  useEffect(() => {
    const configureAudio = async () => {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: false,
          interruptionMode: 'duckOthers',
        });
      } catch (err) {
        console.warn('setAudioModeAsync échoué au montage:', err);
      }
    };
    configureAudio();
  }, []);

  const currentMonthPostsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return myPosts.filter((post) => {
      const postDate = new Date(post.created_at);
      return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
    }).length;
  }, [myPosts]);

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
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsedData = JSON.parse(cachedProfile);
          setFullName(parsedData.full_name || '');
          setAvatarUrl(parsedData.avatar_url || '');
          setUserRole(parsedData.role || 'user');
          setCachedEmail(parsedData.email || '');
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();
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

            await AsyncStorage.setItem(
              '@profile_data',
              JSON.stringify({
                ...profileData,
                email: session.user.email,
              })
            );
          }

          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil ou Mode hors ligne :', err.message);
        if (!fullName) setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const cacheKey = `@my_posts_${userId}`;
      const cachedPosts = await AsyncStorage.getItem(cacheKey);
      if (cachedPosts) {
        setMyPosts(JSON.parse(cachedPosts));
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setMyPosts(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Erreur récupération posts ou Mode hors ligne :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchMyPosts(user.id);
    setRefreshing(false);
  }, [user]);

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Supprimer la publication',
      'Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;

              const updatedPosts = myPosts.filter((post) => post.id !== postId);
              setMyPosts(updatedPosts);

              if (user) {
                await AsyncStorage.setItem(`@my_posts_${user.id}`, JSON.stringify(updatedPosts));
              }

              Alert.alert('Succès', 'La publication a été supprimée.');
            } catch (err: any) {
              Alert.alert('Erreur', 'Impossible de supprimer la publication.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadPost = async (post: any) => {
    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;

    const mediaUrlToDownload = imageUrl || videoUrl || (hasAudio ? post.audio_url : null);

    if (!mediaUrlToDownload) {
      Alert.alert('Info', 'Aucun média téléchargeable pour cette publication.');
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          "L'application a besoin de votre permission pour sauvegarder des fichiers dans votre galerie."
        );
        return;
      }

      setDownloadingPostId(post.id);

      const urlWithoutQuery = mediaUrlToDownload.split('?')[0];
      const extension =
        urlWithoutQuery.split('.').pop() || (videoUrl ? 'mp4' : imageUrl ? 'jpg' : 'mp3');

      const fileUri = `${FileSystem.documentDirectory}media_${post.id}.${extension}`;

      const { uri } = await FileSystem.downloadAsync(mediaUrlToDownload, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);
      await FileSystem.deleteAsync(uri, { idempotent: true });

      Alert.alert('Succès', 'Le média a été sauvegardé dans votre galerie !');
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      Alert.alert('Erreur', 'Le téléchargement a échoué.');
    } finally {
      setDownloadingPostId(null);
    }
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

      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.full_name = fullName;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================
  // 📷 SÉLECTION / CAMÉRA / RETOUCHE / UPLOAD — VERSION CORRIGÉE
  // ============================================================
  const handlePickImage = () => {
    if (!user) return;

    Alert.alert('Photo de profil', 'Choisis une source', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: '📷 Appareil photo',
        onPress: () => openImageSource('camera'),
      },
      {
        text: '🖼️ Galerie',
        onPress: () => openImageSource('library'),
      },
    ]);
  };

  const openImageSource = async (source: 'camera' | 'library') => {
    if (!user) return;

    try {
      // --- Demande des permissions via les hooks officiels ---
      if (source === 'camera') {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          Alert.alert(
            'Permission requise',
            "L'application a besoin d'accéder à votre caméra pour prendre une photo."
          );
          return;
        }
      } else {
        const libPerm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!libPerm.granted) {
          Alert.alert(
            'Permission requise',
            "L'application a besoin d'accéder à votre galerie pour choisir une photo."
          );
          return;
        }
      }

      // --- Options : on désactive allowsEditing (cause des crashs Android) ---
      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
        exif: false,
      };

      // --- Lancement ---
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      setUpdating(true);
      setUploadProgress(0);

      const originalUri = result.assets[0].uri;

      // --- ÉTAPE 1 : Copier dans documentDirectory (persistant) ---
      const persistentUri = await copyToPersistentStorage(originalUri, 'avatar');

      // --- ÉTAPE 2 : Redimensionner + compresser ---
      const processedUri = await processImage(persistentUri, 800);

      // --- ÉTAPE 3 : Upload vers Supabase Storage ---
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const uploadUrl = `${supabase.supabaseUrl}/storage/v1/object/avatars/${filePath}`;
      const sessionData = await supabase.auth.getSession();
      const token = sessionData.data.session?.access_token;

      if (!token) {
        throw new Error('Session expirée, reconnecte-toi.');
      }

      const uploadTask = FileSystem.createUploadTask(
        uploadUrl,
        processedUri,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabase.supabaseKey,
            'x-upsert': 'true',
            'Content-Type': 'image/jpeg',
          },
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
        },
        (data) => {
          if (data.totalBytesExpectedToSend > 0) {
            const progress = Math.round(
              (data.totalBytesSent / data.totalBytesExpectedToSend) * 100
            );
            setUploadProgress(progress);
          }
        }
      );

      const uploadResult = await uploadTask.uploadAsync();
      if (!uploadResult || (uploadResult.status !== 200 && uploadResult.status !== 205)) {
        throw new Error(`Échec de l'envoi (code ${uploadResult?.status})`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);

      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.avatar_url = publicUrl;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

      Alert.alert('Succès', 'Photo de profil mise à jour !');
    } catch (err: any) {
      console.error('Erreur Upload:', err);
      Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
    } finally {
      setUpdating(false);
      setUploadProgress(0);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          try {
            setSignOutLoading(true);

            await AsyncStorage.removeItem('@is_logged_in');
            await AsyncStorage.removeItem('@profile_data');
            if (user) await AsyncStorage.removeItem(`@my_posts_${user.id}`);

            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;

            router.replace('/');
          } catch (err: any) {
            Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
          } finally {
            setSignOutLoading(false);
          }
        },
      },
    ]);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { flexGrow: 1, padding: 24 },
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
        title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
        sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
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
        value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
        signOutButton: {
          width: '100%',
          backgroundColor: colors.danger,
          padding: 15,
          borderRadius: 12,
          alignItems: 'center',
        },
        signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
        errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },

        avatarContainer: { alignItems: 'center', marginBottom: 24 },
        avatar: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.border,
          marginBottom: 12,
        },
        avatarPlaceholder: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.border,
          marginBottom: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
        changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
        input: {
          backgroundColor: colors.background,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
        },
        saveButton: {
          backgroundColor: colors.primary,
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        },
        saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

        postItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        postThumbnail: {
          width: 50,
          height: 50,
          borderRadius: 8,
          marginRight: 12,
          backgroundColor: colors.border,
        },
        iconThumbnail: {
          width: 50,
          height: 50,
          borderRadius: 8,
          marginRight: 12,
          backgroundColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        },
        postContent: { flex: 1, marginRight: 12 },
        postCaption: {
          fontSize: 14,
          color: colors.text,
          fontWeight: '500',
          marginBottom: 4,
        },
        postDate: { fontSize: 12, color: colors.textSecondary },
        emptyText: {
          color: colors.textSecondary,
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: 10,
        },
      }),
    [colors]
  );

  if (loading && !fullName) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProfileSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeView === 'main' && (
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <View
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}
              >
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={[
                      styles.avatar,
                      { width: 50, height: 50, marginBottom: 0, marginRight: 16 },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { width: 50, height: 50, marginBottom: 0, marginRight: 16 },
                    ]}
                  >
                    <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.title, { marginBottom: 0, fontSize: 22 }]}
                    numberOfLines={1}
                  >
                    {fullName || 'Mon Profil'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || cachedEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setActiveView('settings')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  backgroundColor: colors.cardBackground,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Mes Publications</Text>
                  <TouchableOpacity
                    onPress={handleRefresh}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={refreshing || loadingPosts}
                  >
                    <Ionicons
                      name="refresh"
                      size={22}
                      color={refreshing || loadingPosts ? colors.textSecondary : colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    backgroundColor: colors.background,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                    Annonces publiées ce mois-ci
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {currentMonthPostsCount}
                    </Text>
                  </View>
                </View>

                {loadingPosts && myPosts.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
                    const hasAudio =
                      typeof post.audio_url === 'string' && post.audio_url.length > 0;

                    const defaultCaption = imageUrl
                      ? 'Publication avec image'
                      : videoUrl
                      ? 'Vidéo'
                      : hasAudio
                      ? 'Note vocale'
                      : 'Publication';

                    return (
                      <View key={post.id} style={styles.postItem}>
                        <MediaThumbnail
                          imageUrl={imageUrl}
                          videoUrl={videoUrl}
                          hasAudio={hasAudio}
                          colors={colors}
                          styles={styles}
                        />

                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || defaultCaption}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                          {hasAudio && (
                            <AudioPostPlayer audioUrl={post.audio_url} colors={colors} />
                          )}
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={() => handleDownloadPost(post)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginRight: 16 }}
                            disabled={downloadingPostId === post.id}
                          >
                            {downloadingPostId === post.id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="download-outline" size={22} color={colors.primary} />
                            )}
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeletePost(post.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="trash-outline" size={22} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
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
                <TouchableOpacity onPress={handlePickImage} disabled={updating} activeOpacity={0.8}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>
                    Prendre / Choisir une photo
                  </Text>
                </TouchableOpacity>

                {updating && (
                  <View style={{ width: '100%', marginTop: 12 }}>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.border,
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${uploadProgress}%`,
                          height: '100%',
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      Envoi en cours : {uploadProgress}%
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateName}
                disabled={updating}
              >
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
              <Text style={styles.value}>{user?.email || cachedEmail || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
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









import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
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
  Animated,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// ✅ NOUVELLES BIBLIOTHÈQUES MODERNES
import { launchCamera, launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import { ImageEditor } from '@phucprime/react-native-image-editor';
import { AudioPro, AudioProState } from 'react-native-audio-pro';
import ReactNativeBlobUtil from 'react-native-blob-util';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Expo FileSystem pour la gestion des fichiers (nouvelle API)
import { File, Directory, Paths } from 'expo-file-system';

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
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

type ViewMode = 'main' | 'settings';

// --- UTILITAIRES DÉTECTION DES MÉDIAS ---
const isImageUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.jpg') ||
    cleanUrl.endsWith('.jpeg') ||
    cleanUrl.endsWith('.png') ||
    cleanUrl.endsWith('.webp') ||
    cleanUrl.endsWith('.gif')
  );
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.mov') ||
    cleanUrl.endsWith('.m4v') ||
    cleanUrl.endsWith('.webm')
  );
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };
  let urls: string[] = [];
  if (Array.isArray(mediaData)) {
    urls = mediaData;
  } else if (typeof mediaData === 'string') {
    try {
      const parsed = JSON.parse(mediaData);
      urls = Array.isArray(parsed) ? parsed : [mediaData];
    } catch {
      urls = [mediaData];
    }
  }
  const imageUrl = urls.find((url) => typeof url === 'string' && isImageUrl(url)) || null;
  const videoUrl = urls.find((url) => typeof url === 'string' && isVideoUrl(url)) || null;
  return { imageUrl, videoUrl };
};

// ============================================================
// 🎵 COMPOSANT DE LECTURE AUDIO — react-native-audio-pro
// ============================================================
const AudioPostPlayer = ({ audioUrl, colors }: { audioUrl: string; colors: any }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const loadAudio = async () => {
      setIsLoading(true);
      try {
        // react-native-audio-pro gère nativement le streaming et le buffering
        await AudioPro.load(audioUrl, {
          title: 'Audio',
          artwork: '',
        });
        const state = AudioPro.getState();
        if (state) {
          setDuration(state.duration || 0);
        }
      } catch (err) {
        console.warn('Erreur chargement audio:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAudio();

    // Écoute des changements d'état
    const listener = AudioPro.addListener((state: AudioProState) => {
      setIsPlaying(state.isPlaying);
      setCurrentTime(state.position || 0);
      setDuration(state.duration || 0);
    });

    return () => {
      listener?.remove?.();
    };
  }, [audioUrl]);

  const togglePlay = useCallback(async () => {
    if (isLoading) return;
    try {
      if (isPlaying) {
        await AudioPro.pause();
      } else {
        // Si la piste est terminée, on la recharge
        if (currentTime >= duration && duration > 0) {
          await AudioPro.seekTo(0);
        }
        await AudioPro.play();
      }
    } catch (err) {
      console.warn('Erreur lecture audio:', err);
    }
  }, [isPlaying, isLoading, currentTime, duration]);

  if (isLoading) {
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.border,
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 8,
          alignSelf: 'flex-start',
          marginTop: 6,
        }}
      >
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginLeft: 6, fontSize: 12 }}>
          Chargement...
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      onPress={togglePlay}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.border,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 6,
      }}
    >
      <Ionicons
        name={isPlaying ? 'pause-circle' : 'play-circle'}
        size={20}
        color={colors.primary}
      />
      <Text
        style={{
          color: colors.text,
          marginLeft: 6,
          fontSize: 13,
          fontWeight: '600',
        }}
      >
        {isPlaying ? 'Pause' : "Écouter l'audio"}
      </Text>
      {duration > 0 && (
        <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 11 }}>
          {Math.round(currentTime)}s / {Math.round(duration)}s
        </Text>
      )}
    </TouchableOpacity>
  );
};

// --- SKELETON LOADER POUR LE PROFIL ---
const ProfileSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
          <Animated.View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: colors.skeletonBase,
              marginRight: 16,
              opacity: fadeAnim,
            }}
          />
          <View style={{ flex: 1 }}>
            <Animated.View
              style={{
                height: 24,
                width: '70%',
                backgroundColor: colors.skeletonBase,
                borderRadius: 4,
                marginBottom: 8,
                opacity: fadeAnim,
              }}
            />
            <Animated.View
              style={{
                height: 14,
                width: '90%',
                backgroundColor: colors.skeletonBase,
                borderRadius: 4,
                opacity: fadeAnim,
              }}
            />
          </View>
        </View>
        <Animated.View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.skeletonBase,
            opacity: fadeAnim,
          }}
        />
      </View>

      <Animated.View
        style={{
          width: '100%',
          backgroundColor: colors.skeletonBase,
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
          opacity: fadeAnim,
        }}
      >
        <View
          style={{
            height: 18,
            width: '40%',
            backgroundColor: colors.background,
            borderRadius: 4,
            marginBottom: 24,
          }}
        />

        {[1, 2, 3].map((item) => (
          <View key={item} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 8,
                backgroundColor: colors.background,
                marginRight: 12,
              }}
            />
            <View style={{ flex: 1 }}>
              <View
                style={{
                  height: 14,
                  width: '80%',
                  backgroundColor: colors.background,
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <View
                style={{
                  height: 12,
                  width: '40%',
                  backgroundColor: colors.background,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  );
});

// --- COMPOSANT MINIATURE INTELLIGENT ---
const MediaThumbnail = ({ imageUrl, videoUrl, hasAudio, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchThumbnail = async () => {
      if (videoUrl && !imageUrl) {
        try {
          // Utilisation de react-native-video-thumbnails ou d'un fallback
          // Ici on met un placeholder pour simplifier
          if (isMounted) setVideoThumb(null);
        } catch (e) {
          console.log('Erreur de génération de miniature vidéo', e);
        }
      }
    };
    fetchThumbnail();
    return () => {
      isMounted = false;
    };
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image
            source={{ uri: videoThumb }}
            style={{ width: '100%', height: '100%', borderRadius: 8 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.iconThumbnail,
              { marginRight: 0, width: '100%', height: '100%' },
            ]}
          >
            <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 12,
            padding: 2,
          }}
        >
          <Ionicons name="play" size={12} color="#FFF" />
        </View>
      </View>
    );
  }

  if (hasAudio) {
    return (
      <View style={styles.iconThumbnail}>
        <Ionicons name="mic" size={24} color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
};

// ============================================================
// 🔧 HELPER : Copier un fichier dans documentDirectory
// ============================================================
const copyToPersistentStorage = async (sourceUri: string, suffix: string): Promise<string> => {
  try {
    const sourceFile = new File(sourceUri);
    if (sourceUri.startsWith(Paths.document.uri)) {
      return sourceUri;
    }
    const extension = sourceUri.split('?')[0].split('.').pop() || 'jpg';
    const destFileName = `upload_${Date.now()}_${suffix}.${extension}`;
    const destFile = new File(Paths.document, destFileName);
    sourceFile.copy(destFile);
    return destFile.uri;
  } catch (err) {
    console.warn('copy échoué, fallback vers URI original:', err);
    return sourceUri;
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
  const [cachedEmail, setCachedEmail] = useState('');
  const [updating, setUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingPostId, setDownloadingPostId] = useState<string | null>(null);

  // ============================================================
  // 🎵 CONFIGURATION AUDIO GLOBALE AU MONTAGE
  // ============================================================
  useEffect(() => {
    const configureAudio = async () => {
      try {
        // react-native-audio-pro gère la configuration audio nativement
        // Mais on peut forcer l'activation du mode playback
        if (Platform.OS === 'ios') {
          // Configuration iOS via le module natif
        }
      } catch (err) {
        console.warn('Configuration audio échouée:', err);
      }
    };
    configureAudio();
  }, []);

  const currentMonthPostsCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return myPosts.filter((post) => {
      const postDate = new Date(post.created_at);
      return postDate.getMonth() === currentMonth && postDate.getFullYear() === currentYear;
    }).length;
  }, [myPosts]);

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
        const cachedProfile = await AsyncStorage.getItem('@profile_data');
        if (cachedProfile) {
          const parsedData = JSON.parse(cachedProfile);
          setFullName(parsedData.full_name || '');
          setAvatarUrl(parsedData.avatar_url || '');
          setUserRole(parsedData.role || 'user');
          setCachedEmail(parsedData.email || '');
        }

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
            await AsyncStorage.setItem('@profile_data', JSON.stringify({
              ...profileData,
              email: session.user.email,
            }));
          }
          fetchMyPosts(session.user.id);
        }
      } catch (err: any) {
        console.error('Erreur profil ou Mode hors ligne :', err.message);
        if (!fullName) setError('Mode hors ligne ou erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };
    getUserData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    setLoadingPosts(true);
    try {
      const cacheKey = `@my_posts_${userId}`;
      const cachedPosts = await AsyncStorage.getItem(cacheKey);
      if (cachedPosts) {
        setMyPosts(JSON.parse(cachedPosts));
      }
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setMyPosts(data);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      }
    } catch (err: any) {
      console.error('Erreur récupération posts ou Mode hors ligne :', err.message);
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchMyPosts(user.id);
    setRefreshing(false);
  }, [user]);

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      'Supprimer la publication',
      'Êtes-vous sûr de vouloir supprimer cette publication ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', postId);
              if (error) throw error;
              const updatedPosts = myPosts.filter((post) => post.id !== postId);
              setMyPosts(updatedPosts);
              if (user) {
                await AsyncStorage.setItem(`@my_posts_${user.id}`, JSON.stringify(updatedPosts));
              }
              Alert.alert('Succès', 'La publication a été supprimée.');
            } catch (err: any) {
              Alert.alert('Erreur', 'Impossible de supprimer la publication.');
            }
          },
        },
      ]
    );
  };

  const handleDownloadPost = async (post: any) => {
    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;
    const mediaUrlToDownload = imageUrl || videoUrl || (hasAudio ? post.audio_url : null);

    if (!mediaUrlToDownload) {
      Alert.alert('Info', 'Aucun média téléchargeable pour cette publication.');
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          "L'application a besoin de votre permission pour sauvegarder des fichiers dans votre galerie."
        );
        return;
      }

      setDownloadingPostId(post.id);

      const urlWithoutQuery = mediaUrlToDownload.split('?')[0];
      const extension = urlWithoutQuery.split('.').pop() || (videoUrl ? 'mp4' : imageUrl ? 'jpg' : 'mp3');

      const tempDir = new Directory(Paths.cache, 'downloads');
      if (!tempDir.exists) tempDir.create();
      const tempFile = new File(tempDir, `media_${post.id}.${extension}`);

      // ✅ Utilisation de react-native-blob-util pour le téléchargement
      const res = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: tempFile.uri,
      }).fetch('GET', mediaUrlToDownload);

      await MediaLibrary.saveToLibraryAsync(res.path());
      // Nettoyage
      const fileToDelete = new File(res.path());
      if (fileToDelete.exists) fileToDelete.delete();

      Alert.alert('Succès', 'Le média a été sauvegardé dans votre galerie !');
    } catch (error) {
      console.error('Erreur de téléchargement:', error);
      Alert.alert('Erreur', 'Le téléchargement a échoué.');
    } finally {
      setDownloadingPostId(null);
    }
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
      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.full_name = fullName;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }
      Alert.alert('Succès', 'Ton nom a été mis à jour.');
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setUpdating(false);
    }
  };

  // ============================================================
  // 📷 SÉLECTION / CAMÉRA / RETOUCHE / UPLOAD — MODERNE
  // ============================================================
  const handlePickImage = () => {
    if (!user) return;

    Alert.alert('Photo de profil', 'Choisis une source', [
      { text: 'Annuler', style: 'cancel' },
      { text: '📷 Appareil photo', onPress: () => openImageSource('camera') },
      { text: '🖼️ Galerie', onPress: () => openImageSource('library') },
    ]);
  };

  const openImageSource = async (source: 'camera' | 'library') => {
    if (!user) return;

    try {
      let result: ImagePickerResponse;

      if (source === 'camera') {
        result = await launchCamera({
          mediaType: 'photo',
          quality: 1,
          includeBase64: false,
          saveToPhotos: false,
        });
      } else {
        result = await launchImageLibrary({
          mediaType: 'photo',
          quality: 1,
          includeBase64: false,
          selectionLimit: 1,
        });
      }

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset: Asset = result.assets[0];
      setUpdating(true);
      setUploadProgress(0);

      const originalUri = asset.uri!;

      // --- ÉTAPE 1 : Copier dans documentDirectory (persistant) ---
      const persistentUri = await copyToPersistentStorage(originalUri, 'avatar');

      // --- ÉTAPE 2 : Ouvrir l'éditeur d'image natif pour retouche/recadrage ---
      const editedUri = await ImageEditor.edit(persistentUri, {
        colors: ['#6200EE', '#BB86FC', '#FF0000', '#00FF00'],
        hiddenControls: ['share', 'sticker'], // On cache les options inutiles
        languages: {
          done: 'Valider',
          cancel: 'Annuler',
          crop: 'Recadrer',
        },
      });

      if (!editedUri) {
        setUpdating(false);
        return;
      }

      // --- ÉTAPE 3 : Upload vers Supabase Storage avec suivi de progression ---
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const uploadUrl = `${supabase.supabaseUrl}/storage/v1/object/avatars/${filePath}`;
      const sessionData = await supabase.auth.getSession();
      const token = sessionData.data.session?.access_token;

      if (!token) throw new Error('Session expirée, reconnecte-toi.');

      // ✅ Utilisation de react-native-blob-util pour l'upload avec progression
      const uploadTask = ReactNativeBlobUtil.fetch(
        'POST',
        uploadUrl,
        {
          Authorization: `Bearer ${token}`,
          apikey: supabase.supabaseKey,
          'x-upsert': 'true',
          'Content-Type': 'image/jpeg',
        },
        ReactNativeBlobUtil.wrap(editedUri)
      );

      uploadTask.progress((received, total) => {
        const progress = Math.round((received / total) * 100);
        setUploadProgress(progress);
      });

      const response = await uploadTask;
      if (response.info().status !== 200 && response.info().status !== 205) {
        throw new Error(`Échec de l'envoi (code ${response.info().status})`);
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setAvatarUrl(publicUrl);

      const cachedProfile = await AsyncStorage.getItem('@profile_data');
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile);
        parsed.avatar_url = publicUrl;
        await AsyncStorage.setItem('@profile_data', JSON.stringify(parsed));
      }

      Alert.alert('Succès', 'Photo de profil mise à jour !');
    } catch (err: any) {
      console.error('Erreur Upload:', err);
      Alert.alert("Erreur d'upload", err.message || 'Une erreur est survenue.');
    } finally {
      setUpdating(false);
      setUploadProgress(0);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Déconnexion', 'Êtes-vous sûr de vouloir vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnexion',
        style: 'destructive',
        onPress: async () => {
          try {
            setSignOutLoading(true);
            await AsyncStorage.removeItem('@is_logged_in');
            await AsyncStorage.removeItem('@profile_data');
            if (user) await AsyncStorage.removeItem(`@my_posts_${user.id}`);
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) throw signOutError;
            router.replace('/');
          } catch (err: any) {
            Alert.alert('Erreur', err.message || 'Impossible de se déconnecter.');
          } finally {
            setSignOutLoading(false);
          }
        },
      },
    ]);
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        scrollContent: { flexGrow: 1, padding: 24 },
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
        title: { fontSize: 28, fontWeight: 'bold', color: colors.text, marginBottom: 24 },
        sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 16 },
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
        value: { fontSize: 16, fontWeight: '500', color: colors.text, marginBottom: 16 },
        signOutButton: {
          width: '100%',
          backgroundColor: colors.danger,
          padding: 15,
          borderRadius: 12,
          alignItems: 'center',
        },
        signOutButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
        errorText: { color: colors.danger, marginBottom: 16, textAlign: 'center' },
        avatarContainer: { alignItems: 'center', marginBottom: 24 },
        avatar: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.border,
          marginBottom: 12,
        },
        avatarPlaceholder: {
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: colors.border,
          marginBottom: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
        changePhotoText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
        input: {
          backgroundColor: colors.background,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: 12,
          fontSize: 16,
          marginBottom: 12,
        },
        saveButton: {
          backgroundColor: colors.primary,
          padding: 12,
          borderRadius: 8,
          alignItems: 'center',
        },
        saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
        postItem: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        postThumbnail: {
          width: 50,
          height: 50,
          borderRadius: 8,
          marginRight: 12,
          backgroundColor: colors.border,
        },
        iconThumbnail: {
          width: 50,
          height: 50,
          borderRadius: 8,
          marginRight: 12,
          backgroundColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        },
        postContent: { flex: 1, marginRight: 12 },
        postCaption: {
          fontSize: 14,
          color: colors.text,
          fontWeight: '500',
          marginBottom: 4,
        },
        postDate: { fontSize: 12, color: colors.textSecondary },
        emptyText: {
          color: colors.textSecondary,
          fontStyle: 'italic',
          textAlign: 'center',
          marginTop: 10,
        },
      }),
    [colors]
  );

  if (loading && !fullName) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <ProfileSkeleton colors={colors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {activeView === 'main' && (
          <View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={[styles.avatar, { width: 50, height: 50, marginBottom: 0, marginRight: 16 }]}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { width: 50, height: 50, marginBottom: 0, marginRight: 16 },
                    ]}
                  >
                    <Ionicons name="person" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.title, { marginBottom: 0, fontSize: 22 }]} numberOfLines={1}>
                    {fullName || 'Mon Profil'}
                  </Text>
                  <Text style={{ color: colors.textSecondary }} numberOfLines={1}>
                    {user?.email || cachedEmail}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => setActiveView('settings')}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  backgroundColor: colors.cardBackground,
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: colors.border,
                  justifyContent: 'center',
                  alignItems: 'center',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}
            {error && <Text style={styles.errorText}>{error}</Text>}

            {(userRole === 'admin' || userRole === 'advertiser') && (
              <View style={styles.card}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Mes Publications</Text>
                  <TouchableOpacity
                    onPress={handleRefresh}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    disabled={refreshing || loadingPosts}
                  >
                    <Ionicons
                      name="refresh"
                      size={22}
                      color={refreshing || loadingPosts ? colors.textSecondary : colors.primary}
                    />
                  </TouchableOpacity>
                </View>

                <View
                  style={{
                    backgroundColor: colors.background,
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
                    Annonces publiées ce mois-ci
                  </Text>
                  <View
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                      {currentMonthPostsCount}
                    </Text>
                  </View>
                </View>

                {loadingPosts && myPosts.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : myPosts.length === 0 ? (
                  <Text style={styles.emptyText}>Vous n'avez pas encore publié.</Text>
                ) : (
                  myPosts.map((post) => {
                    const { imageUrl, videoUrl } = extractMediaInfo(post.media_urls);
                    const hasAudio = typeof post.audio_url === 'string' && post.audio_url.length > 0;
                    const defaultCaption = imageUrl
                      ? 'Publication avec image'
                      : videoUrl
                      ? 'Vidéo'
                      : hasAudio
                      ? 'Note vocale'
                      : 'Publication';

                    return (
                      <View key={post.id} style={styles.postItem}>
                        <MediaThumbnail
                          imageUrl={imageUrl}
                          videoUrl={videoUrl}
                          hasAudio={hasAudio}
                          colors={colors}
                          styles={styles}
                        />
                        <View style={styles.postContent}>
                          <Text style={styles.postCaption} numberOfLines={2}>
                            {post.caption || defaultCaption}
                          </Text>
                          <Text style={styles.postDate}>
                            {new Date(post.created_at).toLocaleDateString()}
                          </Text>
                          {hasAudio && (
                            <AudioPostPlayer audioUrl={post.audio_url} colors={colors} />
                          )}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            onPress={() => handleDownloadPost(post)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ marginRight: 16 }}
                            disabled={downloadingPostId === post.id}
                          >
                            {downloadingPostId === post.id ? (
                              <ActivityIndicator size="small" color={colors.primary} />
                            ) : (
                              <Ionicons name="download-outline" size={22} color={colors.primary} />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeletePost(post.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          >
                            <Ionicons name="trash-outline" size={22} color={colors.danger} />
                          </TouchableOpacity>
                        </View>
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
                <TouchableOpacity onPress={handlePickImage} disabled={updating} activeOpacity={0.8}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera" size={32} color={colors.textSecondary} />
                    </View>
                  )}
                  <Text style={styles.changePhotoText}>
                    Prendre / Choisir et retoucher la photo
                  </Text>
                </TouchableOpacity>

                {updating && (
                  <View style={{ width: '100%', marginTop: 12 }}>
                    <View
                      style={{
                        height: 6,
                        backgroundColor: colors.border,
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${uploadProgress}%`,
                          height: '100%',
                          backgroundColor: colors.primary,
                        }}
                      />
                    </View>
                    <Text
                      style={{
                        textAlign: 'center',
                        fontSize: 12,
                        color: colors.textSecondary,
                        marginTop: 4,
                      }}
                    >
                      Envoi en cours : {uploadProgress}%
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.label}>Nom d'utilisateur</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Votre nom"
                placeholderTextColor={colors.textSecondary}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateName}
                disabled={updating}
              >
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
              <Text style={styles.value}>{user?.email || cachedEmail || 'Non renseigné'}</Text>
            </View>

            <View style={styles.card}>
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










