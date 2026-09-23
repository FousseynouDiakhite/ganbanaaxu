







/*

import React, { useState, useEffect, useMemo } from 'react';
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
      {/* Skeleton En-tête (Photo + Infos + Engrenage) */}
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

      {/* Skeleton de la section Publications / Admin */}
      <Animated.View style={{ width: '100%', backgroundColor: colors.skeletonBase, borderRadius: 16, padding: 20, marginBottom: 20, opacity: fadeAnim }}>
        <View style={{ height: 18, width: '40%', backgroundColor: colors.background, borderRadius: 4, marginBottom: 24 }} />
        
        {/* Simulation de 3 lignes pour représenter des posts */}
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

        {/* --- VUE PRINCIPALE DU PROFIL --- */}
        {activeView === 'main' && (
          <View>

            {/* En-tête du profil (Photo, Nom/Email et Icône Engrenage tout à droite) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              
              {/* Informations utilisateur à gauche */}
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

              {/* Bouton Icône Engrenage uniquement à droite */}
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

            {/* Vues spécifiques aux rôles (Admin/Advertiser) */}
            {userRole === 'admin' && <AdminView />}
            {userRole === 'advertiser' && <AdvertiserView />}

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Section des publications (Affichée uniquement pour admin/advertiser) */}
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

        {/* --- VUE DES PARAMÈTRES --- */}
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