



/*
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme,
  Alert,
  Share,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { supabase } from '../../lib/supabase'; 

const { width } = Dimensions.get('window');

// Configuration du comportement des notifications quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ====================================================================
// 1. STYLES
// ====================================================================
const getFeedStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    card: { backgroundColor: isDark ? '#1E1E1E' : '#FFF', marginBottom: 12, borderRadius: 12, paddingVertical: 12, marginHorizontal: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    mediaContainer: { width: '100%', height: 350, backgroundColor: 'transparent', justifyContent: 'center', position: 'relative' },
    mediaPreview: { width: width - 20, height: 350, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', borderRadius: 8, overflow: 'hidden' },
    media: { width: '100%', height: '100%', borderRadius: 8 },
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF' },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
  });
};

// ====================================================================
// 2. EXTRACTION DES MÉDIAS
// ====================================================================
const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http') && url.length > 15);
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const MediaRenderer = React.memo(({ url, styles, onMediaError }: { url: string, styles: any, onMediaError: (url: string) => void }) => {
  const isVideo = url.match(/\.(mp4|mov|mkv)$/i);
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <View style={styles.mediaPreview}>
      {isVideo ? (
        <Video source={{ uri: url }} style={styles.media} useNativeControls resizeMode={ResizeMode.COVER} isLooping onError={() => onMediaError(url)} />
      ) : (
        <>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setIsFullScreen(true)}>
            <Image source={{ uri: url }} style={styles.media} resizeMode="cover" onError={() => onMediaError(url)} />
          </TouchableOpacity>
          <Modal
            visible={isFullScreen}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsFullScreen(false)} // *** AJOUT ICI POUR LE RETOUR TÉLÉPHONE ***
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
              <TouchableOpacity style={{ position: 'absolute', top: 50, right: 20, zIndex: 2, padding: 10 }} onPress={() => setIsFullScreen(false)}>
                <Ionicons name="close-circle" size={36} color="#FFF" />
              </TouchableOpacity>
              <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
            </View>
          </Modal>
        </>
      )}
    </View>
  );
});

// ====================================================================
// 3. COMPOSANT CARTE 
// ====================================================================
const PostCard = React.memo(({ item, isDark, currentUserId, onDeleteSuccess }: { item: any, isDark: boolean, currentUserId: string | null, onDeleteSuccess: (id: string) => void }) => {
  const styles = getFeedStyles(isDark ? 'dark' : 'light');
  
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const mediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const [validMedias, setValidMedias] = useState(mediasArray);

  useEffect(() => { setValidMedias(mediasArray); }, [mediasArray]);
  const handleMediaError = useCallback((failedUrl: string) => { setValidMedias(prev => prev.filter(url => url !== failedUrl)); }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  // PARTAGE TEXTUEL SIMPLE
  const handleShare = async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.tonnom.ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";

      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur l'application Ganbanaaxu pour découvrir de nouvelles publications !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
        
      await Share.share({ message: shareMessage });
    } catch (error: any) {
      console.error("Erreur de partage :", error.message);
    }
  };

  const handleDeletePost = () => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer cette publication ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
            onDeleteSuccess(item.id);
          } catch (error: any) {
            Alert.alert("Erreur", "Impossible de supprimer la publication.");
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  const handlePlayAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); } 
        else { await sound.playAsync(); setIsPlaying(true); }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: item.audio_url }, { shouldPlay: true });
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) { setIsPlaying(false); newSound.setPositionAsync(0); }
        });
      }
    } catch (error) {
      console.error("Erreur lecture audio", error);
    }
  };

  useEffect(() => { return sound ? () => { sound.unloadAsync(); } : undefined; }, [sound]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.usernameText}>{userName}</Text>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={validMedias}
            renderItem={({ item: url }) => <MediaRenderer url={url} styles={styles} onMediaError={handleMediaError} />}
            keyExtractor={(media, index) => index.toString()}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}

      {hasValidAudio && (
        <View style={styles.audioCommentary}>
          <TouchableOpacity style={styles.playButtonCommentary} onPress={handlePlayAudio}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
          </TouchableOpacity>
          <View style={styles.audioInfo}>
            <Text style={styles.audioText}>Commentaire vocal</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: isPlaying ? '100%' : '0%' }]} /> 
            </View>
          </View>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={isDark ? '#FFF' : '#333'} />
            <Text style={styles.interactionText}>Partager</Text>
          </TouchableOpacity>
        </View>
        {isOwner && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <><Ionicons name="trash-outline" size={18} color="#FF3B30" /><Text style={styles.deleteText}>Supprimer</Text></>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ====================================================================
// 4. ÉCRAN PRINCIPAL AVEC GESTION DES NOTIFICATIONS
// ====================================================================
export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getFeedStyles(colorScheme);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndPosts();
    registerForPushNotificationsAsync();
  }, []);





const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      Alert.alert("Test", "Les notifications ne marchent que sur un vrai téléphone, pas un simulateur.");
      return; 
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert("Permission", "Vous avez refusé les notifications.");
      return;
    }
    try {
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  
  const { data: { session } } = await supabase.auth.getSession();
  
  await supabase.from('push_tokens').upsert({
    user_id: session?.user?.id || null,
    token: pushToken
  }, { onConflict: 'token' });
} catch (error) {
  console.log("Erreur silencieuse push token :", error);
}
    
  };





  const fetchUserAndPosts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUserId(session.user.id);

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchUserAndPosts(); }, []);
  const removePostFromList = useCallback((deletedPostId: string) => { setPosts((currentPosts) => currentPosts.filter(post => post.id !== deletedPostId)); }, []);

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
      <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerLoading]}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <PostCard item={item} isDark={isDark} currentUserId={currentUserId} onDeleteSuccess={removePostFromList} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={5} maxToRenderPerBatch={5} windowSize={21} removeClippedSubviews={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} tintColor={isDark ? '#FFF' : '#6200EE'} />}
        />
      </View>
    </SafeAreaView>
  );
}
*/









































