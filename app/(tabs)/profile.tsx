










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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator'; // <-- NOUVEAU: Remplace react-native-compressor
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
// NOUVEAU: Import des API modernes d'Expo Audio (remplace expo-av)
import { useAudioPlayer, useAudioRecorder } from 'expo-audio'; 

import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { decode } from 'base64-arraybuffer';
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
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(url.split('?')[0]);
};

const isVideoUrl = (url: string) => {
  if (typeof url !== 'string') return false;
  return /\.(mp4|mov|m4v|webm)$/i.test(url.split('?')[0]);
};

const extractMediaInfo = (mediaData: any) => {
  if (!mediaData) return { imageUrl: null, videoUrl: null };
  let urls: string[] = Array.isArray(mediaData) ? mediaData : [mediaData];
  const imageUrl = urls.find(url => isImageUrl(url)) || null;
  const videoUrl = urls.find(url => isVideoUrl(url)) || null;
  return { imageUrl, videoUrl };
};

// --- COMPOSANT: LECTEUR AUDIO APERÇU (Avant envoi) ---
const AudioPreviewPlayer = ({ uri, colors }: { uri: string, colors: any }) => {
  const player = useAudioPlayer(uri);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border, padding: 12, borderRadius: 12, flex: 1 }}>
      <TouchableOpacity 
        onPress={() => player.playing ? player.pause() : player.play()}
        style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}
      >
        <Ionicons name={player.playing ? "pause" : "play"} size={24} color="#FFF" />
      </TouchableOpacity>
      <View>
        <Text style={{ color: colors.text, fontWeight: 'bold' }}>Note vocale enregistrée</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{player.playing ? "Lecture en cours..." : "Prêt à être envoyé"}</Text>
      </View>
    </View>
  );
};

// --- COMPOSANT: MINIATURE MÉDIA (Posts du Profil) ---
const MediaThumbnail = memo(({ imageUrl, videoUrl, audioUrl, colors, styles }: any) => {
  const [videoThumb, setVideoThumb] = useState<string | null>(null);
  
  // Utilisation du nouveau hook expo-audio pour lire depuis une URL
  const player = audioUrl ? useAudioPlayer(audioUrl) : null;

  useEffect(() => {
    if (videoUrl && !imageUrl) {
      VideoThumbnails.getThumbnailAsync(videoUrl, { time: 1000 })
        .then(({ uri }) => setVideoThumb(uri))
        .catch(console.warn);
    }
  }, [videoUrl, imageUrl]);

  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} style={styles.postThumbnail} resizeMode="cover" />;
  }

  if (videoUrl) {
    return (
      <View style={styles.postThumbnail}>
        {videoThumb ? (
          <Image source={{ uri: videoThumb }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
        ) : (
          <View style={[styles.iconThumbnail, { width: '100%', height: '100%' }]}>
             <Ionicons name="videocam" size={20} color={colors.primary} />
          </View>
        )}
      </View>
    );
  }

  if (audioUrl && player) {
    return (
      <TouchableOpacity 
        style={styles.iconThumbnail} 
        onPress={() => player.playing ? player.pause() : player.play()}
      >
        <Ionicons name={player.playing ? "pause" : "play"} size={24} color={colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.iconThumbnail}>
      <Ionicons name="document-text-outline" size={24} color={colors.textSecondary} />
    </View>
  );
});