/*
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme,
  Alert,
  Share,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
  ViewToken
} from 'react-native';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');

// Configuration du comportement des notifications quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ====================================================================
// 1. STYLES (Mis à jour pour le Modal Galerie)
// ====================================================================
const getFeedStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    card: { backgroundColor: isDark ? '#1E1E1E' : '#FFF', marginBottom: 12, borderRadius: 12, paddingVertical: 12, marginHorizontal: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    mediaContainer: { width: '100%', height: 350, backgroundColor: 'transparent', justifyContent: 'center', position: 'relative' },
    mediaPreviewContainer: { width: width - 20, height: 350, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', borderRadius: 8, overflow: 'hidden', marginRight: 10 },
    media: { width: '100%', height: '100%', borderRadius: 8 },
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF' },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    
    // Nouveaux styles pour le Modal Galerie
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    modalHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    modalHeaderText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
  });
};

// ====================================================================
// 2. EXTRACTION DES MÉDIAS
// ====================================================================
const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http') && url.length > 15);
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const isVideoUrl = (url: string) => {
  return url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);
};

// ====================================================================
// 3. COMPOSANT RENDERER (Preview dans la carte) - Modifié
// ====================================================================
const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: { url: string, index: number, styles: any, onMediaError: (url: string) => void, onPress: (index: number) => void }) => {
  const isVideo = isVideoUrl(url);

  return (
    <TouchableOpacity 
      style={styles.mediaPreviewContainer} 
      activeOpacity={0.9} 
      onPress={() => onPress(index)}
    >
      {isVideo ? (
        <View style={styles.media}>
          <Video 
            source={{ uri: url }} 
            style={StyleSheet.absoluteFill} 
            resizeMode={ResizeMode.COVER} 
            isLooping 
            isMuted
            shouldPlay={false} // Ne pas jouer automatiquement dans le feed
            onError={() => onMediaError(url)} 
          />
          <View style={[StyleSheet.absoluteFill, {justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)'}]}>
            <Ionicons name="play-circle" size={50} color="#FFF" />
          </View>
        </View>
      ) : (
        <Image 
          source={{ uri: url }} 
          style={styles.media} 
          resizeMode="cover" 
          onError={() => onMediaError(url)} 
        />
      )}
    </TouchableOpacity>
  );
});

// ====================================================================
// 4. COMPOSANT CARTE (Gère le Modal désormais) - Modifié
// ====================================================================
const PostCard = React.memo(({ item, isDark, currentUserId, onDeleteSuccess }: { item: any, isDark: boolean, currentUserId: string | null, onDeleteSuccess: (id: string) => void }) => {
  const styles = getFeedStyles(isDark ? 'dark' : 'light');
  
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour le Modal Galerie
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialModalIndex, setInitialModalIndex] = useState(0);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const fullScreenListRef = useRef<FlatList>(null);

  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const mediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const [validMedias, setValidMedias] = useState(mediasArray);

  useEffect(() => { setValidMedias(mediasArray); }, [mediasArray]);
  const handleMediaError = useCallback((failedUrl: string) => { setValidMedias(prev => prev.filter(url => url !== failedUrl)); }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  // Ouvrir le modal à un index spécifique
  const openGalleryModal = useCallback((index: number) => {
    setInitialModalIndex(index);
    setCurrentModalIndex(index);
    setIsModalVisible(true);
  }, []);

  // Gérer le changement d'index lors du swipe dans le modal
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentModalIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50 // Considérer l'item visible s'il l'est à 50%
  }).current;


  // PARTAGE TEXTUEL SIMPLE
  const handleShare = async () => {
    try {
      // Remplacez par vos vrais liens
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.tonnom.ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";

      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur l'application Ganbanaaxu pour découvrir de nouvelles publications !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
        
      await Share.share({ message: shareMessage });
    } catch (error: any) {
      console.error("Erreur de partage :", error.message);
    }
  };

  const handleDeletePost = () => {
    Alert.alert("Supprimer", "Voulez-vous vraiment supprimer cette publication ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
            onDeleteSuccess(item.id);
          } catch (error: any) {
            Alert.alert("Erreur", "Impossible de supprimer la publication.");
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  const handlePlayAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); } 
        else { await sound.playAsync(); setIsPlaying(true); }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: item.audio_url }, { shouldPlay: true });
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) { setIsPlaying(false); newSound.setPositionAsync(0); }
        });
      }
    } catch (error) {
      console.error("Erreur lecture audio", error);
    }
  };

  useEffect(() => { return sound ? () => { sound.unloadAsync(); } : undefined; }, [sound]);

  // Rendu d'un média en plein écran dans le modal
  const renderFullScreenMedia = ({ item: url }: { item: string }) => {
    const isVideo = isVideoUrl(url);
    return (
      <View style={styles.fullScreenMediaWrapper}>
        {isVideo ? (
          <Video
            source={{ uri: url }}
            style={styles.fullScreenMedia}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay={isModalVisible} // Jouer si le modal est visible
            isLooping
          />
        ) : (
          <Image 
            source={{ uri: url }} 
            style={styles.fullScreenMedia} 
            resizeMode="contain" 
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.usernameText}>{userName}</Text>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={validMedias}
            renderItem={({ item: url, index }) => (
              <MediaRenderer 
                url={url} 
                index={index}
                styles={styles} 
                onMediaError={handleMediaError} 
                onPress={openGalleryModal}
              />
            )}
            keyExtractor={(media, index) => `${item.id}-preview-${index}`}
            horizontal 
            pagingEnabled={false} // Désactivé ici pour voir qu'il y a une suite
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            snapToInterval={width - 20 + 10} // Largeur preview + marginRight
            decelerationRate="fast"
          />
        </View>
      )}

      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}

      {hasValidAudio && (
        <View style={styles.audioCommentary}>
          <TouchableOpacity style={styles.playButtonCommentary} onPress={handlePlayAudio}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
          </TouchableOpacity>
          <View style={styles.audioInfo}>
            <Text style={styles.audioText}>Commentaire vocal</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: isPlaying ? '100%' : '0%' }]} /> 
            </View>
          </View>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={isDark ? '#FFF' : '#333'} />
            <Text style={styles.interactionText}>Partager</Text>
          </TouchableOpacity>
        </View>
        {isOwner && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <><Ionicons name="trash-outline" size={18} color="#FF3B30" /><Text style={styles.deleteText}>Supprimer</Text></>}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
         
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>

          {validMedias.length > 1 && (
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>
                {currentModalIndex + 1} / {validMedias.length}
              </Text>
            </View>
          )}

          <FlatList
            ref={fullScreenListRef}
            data={validMedias}
            renderItem={renderFullScreenMedia}
            keyExtractor={(media, index) => `${item.id}-full-${index}`}
            horizontal
            pagingEnabled // Active le swipe page par page
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialModalIndex}
            getItemLayout={(data, index) => (
              { length: width, offset: width * index, index }
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            // Optimisations
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
        </View>
      </Modal>
    </View>
  );
});

// ====================================================================
// 5. ÉCRAN PRINCIPAL AVEC GESTION DES NOTIFICATIONS (Inchangé)
// ====================================================================
export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getFeedStyles(colorScheme);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUserAndPosts();
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      // Alert.alert("Test", "Les notifications ne marchent que sur un vrai téléphone, pas un simulateur.");
      return; 
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      // Alert.alert("Permission", "Vous avez refusé les notifications.");
      return;
    }
    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await supabase.from('push_tokens').upsert({
          user_id: session.user.id,
          token: pushToken
        }, { onConflict: 'token' });
      }
    } catch (error) {
      console.log("Erreur silencieuse push token :", error);
    }
  };

  const fetchUserAndPosts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setCurrentUserId(session.user.id);

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchUserAndPosts(); }, []);
  const removePostFromList = useCallback((deletedPostId: string) => { setPosts((currentPosts) => currentPosts.filter(post => post.id !== deletedPostId)); }, []);

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
      <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerLoading]}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <PostCard item={item} isDark={isDark} currentUserId={currentUserId} onDeleteSuccess={removePostFromList} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyComponent}
          // Optimisations FlatList
          initialNumToRender={3} 
          maxToRenderPerBatch={3} 
          windowSize={5} 
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} tintColor={isDark ? '#FFF' : '#6200EE'} />}
        />
      </View>
    </SafeAreaView>
  );
}
*/















/*
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme,
  Alert,
  Share,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
  ViewToken
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');

// Configuration du comportement des notifications quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ====================================================================
// 1. STYLES
// ====================================================================
const getFeedStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    card: { backgroundColor: isDark ? '#1E1E1E' : '#FFF', marginBottom: 12, borderRadius: 12, paddingVertical: 12, marginHorizontal: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    mediaContainer: { width: '100%', height: 350, backgroundColor: 'transparent', justifyContent: 'center', position: 'relative' },
    mediaPreviewContainer: { width: width - 20, height: 350, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', borderRadius: 8, overflow: 'hidden', marginRight: 10 },
    media: { width: '100%', height: '100%', borderRadius: 8 },
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF' },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    
    // Nouveaux styles pour le Modal Galerie
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    modalHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    modalHeaderText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
  });
};

// ====================================================================
// 2. EXTRACTION DES MÉDIAS
// ====================================================================
const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http') && url.length > 15);
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const isVideoUrl = (url: string) => {
  return url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);
};

// ====================================================================
// 3. COMPOSANT RENDERER
// ====================================================================
const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: { url: string, index: number, styles: any, onMediaError: (url: string) => void, onPress: (index: number) => void }) => {
  const isVideo = isVideoUrl(url);

  return (
    <TouchableOpacity 
      style={styles.mediaPreviewContainer} 
      activeOpacity={0.9} 
      onPress={() => onPress(index)}
    >
      {isVideo ? (
        <View style={styles.media}>
          <Video 
            source={{ uri: url }} 
            style={StyleSheet.absoluteFill} 
            resizeMode={ResizeMode.COVER} 
            isLooping 
            isMuted
            shouldPlay={false}
            onError={() => onMediaError(url)} 
          />
          <View style={[StyleSheet.absoluteFill, {justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)'}]}>
            <Ionicons name="play-circle" size={50} color="#FFF" />
          </View>
        </View>
      ) : (
        <Image 
          source={{ uri: url }} 
          style={styles.media} 
          resizeMode="cover" 
          onError={() => onMediaError(url)} 
        />
      )}
    </TouchableOpacity>
  );
});

// ====================================================================
// 4. COMPOSANT CARTE 
// ====================================================================
const PostCard = React.memo(({ item, isDark, currentUserId, isSuperuser, onDeleteSuccess }: { item: any, isDark: boolean, currentUserId: string | null, isSuperuser: boolean, onDeleteSuccess: (id: string) => void }) => {
  const styles = getFeedStyles(isDark ? 'dark' : 'light');
  
  const [sound, setSound] = useState<Audio.Sound | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour le Modal Galerie
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialModalIndex, setInitialModalIndex] = useState(0);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const fullScreenListRef = useRef<FlatList>(null);

  // LOGIQUE MODIFIÉE ICI : On vérifie si l'utilisateur est le créateur OU un super-utilisateur
  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const mediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const [validMedias, setValidMedias] = useState(mediasArray);

  useEffect(() => { setValidMedias(mediasArray); }, [mediasArray]);
  const handleMediaError = useCallback((failedUrl: string) => { setValidMedias(prev => prev.filter(url => url !== failedUrl)); }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const openGalleryModal = useCallback((index: number) => {
    setInitialModalIndex(index);
    setCurrentModalIndex(index);
    setIsModalVisible(true);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentModalIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const handleShare = async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.tonnom.ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";

      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur l'application Ganbanaaxu pour découvrir de nouvelles publications !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
        
      await Share.share({ message: shareMessage });
    } catch (error: any) {
      console.error("Erreur de partage :", error.message);
    }
  };

  const handleDeletePost = () => {
    // Alerte dynamique selon le rôle
    const title = isOwner ? "Supprimer la publication" : "Action Modérateur";
    const message = isOwner 
      ? "Voulez-vous vraiment supprimer cette publication ?" 
      : "En tant que super-utilisateur, voulez-vous supprimer cette publication ?";

    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
            onDeleteSuccess(item.id);
          } catch (error: any) {
            Alert.alert("Erreur", "Impossible de supprimer la publication.");
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  const handlePlayAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) { await sound.pauseAsync(); setIsPlaying(false); } 
        else { await sound.playAsync(); setIsPlaying(true); }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: item.audio_url }, { shouldPlay: true });
        setSound(newSound);
        setIsPlaying(true);
        newSound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) { setIsPlaying(false); newSound.setPositionAsync(0); }
        });
      }
    } catch (error) {
      console.error("Erreur lecture audio", error);
    }
  };

  useEffect(() => { return sound ? () => { sound.unloadAsync(); } : undefined; }, [sound]);

  const renderFullScreenMedia = ({ item: url }: { item: string }) => {
    const isVideo = isVideoUrl(url);
    return (
      <View style={styles.fullScreenMediaWrapper}>
        {isVideo ? (
          <Video
            source={{ uri: url }}
            style={styles.fullScreenMedia}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay={isModalVisible}
            isLooping
          />
        ) : (
          <Image 
            source={{ uri: url }} 
            style={styles.fullScreenMedia} 
            resizeMode="contain" 
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.usernameText}>{userName}</Text>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={validMedias}
            renderItem={({ item: url, index }) => (
              <MediaRenderer 
                url={url} 
                index={index}
                styles={styles} 
                onMediaError={handleMediaError} 
                onPress={openGalleryModal}
              />
            )}
            keyExtractor={(media, index) => `${item.id}-preview-${index}`}
            horizontal 
            pagingEnabled={false} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            snapToInterval={width - 20 + 10} 
            decelerationRate="fast"
          />
        </View>
      )}

      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}

      {hasValidAudio && (
        <View style={styles.audioCommentary}>
          <TouchableOpacity style={styles.playButtonCommentary} onPress={handlePlayAudio}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
          </TouchableOpacity>
          <View style={styles.audioInfo}>
            <Text style={styles.audioText}>Commentaire vocal</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: isPlaying ? '100%' : '0%' }]} /> 
            </View>
          </View>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={isDark ? '#FFF' : '#333'} />
            <Text style={styles.interactionText}>Partager</Text>
          </TouchableOpacity>
        </View>
        
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <><Ionicons name="trash-outline" size={18} color="#FF3B30" /><Text style={styles.deleteText}>Supprimer</Text></>}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>

          {validMedias.length > 1 && (
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>
                {currentModalIndex + 1} / {validMedias.length}
              </Text>
            </View>
          )}

          <FlatList
            ref={fullScreenListRef}
            data={validMedias}
            renderItem={renderFullScreenMedia}
            keyExtractor={(media, index) => `${item.id}-full-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialModalIndex}
            getItemLayout={(data, index) => (
              { length: width, offset: width * index, index }
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
        </View>
      </Modal>
    </View>
  );
});

// ====================================================================
// 5. ÉCRAN PRINCIPAL AVEC GESTION DES NOTIFICATIONS
// ====================================================================
export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getFeedStyles(colorScheme);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // NOUVEL ÉTAT POUR LE SUPER-UTILISATEUR
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    fetchUserAndPosts();
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) return; 
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') return;

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await supabase.from('push_tokens').upsert({
          user_id: session.user.id,
          token: pushToken
        }, { onConflict: 'token' });
      }
    } catch (error) {
      console.log("Erreur silencieuse push token :", error);
    }
  };


const fetchUserAndPosts = async () => {
    try {
      // 1. CHARGEMENT DU CACHE (Affichage immédiat)
      const cachedPosts = await AsyncStorage.getItem('ganbanaaxu_feed_cache');
      if (cachedPosts) {
        setPosts(JSON.parse(cachedPosts));
        setLoading(false); // On enlève le loading vu qu'on a des données
      }

      // 2. RÉCUPÉRATION DE L'UTILISATEUR
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_superuser')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.is_superuser) {
          setIsSuperuser(true);
        }
      }

      // 3. RÉCUPÉRATION DES NOUVELLES DONNÉES SUR SUPABASE
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 4. MISE À JOUR DE L'UI ET DU CACHE
      if (data) {
        setPosts(data);
        await AsyncStorage.setItem('ganbanaaxu_feed_cache', JSON.stringify(data));
      }
      
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };




  

  const onRefresh = useCallback(() => { setRefreshing(true); fetchUserAndPosts(); }, []);
  const removePostFromList = useCallback((deletedPostId: string) => { setPosts((currentPosts) => currentPosts.filter(post => post.id !== deletedPostId)); }, []);

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
      <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerLoading]}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          // MODIFICATION ICI : On passe isSuperuser à PostCard
          renderItem={({ item }) => <PostCard item={item} isDark={isDark} currentUserId={currentUserId} isSuperuser={isSuperuser} onDeleteSuccess={removePostFromList} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={3} 
          maxToRenderPerBatch={3} 
          windowSize={5} 
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} tintColor={isDark ? '#FFF' : '#6200EE'} />}
        />
      </View>
    </SafeAreaView>
  );
}
*/