export default function Profile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();

  const [activeView, setActiveView] = useState<ViewMode>('main');
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false); 

  // --- ÉTATS POUR LA CRÉATION DE POST (Audio/Photo) ---
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postMediaType, setPostMediaType] = useState<'image'|'video'|'audio'|null>(null);
  const [postMediaUri, setPostMediaUri] = useState<string | null>(null);
  const [postCaption, setPostCaption] = useState('');
  
  // Hook d'enregistrement audio natif expo-audio
  const [recorder, recorderState] = useAudioRecorder();

  useEffect(() => {
    const backAction = () => {
      if (isCreatingPost) { setIsCreatingPost(false); return true; }
      if (activeView === 'settings') { setActiveView('main'); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [activeView, isCreatingPost]);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (data) {
          setFullName(data.full_name || '');
          setAvatarUrl(data.avatar_url || '');
          setUserRole(data.role || 'user');
        }
        fetchMyPosts(session.user.id);
      }
      setLoading(false);
    };
    initData();
  }, []);

  const fetchMyPosts = async (userId: string) => {
    const { data } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (data) setMyPosts(data);
  };

  // --- GESTION PHOTO DE PROFIL (Caméra / Galerie + Compression native) ---
  const handlePickAvatar = () => {
    Alert.alert("Photo de profil", "Choisissez une source", [
      { text: "Caméra", onPress: () => openMediaPicker(true, true) },
      { text: "Galerie", onPress: () => openMediaPicker(false, true) },
      { text: "Annuler", style: "cancel" },
    ]);
  };

  const openMediaPicker = async (useCamera: boolean, isAvatar: boolean = false) => {
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    };

    let result;
    if (useCamera) {
      await ImagePicker.requestCameraPermissionsAsync();
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (isAvatar) processAndUploadAvatar(uri);
      else {
        setPostMediaUri(uri);
        setPostMediaType('image');
      }
    }
  };

  // Compression native avec expo-image-manipulator (remplace react-native-compressor)
  const processAndUploadAvatar = async (originalUri: string) => {
    if (!user) return;
    try {
      setUpdating(true); setUploadProgress(20);
      
      const manipResult = await ImageManipulator.manipulateAsync(
        originalUri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      setUploadProgress(50);

      const base64 = await FileSystem.readAsStringAsync(manipResult.uri, { encoding: 'base64' });
      setUploadProgress(70);

      const filePath = `${user.id}/avatar_${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(filePath, decode(base64), { contentType: 'image/jpeg' });
      if (error) throw error;
      setUploadProgress(90);

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      
      setAvatarUrl(publicUrl);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      Alert.alert("Erreur", "Impossible de mettre à jour la photo.");
      setUploadProgress(0);
    } finally {
      setUpdating(false);
    }
  };

  // --- LOGIQUE D'ENREGISTREMENT AUDIO (Pour les posts) ---
  const toggleRecording = async () => {
    try {
      if (recorderState.isRecording) {
        await recorder.stopAndUnloadAsync();
        setPostMediaUri(recorder.uri);
        setPostMediaType('audio');
      } else {
        // Nettoie l'ancien enregistrement si existant
        if (postMediaUri) setPostMediaUri(null); 
        await recorder.recordAsync();
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erreur", "Impossible d'accéder au microphone.");
    }
  };

  // --- PUBLIER LE POST (Audio, Image ou Vidéo) ---
  const handlePublishPost = async () => {
    if (!user || (!postMediaUri && !postCaption)) return;
    try {
      setUpdating(true); setUploadProgress(10);
      let publicUrl = null;

      // Simulation de progression UX
      const interval = setInterval(() => setUploadProgress(p => (p < 85 ? p + 15 : p)), 400);

      if (postMediaUri) {
        let uriToUpload = postMediaUri;
        let contentType = postMediaType === 'audio' ? 'audio/m4a' : 'image/jpeg';
        let bucket = postMediaType === 'audio' ? 'audios' : 'posts';

        if (postMediaType === 'image') {
          const manip = await ImageManipulator.manipulateAsync(uriToUpload, [{ resize: { width: 1080 } }], { compress: 0.8 });
          uriToUpload = manip.uri;
        }

        const base64 = await FileSystem.readAsStringAsync(uriToUpload, { encoding: 'base64' });
        const filePath = `${user.id}/${Date.now()}.${postMediaType === 'audio' ? 'm4a' : 'jpg'}`;
        
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, decode(base64), { contentType });
        if (uploadError) throw uploadError;

        publicUrl = supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
      }

      clearInterval(interval);
      setUploadProgress(90);

      const postData = {
        user_id: user.id,
        caption: postCaption,
        media_urls: postMediaType === 'image' ? [publicUrl] : null,
        audio_url: postMediaType === 'audio' ? publicUrl : null,
      };

      const { error } = await supabase.from('posts').insert([postData]);
      if (error) throw error;

      setUploadProgress(100);
      Alert.alert("Succès", "Publication envoyée !");
      setIsCreatingPost(false);
      fetchMyPosts(user.id);

      // Réinitialisation
      setPostMediaUri(null); setPostMediaType(null); setPostCaption(''); setTimeout(() => setUploadProgress(0), 500);
    } catch (err) {
      Alert.alert("Erreur", "Échec de la publication.");
    } finally {
      setUpdating(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { flexGrow: 1, padding: 24 },
    title: { fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
    card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
    avatarContainer: { alignItems: 'center', marginBottom: 24 },
    avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.border },
    progressBarContainer: { width: '100%', height: 6, backgroundColor: colors.border, borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: colors.primary },
    postItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    postThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12 },
    iconThumbnail: { width: 50, height: 50, borderRadius: 8, marginRight: 12, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' },
    fab: { position: 'absolute', bottom: 24, right: 24, backgroundColor: colors.primary, width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 },
    modalContainer: { flex: 1, backgroundColor: colors.background, padding: 24, paddingTop: 60 },
  }), [colors]);

  if (loading) return <SafeAreaView style={styles.container}><ActivityIndicator style={{marginTop: 50}} color={colors.primary} size="large" /></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* --- VUE PRINCIPALE --- */}
        {activeView === 'main' && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <TouchableOpacity onPress={handlePickAvatar}>
                  <Image source={{ uri: avatarUrl || 'https://via.placeholder.com/100' }} style={[styles.avatar, { width: 50, height: 50, marginRight: 16 }]} />
                </TouchableOpacity>
                <View>
                  <Text style={styles.title}>{fullName || 'Mon Profil'}</Text>
                  <Text style={{ color: colors.textSecondary }}>{user?.email}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setActiveView('settings')}>
                <Ionicons name="settings-outline" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {uploadProgress > 0 && !isCreatingPost && (
              <View style={[styles.progressBarContainer, { marginBottom: 20 }]}>
                <Animated.View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
              </View>
            )}

            <View style={styles.card}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Mes publications</Text>
              {myPosts.length === 0 ? (
                <Text style={{ color: colors.textSecondary, fontStyle: 'italic' }}>Aucune publication.</Text>
              ) : (
                myPosts.map(post => (
                  <View key={post.id} style={styles.postItem}>
                    <MediaThumbnail 
                      imageUrl={extractMediaInfo(post.media_urls).imageUrl} 
                      videoUrl={extractMediaInfo(post.media_urls).videoUrl} 
                      audioUrl={post.audio_url} 
                      colors={colors} styles={styles} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '500' }}>{post.caption || "Publication"}</Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{new Date(post.created_at).toLocaleDateString()}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

      </ScrollView>

      {/* --- BOUTON FLOTTANT POUR CRÉER UN POST --- */}
      {activeView === 'main' && (userRole === 'admin' || userRole === 'advertiser') && (
        <TouchableOpacity style={styles.fab} onPress={() => setIsCreatingPost(true)}>
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {/* --- MODAL DE CRÉATION DE POST (Audio, Photo avec Prévisualisation) --- */}
      <Modal visible={isCreatingPost} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <Text style={styles.title}>Créer une publication</Text>
            <TouchableOpacity onPress={() => setIsCreatingPost(false)}>
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            placeholder="Que voulez-vous partager ?"
            placeholderTextColor={colors.textSecondary}
            style={{ backgroundColor: colors.cardBackground, color: colors.text, padding: 16, borderRadius: 12, minHeight: 100, textAlignVertical: 'top', marginBottom: 20 }}
            multiline
            value={postCaption}
            onChangeText={setPostCaption}
          />

          {/* Affichage de l'aperçu si un média est choisi */}
          {postMediaUri && (
            <View style={{ marginBottom: 20, position: 'relative' }}>
              {postMediaType === 'image' && <Image source={{ uri: postMediaUri }} style={{ width: '100%', height: 200, borderRadius: 12 }} />}
              {postMediaType === 'audio' && <AudioPreviewPlayer uri={postMediaUri} colors={colors} />}
              
              <TouchableOpacity 
                style={{ position: 'absolute', top: -10, right: -10, backgroundColor: colors.danger, borderRadius: 15, padding: 4 }}
                onPress={() => { setPostMediaUri(null); setPostMediaType(null); }}
              >
                <Ionicons name="trash" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* Boutons d'actions média */}
          {!postMediaUri && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 }}>
              <TouchableOpacity onPress={() => openMediaPicker(true)} style={{ alignItems: 'center' }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.cardBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="camera" size={28} color={colors.primary} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Caméra</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => openMediaPicker(false)} style={{ alignItems: 'center' }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.cardBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="image" size={28} color={colors.primary} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Galerie</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={toggleRecording} style={{ alignItems: 'center' }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: recorderState.isRecording ? '#FFEbee' : colors.cardBackground, justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name={recorderState.isRecording ? "stop" : "mic"} size={28} color={recorderState.isRecording ? colors.danger : colors.primary} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  {recorderState.isRecording ? "Stop..." : "Vocal"}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Barre de progression pendant l'upload */}
          {updating && (
            <View style={styles.progressBarContainer}>
              <Animated.View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
            </View>
          )}

          {/* Bouton Publier */}
          <TouchableOpacity 
            style={{ backgroundColor: colors.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 'auto', marginBottom: 40 }}
            onPress={handlePublishPost}
            disabled={updating || (!postMediaUri && !postCaption)}
          >
            {updating ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>Publier</Text>}
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
}










