/*

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme,
  Alert,
  Share,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
  ViewToken
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');

// Configuration du comportement des notifications quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ====================================================================
// 1. STYLES
// ====================================================================
const getFeedStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    card: { backgroundColor: isDark ? '#1E1E1E' : '#FFF', marginBottom: 12, borderRadius: 12, paddingVertical: 12, marginHorizontal: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    mediaContainer: { width: '100%', height: 350, backgroundColor: 'transparent', justifyContent: 'center', position: 'relative' },
    mediaPreviewContainer: { width: width - 20, height: 350, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', borderRadius: 8, overflow: 'hidden', marginRight: 10 },
    media: { width: '100%', height: '100%', borderRadius: 8 },
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF' },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    
    // Styles pour le Modal Galerie
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    modalHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    modalHeaderText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
  });
};

// ====================================================================
// 2. EXTRACTION DES MÉDIAS
// ====================================================================
const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http') && url.length > 15);
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const isVideoUrl = (url: string) => {
  return url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);
};

// ====================================================================
// 3. COMPOSANT RENDERER
// ====================================================================
const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: { url: string, index: number, styles: any, onMediaError: (url: string) => void, onPress: (index: number) => void }) => {
  const isVideo = isVideoUrl(url);

  return (
    <TouchableOpacity 
      style={styles.mediaPreviewContainer} 
      activeOpacity={0.9} 
      onPress={() => onPress(index)}
    >
      <Image 
        source={{ uri: url }} 
        style={styles.media} 
        resizeMode="cover" 
        onError={() => onMediaError(url)} 
      />
      {isVideo && (
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }]}>
          <Ionicons name="play-circle" size={50} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );
});

// ====================================================================
// 4. COMPOSANT CARTE 
// ====================================================================
const PostCard = React.memo(({ item, isDark, currentUserId, isSuperuser, onDeleteSuccess }: { item: any, isDark: boolean, currentUserId: string | null, isSuperuser: boolean, onDeleteSuccess: (id: string) => void }) => {
  const styles = getFeedStyles(isDark ? 'dark' : 'light');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour le Modal Galerie
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialModalIndex, setInitialModalIndex] = useState(0);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const fullScreenListRef = useRef<FlatList>(null);

  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const mediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const [validMedias, setValidMedias] = useState(mediasArray);

  useEffect(() => { setValidMedias(mediasArray); }, [mediasArray]);
  const handleMediaError = useCallback((failedUrl: string) => { setValidMedias(prev => prev.filter(url => url !== failedUrl)); }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const openGalleryModal = useCallback((index: number) => {
    setInitialModalIndex(index);
    setCurrentModalIndex(index);
    setIsModalVisible(true);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentModalIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const handleShare = async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.tonnom.ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";

      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur l'application Ganbanaaxu pour découvrir de nouvelles publications !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
        
      await Share.share({ message: shareMessage });
    } catch (error: any) {
      console.error("Erreur de partage :", error.message);
    }
  };

  const handleDeletePost = () => {
    const title = isOwner ? "Supprimer la publication" : "Action Modérateur";
    const message = isOwner 
      ? "Voulez-vous vraiment supprimer cette publication ?" 
      : "En tant que super-utilisateur, voulez-vous supprimer cette publication ?";

    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
            onDeleteSuccess(item.id);
          } catch (error: any) {
            Alert.alert("Erreur", "Impossible de supprimer la publication.");
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };

  const renderFullScreenMedia = ({ item: url }: { item: string }) => {
    return (
      <View style={styles.fullScreenMediaWrapper}>
        <Image 
          source={{ uri: url }} 
          style={styles.fullScreenMedia} 
          resizeMode="contain" 
        />
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.usernameText}>{userName}</Text>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={validMedias}
            renderItem={({ item: url, index }) => (
              <MediaRenderer 
                url={url} 
                index={index}
                styles={styles} 
                onMediaError={handleMediaError} 
                onPress={openGalleryModal}
              />
            )}
            keyExtractor={(media, index) => `${item.id}-preview-${index}`}
            horizontal 
            pagingEnabled={false} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            snapToInterval={width - 20 + 10} 
            decelerationRate="fast"
          />
        </View>
      )}

      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}

      {hasValidAudio && (
        <View style={styles.audioCommentary}>
          <TouchableOpacity style={styles.playButtonCommentary} onPress={handlePlayAudio}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
          </TouchableOpacity>
          <View style={styles.audioInfo}>
            <Text style={styles.audioText}>Commentaire vocal</Text>
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { width: isPlaying ? '100%' : '0%' }]} /> 
            </View>
          </View>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={isDark ? '#FFF' : '#333'} />
            <Text style={styles.interactionText}>Partager</Text>
          </TouchableOpacity>
        </View>
        
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <><Ionicons name="trash-outline" size={18} color="#FF3B30" /><Text style={styles.deleteText}>Supprimer</Text></>}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>

          {validMedias.length > 1 && (
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>
                {currentModalIndex + 1} / {validMedias.length}
              </Text>
            </View>
          )}

          <FlatList
            ref={fullScreenListRef}
            data={validMedias}
            renderItem={renderFullScreenMedia}
            keyExtractor={(media, index) => `${item.id}-full-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialModalIndex}
            getItemLayout={(data, index) => (
              { length: width, offset: width * index, index }
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
        </View>
      </Modal>
    </View>
  );
});

// ====================================================================
// 5. ÉCRAN PRINCIPAL AVEC GESTION DES NOTIFICATIONS
// ====================================================================
export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getFeedStyles(colorScheme);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    fetchUserAndPosts();
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) return; 
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') return;

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await supabase.from('push_tokens').upsert({
          user_id: session.user.id,
          token: pushToken
        }, { onConflict: 'token' });
      }
    } catch (error) {
      console.log("Erreur silencieuse push token :", error);
    }
  };

  const fetchUserAndPosts = async () => {
    try {
      const cachedPosts = await AsyncStorage.getItem('ganbanaaxu_feed_cache');
      if (cachedPosts) {
        setPosts(JSON.parse(cachedPosts));
        setLoading(false);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_superuser')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.is_superuser) {
          setIsSuperuser(true);
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setPosts(data);
        await AsyncStorage.setItem('ganbanaaxu_feed_cache', JSON.stringify(data));
      }
      
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchUserAndPosts(); }, []);
  const removePostFromList = useCallback((deletedPostId: string) => { setPosts((currentPosts) => currentPosts.filter(post => post.id !== deletedPostId)); }, []);

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
      <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerLoading]}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <PostCard item={item} isDark={isDark} currentUserId={currentUserId} isSuperuser={isSuperuser} onDeleteSuccess={removePostFromList} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={3} 
          maxToRenderPerBatch={3} 
          windowSize={5} 
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} tintColor={isDark ? '#FFF' : '#6200EE'} />}
        />
      </View>
    </SafeAreaView>
  );
}
*/













/*
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme,
  Alert,
  Share,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
  ViewToken
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Nouvelles bibliothèques multimédia d'Expo
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';

import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');
const PAGE_SIZE = 10; // Nombre de posts par page

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ====================================================================
// 1. STYLES (Identiques, avec ajustement pour VideoView)
// ====================================================================
const getFeedStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    card: { backgroundColor: isDark ? '#1E1E1E' : '#FFF', marginBottom: 12, borderRadius: 12, paddingVertical: 12, marginHorizontal: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    mediaContainer: { width: '100%', height: 350, backgroundColor: 'transparent', justifyContent: 'center', position: 'relative' },
    mediaPreviewContainer: { width: width - 20, height: 350, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', borderRadius: 8, overflow: 'hidden', marginRight: 10 },
    media: { width: '100%', height: '100%', borderRadius: 8 },
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF' },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    modalHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    modalHeaderText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
    footerLoader: { paddingVertical: 20, alignItems: 'center' }
  });
};

const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http') && url.length > 15);
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const isVideoUrl = (url: string) => url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);

// ====================================================================
// 2. LECTEUR AUDIO (expo-audio)
// Extrait dans un composant pour isoler le hook useAudioPlayer
// ====================================================================
const AudioCommentary = ({ url, isDark, styles }: { url: string, isDark: boolean, styles: any }) => {
  const player = useAudioPlayer(url);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  // Calcul de la progression
  const progressPercent = player.duration > 0 
    ? (player.currentTime / player.duration) * 100 
    : 0;

  return (
    <View style={styles.audioCommentary}>
      <TouchableOpacity style={styles.playButtonCommentary} onPress={togglePlay}>
        <Ionicons name={player.playing ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={styles.audioText}>Commentaire vocal</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} /> 
        </View>
      </View>
    </View>
  );
};

// ====================================================================
// 3. LECTEUR MEDIA (expo-video / Image)
// ====================================================================
const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: { url: string, index: number, styles: any, onMediaError: (url: string) => void, onPress: (index: number) => void }) => {
  const isVideo = isVideoUrl(url);

  // Initialisation du lecteur vidéo (ne sera utilisé que si isVideo est vrai, 
  // mais les hooks doivent toujours être appelés, donc on passe l'URL avec précaution)
  const player = useVideoPlayer(url, player => {
    player.loop = true;
    player.muted = true; // Muet par défaut dans le flux
  });

  return (
    <TouchableOpacity 
      style={styles.mediaPreviewContainer} 
      activeOpacity={isVideo ? 1 : 0.9} 
      onPress={() => onPress(index)}
    >
      {isVideo ? (
        <VideoView 
          player={player} 
          style={styles.media} 
          allowsFullscreen 
          allowsPictureInPicture 
          contentFit="cover"
        />
      ) : (
        <Image 
          source={{ uri: url }} 
          style={styles.media} 
          resizeMode="cover" 
          onError={() => onMediaError(url)} 
        />
      )}
    </TouchableOpacity>
  );
});

// ====================================================================
// 4. COMPOSANT CARTE 
// ====================================================================
const PostCard = React.memo(({ item, isDark, currentUserId, isSuperuser, onDeleteSuccess, onOpenGallery }: { item: any, isDark: boolean, currentUserId: string | null, isSuperuser: boolean, onDeleteSuccess: (id: string) => void, onOpenGallery: (medias: string[], index: number) => void }) => {
  const styles = getFeedStyles(isDark ? 'dark' : 'light');
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const mediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const [validMedias, setValidMedias] = useState(mediasArray);

  useEffect(() => { setValidMedias(mediasArray); }, [mediasArray]);
  const handleMediaError = useCallback((failedUrl: string) => { setValidMedias(prev => prev.filter(url => url !== failedUrl)); }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const handleShare = async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.tonnom.ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";
      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur Ganbanaaxu !\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur Ganbanaaxu !\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
      await Share.share({ message: shareMessage });
    } catch (error: any) {
      console.error("Erreur de partage :", error.message);
    }
  };

  const handleDeletePost = () => {
    Alert.alert("Suppression", "Voulez-vous vraiment supprimer cette publication ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
            onDeleteSuccess(item.id);
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer la publication.");
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.usernameText}>{userName}</Text>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={validMedias}
            renderItem={({ item: url, index }) => (
              <MediaRenderer 
                url={url} 
                index={index}
                styles={styles} 
                onMediaError={handleMediaError} 
                onPress={(idx) => onOpenGallery(validMedias, idx)} // Remonte l'événement
              />
            )}
            keyExtractor={(media, index) => `${item.id}-preview-${index}`}
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            snapToInterval={width - 20 + 10} 
            decelerationRate="fast"
          />
        </View>
      )}

      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}

      {hasValidAudio && <AudioCommentary url={item.audio_url} isDark={isDark} styles={styles} />}

      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={isDark ? '#FFF' : '#333'} />
            <Text style={styles.interactionText}>Partager</Text>
          </TouchableOpacity>
        </View>
        
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <><Ionicons name="trash-outline" size={18} color="#FF3B30" /><Text style={styles.deleteText}>Supprimer</Text></>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ====================================================================
// 5. ÉCRAN PRINCIPAL 
// ====================================================================
export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getFeedStyles(colorScheme);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // États de Pagination
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // États du Modal (Unique pour tout l'écran)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMedias, setModalMedias] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [currentModalViewIndex, setCurrentModalViewIndex] = useState(0);

  useEffect(() => {
    fetchPosts(true); // Premier chargement
  }, []);

  const fetchPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(0);
        setHasMore(true);
      } else {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
      }

      const currentPage = isRefresh ? 0 : page;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Récupération de l'utilisateur courant (optimisation : le faire une seule fois)
      if (currentUserId === null) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          const { data: profile } = await supabase.from('profiles').select('is_superuser').eq('id', session.user.id).single();
          if (profile?.is_superuser) setIsSuperuser(true);
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        if (isRefresh) {
          setPosts(data);
          await AsyncStorage.setItem('ganbanaaxu_feed_cache', JSON.stringify(data));
        } else {
          setPosts(prev => [...prev, ...data]);
        }
        
        // S'il y a moins de résultats que la taille de page demandée, on a atteint la fin
        setHasMore(data.length === PAGE_SIZE);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const openGalleryModal = useCallback((medias: string[], index: number) => {
    setModalMedias(medias);
    setModalIndex(index);
    setCurrentModalViewIndex(index);
    setIsModalVisible(true);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setCurrentModalViewIndex(viewableItems[0].index ?? 0);
  }).current;

  const renderFullScreenMedia = ({ item: url }: { item: string }) => {
    const isVideo = isVideoUrl(url);
    const player = useVideoPlayer(url, player => {
      player.loop = true;
      player.play(); // Auto-play en mode plein écran
    });

    return (
      <View style={styles.fullScreenMediaWrapper}>
        {isVideo ? (
          <VideoView player={player} style={styles.fullScreenMedia} contentFit="contain" allowsFullscreen />
        ) : (
          <Image source={{ uri: url }} style={styles.fullScreenMedia} resizeMode="contain" />
        )}
      </View>
    );
  };

  const removePostFromList = useCallback((deletedPostId: string) => { 
    setPosts(currentPosts => currentPosts.filter(post => post.id !== deletedPostId)); 
  }, []);

  if (loading && !refreshing) {
    return <View style={[styles.container, styles.centerLoading]}><ActivityIndicator size="large" color="#6200EE" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => (
            <PostCard 
              item={item} 
              isDark={isDark} 
              currentUserId={currentUserId} 
              isSuperuser={isSuperuser} 
              onDeleteSuccess={removePostFromList} 
              onOpenGallery={openGalleryModal} 
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          onEndReached={() => fetchPosts(false)}
          onEndReachedThreshold={0.5} // Déclenche le chargement à 50% de la fin
          ListFooterComponent={loadingMore ? <View style={styles.footerLoader}><ActivityIndicator size="small" color="#6200EE" /></View> : null}
          ListEmptyComponent={!loading ? <View style={styles.emptyContainer}><Text style={styles.emptyText}>Aucune publication pour le moment.</Text></View> : null}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} colors={['#6200EE']} />}
        />

        
        <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close-circle" size={40} color="#FFF" />
            </TouchableOpacity>

            {modalMedias.length > 1 && (
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>{currentModalViewIndex + 1} / {modalMedias.length}</Text>
              </View>
            )}

            <FlatList
              data={modalMedias}
              renderItem={renderFullScreenMedia}
              keyExtractor={(media, index) => `modal-${index}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={modalIndex}
              getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
              onViewableItemsChanged={onViewableItemsChanged}
              viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            />
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
*/
















/*
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme,
  Alert,
  Share,
  Platform,
  StatusBar,
  RefreshControl,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Correction du Warning
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';

import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');
const PAGE_SIZE = 10; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const getFeedStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    card: { backgroundColor: isDark ? '#1E1E1E' : '#FFF', marginBottom: 12, borderRadius: 12, paddingVertical: 12, marginHorizontal: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    mediaContainer: { width: '100%', height: 350, backgroundColor: 'transparent', justifyContent: 'center', position: 'relative' },
    mediaPreviewContainer: { width: width - 20, height: 350, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', borderRadius: 8, overflow: 'hidden', marginRight: 10 },
    media: { width: '100%', height: '100%', borderRadius: 8 },
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF' },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    modalHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    modalHeaderText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
    footerLoader: { paddingVertical: 20, alignItems: 'center' }
  });
};

const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http') && url.length > 15);
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const isVideoUrl = (url: string) => url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);

const AudioCommentary = ({ url, isDark, styles }: { url: string, isDark: boolean, styles: any }) => {
  const player = useAudioPlayer(url);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const progressPercent = player.duration > 0 
    ? (player.currentTime / player.duration) * 100 
    : 0;

  return (
    <View style={styles.audioCommentary}>
      <TouchableOpacity style={styles.playButtonCommentary} onPress={togglePlay}>
        <Ionicons name={player.playing ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={styles.audioText}>Commentaire vocal</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} /> 
        </View>
      </View>
    </View>
  );
};

const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: { url: string, index: number, styles: any, onMediaError: (url: string) => void, onPress: (index: number) => void }) => {
  const isVideo = isVideoUrl(url);
  const player = useVideoPlayer(url, player => {
    player.loop = true;
    player.muted = true;
  });

  return (
    <TouchableOpacity 
      style={styles.mediaPreviewContainer} 
      activeOpacity={isVideo ? 1 : 0.9} 
      onPress={() => onPress(index)}
    >
      {isVideo ? (
        <VideoView player={player} style={styles.media} allowsFullscreen allowsPictureInPicture contentFit="cover" />
      ) : (
        <Image source={{ uri: url }} style={styles.media} resizeMode="cover" onError={() => onMediaError(url)} />
      )}
    </TouchableOpacity>
  );
});

// COMPOSANT ISOLE POUR LE PLEIN ECRAN
const FullScreenMediaItem = React.memo(({ url, styles }: { url: string, styles: any }) => {
  const isVideo = isVideoUrl(url);
  const player = useVideoPlayer(url, player => {
    player.loop = true;
    player.play(); 
  });

  return (
    <View style={styles.fullScreenMediaWrapper}>
      {isVideo ? (
        <VideoView player={player} style={styles.fullScreenMedia} contentFit="contain" allowsFullscreen />
      ) : (
        <Image source={{ uri: url }} style={styles.fullScreenMedia} resizeMode="contain" />
      )}
    </View>
  );
});

const PostCard = React.memo(({ item, isDark, currentUserId, isSuperuser, onDeleteSuccess, onOpenGallery }: { item: any, isDark: boolean, currentUserId: string | null, isSuperuser: boolean, onDeleteSuccess: (id: string) => void, onOpenGallery: (medias: string[], index: number) => void }) => {
  const styles = getFeedStyles(isDark ? 'dark' : 'light');
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const mediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const [validMedias, setValidMedias] = useState(mediasArray);

  useEffect(() => { setValidMedias(mediasArray); }, [mediasArray]);
  const handleMediaError = useCallback((failedUrl: string) => { setValidMedias(prev => prev.filter(url => url !== failedUrl)); }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const handleShare = async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.tonnom.ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";
      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur Ganbanaaxu !\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur Ganbanaaxu !\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
      await Share.share({ message: shareMessage });
    } catch (error: any) {
      console.error("Erreur de partage :", error.message);
    }
  };

  const handleDeletePost = () => {
    Alert.alert("Suppression", "Voulez-vous vraiment supprimer cette publication ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
            onDeleteSuccess(item.id);
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer la publication.");
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.usernameText}>{userName}</Text>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <ScrollView
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            snapToInterval={width - 20 + 10} 
            decelerationRate="fast"
          >
            {validMedias.map((url, index) => (
              <MediaRenderer 
                key={`${item.id}-preview-${index}`}
                url={url} 
                index={index}
                styles={styles} 
                onMediaError={handleMediaError} 
                onPress={(idx) => onOpenGallery(validMedias, idx)} 
              />
            ))}
          </ScrollView>
        </View>
      )}

      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}
      {hasValidAudio && <AudioCommentary url={item.audio_url} isDark={isDark} styles={styles} />}

      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={isDark ? '#FFF' : '#333'} />
            <Text style={styles.interactionText}>Partager</Text>
          </TouchableOpacity>
        </View>
        
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <><Ionicons name="trash-outline" size={18} color="#FF3B30" /><Text style={styles.deleteText}>Supprimer</Text></>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getFeedStyles(colorScheme);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMedias, setModalMedias] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [currentModalViewIndex, setCurrentModalViewIndex] = useState(0);
  
  const modalScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchPosts(true); 
  }, []);

  useEffect(() => {
    if (isModalVisible && modalScrollRef.current && modalMedias.length > 0) {
      setTimeout(() => {
        modalScrollRef.current?.scrollTo({ x: modalIndex * width, animated: false });
      }, 50);
    }
  }, [isModalVisible, modalIndex]);

  const fetchPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(0);
        setHasMore(true);
      } else {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
      }

      const currentPage = isRefresh ? 0 : page;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (currentUserId === null) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          const { data: profile } = await supabase.from('profiles').select('is_superuser').eq('id', session.user.id).single();
          if (profile?.is_superuser) setIsSuperuser(true);
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        if (isRefresh) {
          setPosts(data);
          await AsyncStorage.setItem('ganbanaaxu_feed_cache', JSON.stringify(data));
        } else {
          setPosts(prev => [...prev, ...data]);
        }
        
        setHasMore(data.length === PAGE_SIZE);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const openGalleryModal = useCallback((medias: string[], index: number) => {
    setModalMedias(medias);
    setModalIndex(index);
    setCurrentModalViewIndex(index);
    setIsModalVisible(true);
  }, []);

  const handleModalScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== currentModalViewIndex && index >= 0 && index < modalMedias.length) {
      setCurrentModalViewIndex(index);
    }
  };

  const handleMainScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - (height * 0.5);
    if (isCloseToBottom && hasMore && !loadingMore && !loading) {
      fetchPosts(false);
    }
  };

  const removePostFromList = useCallback((deletedPostId: string) => { 
    setPosts(currentPosts => currentPosts.filter(post => post.id !== deletedPostId)); 
  }, []);

  if (loading && !refreshing) {
    return <View style={[styles.container, styles.centerLoading]}><ActivityIndicator size="large" color="#6200EE" /></View>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} colors={['#6200EE']} />}
          onScroll={handleMainScroll}
          scrollEventThrottle={400} 
        >
          {posts.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
            </View>
          ) : (
            posts.map(item => (
              <PostCard 
                key={item.id?.toString()}
                item={item} 
                isDark={isDark} 
                currentUserId={currentUserId} 
                isSuperuser={isSuperuser} 
                onDeleteSuccess={removePostFromList} 
                onOpenGallery={openGalleryModal} 
              />
            ))
          )}

          {loadingMore && (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#6200EE" />
            </View>
          )}
        </ScrollView>

        <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close-circle" size={40} color="#FFF" />
            </TouchableOpacity>

            {modalMedias.length > 1 && (
              <View style={styles.modalHeader}>
                <Text style={styles.modalHeaderText}>{currentModalViewIndex + 1} / {modalMedias.length}</Text>
              </View>
            )}

            <ScrollView
              ref={modalScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={handleModalScroll}
              scrollEventThrottle={16} 
            >
              {modalMedias.map((url, index) => (
                <FullScreenMediaItem 
                  key={`modal-media-${index}`} 
                  url={url} 
                  styles={styles} 
                />
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
*/


















/*
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme,
  Alert,
  Share,
  ScrollView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
  ViewToken
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer } from 'expo-audio';
import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');
const PAGE_SIZE = 10; 

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Demande des permissions de notification
async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }
}

const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http') && url.length > 15);
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const isVideoUrl = (url: string) => url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);

// LECTEUR VIDÉO OPTIMISÉ (SE PAUSE QUAND HORIZON DU CHAMP DE VISION)
const MediaRenderer = React.memo(({ url, index, styles, isVisible, onMediaError, onPress }: { 
  url: string, index: number, styles: any, isVisible: boolean, onMediaError: (url: string) => void, onPress: (index: number) => void 
}) => {
  const isVideo = isVideoUrl(url);
  
  const player = useVideoPlayer(url, player => {
    player.loop = true;
    player.muted = true;
  });

  useEffect(() => {
    if (isVideo && player) {
      if (isVisible) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isVisible, isVideo, player]);

  return (
    <TouchableOpacity 
      style={styles.mediaPreviewContainer} 
      activeOpacity={isVideo ? 1 : 0.9} 
      onPress={() => onPress(index)}
    >
      {isVideo ? (
        <VideoView player={player} style={styles.media} allowsFullscreen allowsPictureInPicture contentFit="cover" />
      ) : (
        <Image source={{ uri: url }} style={styles.media} resizeMode="cover" onError={() => onMediaError(url)} />
      )}
    </TouchableOpacity>
  );
});

const AudioCommentary = ({ url, isDark, styles }: { url: string, isDark: boolean, styles: any }) => {
  const player = useAudioPlayer(url);
  const togglePlay = () => {
    if (player.playing) player.pause();
    else player.play();
  };
  const progressPercent = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;

  return (
    <View style={styles.audioCommentary}>
      <TouchableOpacity style={styles.playButtonCommentary} onPress={togglePlay}>
        <Ionicons name={player.playing ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={styles.audioText}>Commentaire vocal</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} /> 
        </View>
      </View>
    </View>
  );
};

const FullScreenMediaItem = React.memo(({ url, styles }: { url: string, styles: any }) => {
  const isVideo = isVideoUrl(url);
  const player = useVideoPlayer(url, player => {
    player.loop = true;
    player.play(); 
  });

  return (
    <View style={styles.fullScreenMediaWrapper}>
      {isVideo ? (
        <VideoView player={player} style={styles.fullScreenMedia} contentFit="contain" allowsFullscreen />
      ) : (
        <Image source={{ uri: url }} style={styles.fullScreenMedia} resizeMode="contain" />
      )}
    </View>
  );
});

const PostCard = React.memo(({ item, isDark, isVisible, currentUserId, isSuperuser, onDeleteSuccess, onOpenGallery }: { 
  item: any, isDark: boolean, isVisible: boolean, currentUserId: string | null, isSuperuser: boolean, onDeleteSuccess: (id: string) => void, onOpenGallery: (medias: string[], index: number) => void 
}) => {
  const styles = getFeedStyles(isDark ? 'dark' : 'light');
  const [isDeleting, setIsDeleting] = useState(false);
  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const mediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const [validMedias, setValidMedias] = useState(mediasArray);

  useEffect(() => { setValidMedias(mediasArray); }, [mediasArray]);
  const handleMediaError = useCallback((failedUrl: string) => { setValidMedias(prev => prev.filter(url => url !== failedUrl)); }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const handleShare = async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.godapps.Ganbanaaxu";
      await Share.share({ message: `Rejoignez-moi sur Ganbanaaxu !\n${playStoreLink}` });
    } catch (error: any) {
      console.error("Erreur de partage :", error.message);
    }
  };

  const handleDeletePost = () => {
    Alert.alert("Suppression", "Voulez-vous vraiment supprimer cette publication ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
            onDeleteSuccess(item.id);
          } catch (error) {
            Alert.alert("Erreur", "Impossible de supprimer la publication.");
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.usernameText}>{userName}</Text>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={validMedias}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            keyExtractor={(url, index) => `${item.id}-media-${index}`}
            renderItem={({ item: url, index }) => (
              <MediaRenderer 
                url={url} 
                index={index} 
                styles={styles} 
                isVisible={isVisible}
                onMediaError={handleMediaError} 
                onPress={(idx) => onOpenGallery(validMedias, idx)} 
              />
            )}
          />
        </View>
      )}

      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}
      {hasValidAudio && <AudioCommentary url={item.audio_url} isDark={isDark} styles={styles} />}

      <View style={styles.cardFooter}>
        <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={20} color={isDark ? '#FFF' : '#333'} />
          <Text style={styles.interactionText}>Partager</Text>
        </TouchableOpacity>
        
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <><Ionicons name="trash-outline" size={18} color="#FF3B30" /><Text style={styles.deleteText}>Supprimer</Text></>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getFeedStyles(colorScheme);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [visiblePostId, setVisiblePostId] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalMedias, setModalMedias] = useState<string[]>([]);
  const [modalIndex, setModalIndex] = useState(0);
  const [currentModalViewIndex, setCurrentModalViewIndex] = useState(0);

  useEffect(() => {
    registerForPushNotificationsAsync();
    fetchPosts(true); 
  }, []);

  const fetchPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(0);
        setHasMore(true);
      } else {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
      }

      const currentPage = isRefresh ? 0 : page;
      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (currentUserId === null) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
          const { data: profile } = await supabase.from('profiles').select('is_superuser').eq('id', session.user.id).single();
          if (profile?.is_superuser) setIsSuperuser(true);
        }
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        if (isRefresh) {
          setPosts(data);
          await AsyncStorage.setItem('ganbanaaxu_feed_cache', JSON.stringify(data));
        } else {
          setPosts(prev => [...prev, ...data]);
        }
        setHasMore(data.length === PAGE_SIZE);
        setPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setVisiblePostId(viewableItems[0].item.id);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const removePostFromList = useCallback((deletedPostId: string) => { 
    setPosts(currentPosts => currentPosts.filter(post => post.id !== deletedPostId)); 
  }, []);

  const openGalleryModal = useCallback((medias: string[], index: number) => {
    setModalMedias(medias);
    setModalIndex(index);
    setCurrentModalViewIndex(index);
    setIsModalVisible(true);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PostCard 
              item={item} 
              isDark={isDark} 
              isVisible={item.id === visiblePostId}
              currentUserId={currentUserId} 
              isSuperuser={isSuperuser} 
              onDeleteSuccess={removePostFromList} 
              onOpenGallery={openGalleryModal} 
            />
          )}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} colors={['#6200EE']} />}
          onEndReached={() => {
            if (hasMore && !loadingMore && !loading) fetchPosts(false);
          }}
          onEndReachedThreshold={0.5}
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={5}
          ListFooterComponent={loadingMore ? <View style={styles.footerLoader}><ActivityIndicator size="small" color="#6200EE" /></View> : null}
        />

        <Modal visible={isModalVisible} transparent={true} animationType="fade" onRequestClose={() => setIsModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close-circle" size={40} color="#FFF" />
            </TouchableOpacity>

            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
              {modalMedias.map((url, index) => (
                <FullScreenMediaItem key={`modal-media-${index}`} url={url} styles={styles} />
              ))}
            </ScrollView>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const getFeedStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    card: { backgroundColor: isDark ? '#1E1E1E' : '#FFF', marginBottom: 12, borderRadius: 12, paddingVertical: 12, marginHorizontal: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    mediaContainer: { width: '100%', height: 350, backgroundColor: 'transparent', justifyContent: 'center' },
    mediaPreviewContainer: { width: width - 20, height: 350, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', borderRadius: 8, overflow: 'hidden', marginRight: 10 },
    media: { width: '100%', height: '100%', borderRadius: 8 },
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF' },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
    footerLoader: { paddingVertical: 20, alignItems: 'center' }
  });
};
*/












import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator,
  useColorScheme,
  Alert,
  Share,
  SafeAreaView,
  Platform,
  StatusBar,
  RefreshControl,
  Modal,
  ViewToken
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// NOUVEAUX IMPORTS EXPO SDK 52
import { useAudioPlayer } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';

import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');

// Configuration du comportement des notifications quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ====================================================================
// 1. STYLES
// ====================================================================
const getFeedStyles = (colorScheme: any) => {
  const isDark = colorScheme === 'dark';
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    centerLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    card: { backgroundColor: isDark ? '#1E1E1E' : '#FFF', marginBottom: 12, borderRadius: 12, paddingVertical: 12, marginHorizontal: 10, elevation: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    mediaContainer: { width: '100%', height: 350, backgroundColor: 'transparent', justifyContent: 'center', position: 'relative' },
    mediaPreviewContainer: { width: width - 20, height: 350, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', borderRadius: 8, overflow: 'hidden', marginRight: 10 },
    media: { width: '100%', height: '100%', borderRadius: 8 },
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF' },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 8, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    modalHeader: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, left: 20, zIndex: 9, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    modalHeaderText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
  });
};

// ====================================================================
// 2. EXTRACTION DES MÉDIAS
// ====================================================================
const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(parsed)) parsed = [parsed];
    return parsed.filter((url: any) => typeof url === 'string' && url.startsWith('http') && url.length > 15);
  } catch (e) {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const isVideoUrl = (url: string) => {
  return url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);
};

// ====================================================================
// 3. COMPOSANTS MÉDIA (REFAITS POUR EXPO-VIDEO ET EXPO-AUDIO)
// ====================================================================

// Lecteur Vidéo miniature
const PreviewVideo = ({ url, onMediaError }: { url: string, onMediaError: (url: string) => void }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.muted = true;
    p.pause(); // Forcer la pause dans la miniature
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView 
        player={player} 
        style={StyleSheet.absoluteFill} 
        contentFit="cover" 
        nativeControls={false} 
      />
    </View>
  );
};

// Lecteur Vidéo Plein écran (Gère intelligemment l'autoplay/pause)
const FullScreenVideoRenderer = ({ url, isVisible, styles }: { url: string, isVisible: boolean, styles: any }) => {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
  });

  useEffect(() => {
    if (isVisible) {
      player.play();
    } else {
      player.pause();
    }
  }, [isVisible, player]);

  return (
    <VideoView 
      player={player} 
      style={styles.fullScreenMedia} 
      contentFit="contain" 
      nativeControls={true} 
    />
  );
};

// Lecteur Audio dédié
const AudioCommentaryPlayer = ({ audioUrl, isDark, styles }: { audioUrl: string, isDark: boolean, styles: any }) => {
  const player = useAudioPlayer(audioUrl);
  const isPlaying = player.playing;

  return (
    <View style={styles.audioCommentary}>
      <TouchableOpacity 
        style={styles.playButtonCommentary} 
        onPress={() => isPlaying ? player.pause() : player.play()}
      >
        <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={styles.audioText}>Commentaire vocal</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: isPlaying ? '100%' : '0%' }]} /> 
        </View>
      </View>
    </View>
  );
};

// Rendu générique miniature
const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: { url: string, index: number, styles: any, onMediaError: (url: string) => void, onPress: (index: number) => void }) => {
  const isVideo = isVideoUrl(url);

  return (
    <TouchableOpacity 
      style={styles.mediaPreviewContainer} 
      activeOpacity={0.9} 
      onPress={() => onPress(index)}
    >
      {isVideo ? (
        <View style={styles.media}>
          <PreviewVideo url={url} onMediaError={onMediaError} />
          <View style={[StyleSheet.absoluteFill, {justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)'}]}>
            <Ionicons name="play-circle" size={50} color="#FFF" />
          </View>
        </View>
      ) : (
        <Image 
          source={{ uri: url }} 
          style={styles.media} 
          resizeMode="cover" 
          onError={() => onMediaError(url)} 
        />
      )}
    </TouchableOpacity>
  );
});

// ====================================================================
// 4. COMPOSANT CARTE POST
// ====================================================================
const PostCard = React.memo(({ item, isDark, currentUserId, isSuperuser, onDeleteSuccess }: { item: any, isDark: boolean, currentUserId: string | null, isSuperuser: boolean, onDeleteSuccess: (id: string) => void }) => {
  const styles = getFeedStyles(isDark ? 'dark' : 'light');
  
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour le Modal Galerie
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [initialModalIndex, setInitialModalIndex] = useState(0);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const fullScreenListRef = useRef<FlatList>(null);

  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const mediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const [validMedias, setValidMedias] = useState(mediasArray);

  useEffect(() => { setValidMedias(mediasArray); }, [mediasArray]);
  const handleMediaError = useCallback((failedUrl: string) => { setValidMedias(prev => prev.filter(url => url !== failedUrl)); }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const openGalleryModal = useCallback((index: number) => {
    setInitialModalIndex(index);
    setCurrentModalIndex(index);
    setIsModalVisible(true);
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      setCurrentModalIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const handleShare = async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.tonnom.ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";

      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur l'application Ganbanaaxu pour découvrir de nouvelles publications !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
        
      await Share.share({ message: shareMessage });
    } catch (error: any) {
      console.error("Erreur de partage :", error.message);
    }
  };

  const handleDeletePost = () => {
    const title = isOwner ? "Supprimer la publication" : "Action Modérateur";
    const message = isOwner 
      ? "Voulez-vous vraiment supprimer cette publication ?" 
      : "En tant que super-utilisateur, voulez-vous supprimer cette publication ?";

    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
            onDeleteSuccess(item.id);
          } catch (error: any) {
            Alert.alert("Erreur", "Impossible de supprimer la publication.");
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  };

  const renderFullScreenMedia = ({ item: url, index }: { item: string, index: number }) => {
    const isVideo = isVideoUrl(url);
    // Vérification clé : la vidéo n'est considérée visible que si le modal est ouvert ET que c'est l'index actuel
    const isVisible = isModalVisible && currentModalIndex === index;

    return (
      <View style={styles.fullScreenMediaWrapper}>
        {isVideo ? (
          <FullScreenVideoRenderer url={url} isVisible={isVisible} styles={styles} />
        ) : (
          <Image 
            source={{ uri: url }} 
            style={styles.fullScreenMedia} 
            resizeMode="contain" 
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <Text style={styles.usernameText}>{userName}</Text>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={validMedias}
            renderItem={({ item: url, index }) => (
              <MediaRenderer 
                url={url} 
                index={index}
                styles={styles} 
                onMediaError={handleMediaError} 
                onPress={openGalleryModal}
              />
            )}
            keyExtractor={(media, index) => `${item.id}-preview-${index}`}
            horizontal 
            pagingEnabled={false} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            snapToInterval={width - 20 + 10} 
            decelerationRate="fast"
          />
        </View>
      )}

      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}

      {/* Utilisation du nouveau composant Audio SDK 52 */}
      {hasValidAudio && (
        <AudioCommentaryPlayer audioUrl={item.audio_url} isDark={isDark} styles={styles} />
      )}

      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={20} color={isDark ? '#FFF' : '#333'} />
            <Text style={styles.interactionText}>Partager</Text>
          </TouchableOpacity>
        </View>
        
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <><Ionicons name="trash-outline" size={18} color="#FF3B30" /><Text style={styles.deleteText}>Supprimer</Text></>}
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>

          {validMedias.length > 1 && (
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>
                {currentModalIndex + 1} / {validMedias.length}
              </Text>
            </View>
          )}

          <FlatList
            ref={fullScreenListRef}
            data={validMedias}
            renderItem={renderFullScreenMedia}
            keyExtractor={(media, index) => `${item.id}-full-${index}`}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialModalIndex}
            getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            removeClippedSubviews={true}
            maxToRenderPerBatch={2}
            windowSize={3}
          />
        </View>
      </Modal>
    </View>
  );
});

// ====================================================================
// 5. ÉCRAN PRINCIPAL AVEC GESTION DES NOTIFICATIONS
// ====================================================================
export default function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = getFeedStyles(colorScheme);
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);

  useEffect(() => {
    fetchUserAndPosts();
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) return; 
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') return;

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      const pushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await supabase.from('push_tokens').upsert({
          user_id: session.user.id,
          token: pushToken
        }, { onConflict: 'token' });
      }
    } catch (error) {
      console.log("Erreur silencieuse push token :", error);
    }
  };

  const fetchUserAndPosts = async () => {
    try {
      const cachedPosts = await AsyncStorage.getItem('ganbanaaxu_feed_cache');
      if (cachedPosts) {
        setPosts(JSON.parse(cachedPosts));
        setLoading(false); 
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_superuser')
          .eq('id', session.user.id)
          .single();
          
        if (profile?.is_superuser) setIsSuperuser(true);
      }

      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setPosts(data);
        await AsyncStorage.setItem('ganbanaaxu_feed_cache', JSON.stringify(data));
      }
      
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); fetchUserAndPosts(); }, []);
  const removePostFromList = useCallback((deletedPostId: string) => { setPosts((currentPosts) => currentPosts.filter(post => post.id !== deletedPostId)); }, []);

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
      <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerLoading]}>
        <ActivityIndicator size="large" color="#6200EE" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={({ item }) => <PostCard item={item} isDark={isDark} currentUserId={currentUserId} isSuperuser={isSuperuser} onDeleteSuccess={removePostFromList} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 20, flexGrow: 1 }}
          ListEmptyComponent={ListEmptyComponent}
          initialNumToRender={3} 
          maxToRenderPerBatch={3} 
          windowSize={5} 
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} tintColor={isDark ? '#FFF' : '#6200EE'} />}
        />
      </View>
    </SafeAreaView>
  );
}











