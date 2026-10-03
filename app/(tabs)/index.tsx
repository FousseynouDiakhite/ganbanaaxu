























/*
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Dimensions, FlatList, StyleSheet, ActivityIndicator,
  useColorScheme, Alert, Share, SafeAreaView, Platform, StatusBar, RefreshControl,
  Modal, ViewToken, Image as RNImage, ColorSchemeName
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// IMPORTS EXTERNES
import { FlashList } from '@shopify/flash-list';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Image } from 'expo-image';

// IMPORTS ADMOB
import { 
  TestIds, NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView
} from 'react-native-google-mobile-ads';

import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');

// ====================================================================
// CONFIGURATION & TYPES
// ====================================================================
const TOP_NATIVE_AD_ID = TestIds.NATIVE;
const INLINE_NATIVE_AD_ID = TestIds.NATIVE;
const CACHE_KEY = 'ganbanaaxu_feed_cache';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const PAGE_SIZE = 10;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface Profile {
  full_name: string;
  avatar_url: string | null;
  is_superuser?: boolean;
}

interface Post {
  id: string;
  user_id: string;
  created_at: string;
  media_urls: string | string[];
  audio_url?: string;
  document_url?: string;
  caption?: string;
  profiles: Profile | Profile[];
  isAd?: boolean;
  isSkeleton?: boolean;
}

// ====================================================================
// 1. STYLES (inchangés + 3 nouveaux styles utilitaires)
// ====================================================================
const getFeedStyles = (colorScheme: ColorSchemeName) => {
  const isDark = colorScheme === 'dark';
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: statusBarHeight },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    // ✅ NOUVEAUX STYLES
    errorContainer: { alignItems: 'center', padding: 24, marginTop: 80 },
    errorText: { color: isDark ? '#FF6B6B' : '#D32F2F', textAlign: 'center', marginTop: 12, marginBottom: 16, fontSize: 14 },
    retryBtn: { backgroundColor: '#6200EE', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
    retryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    footerLoader: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
    footerEndText: { fontSize: 12, color: isDark ? '#666' : '#999', paddingVertical: 20 },
    
    card: { 
      backgroundColor: isDark ? '#1E1E1E' : '#FFF', 
      marginBottom: 10, 
      paddingVertical: 12, 
      borderBottomWidth: 0.4, 
      borderColor: isDark ? '#2A2A2A' : '#EFEFEF' 
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    
    mediaContainer: { 
      width: width, 
      height: width * 1.25, 
      backgroundColor: isDark ? '#000' : '#FAFAFA', 
      justifyContent: 'center', 
      position: 'relative' 
    },
    mediaPreviewContainer: { 
      width: width, 
      height: width * 1.50, 
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', 
      overflow: 'hidden' 
    },
    media: { width: '100%', height: '100%' },
    
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10 },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 10, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
    
    nativeAdCard: { 
      width: 360, height: 270, backgroundColor: isDark ? '#1E1E1E' : '#FFF', 
      marginHorizontal: 16, marginVertical: 12, padding: 12, borderRadius: 12, 
      borderWidth: 0, borderColor: isDark ? '#333' : '#EBEBEB',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 
    },
    nativeAdHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    nativeAdIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#CCC' },
    nativeAdTextContainer: { flex: 1, marginLeft: 10 },
    nativeAdHeadline: { fontWeight: 'bold', color: isDark ? '#FFF' : '#333', fontSize: 15 },
    nativeAdTagline: { color: isDark ? '#AAA' : '#666', fontSize: 12, marginTop: 2 },
    nativeAdMedia: { width: '100%', height: 150, borderRadius: 8, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', marginVertical: 8 },
    nativeAdBadge: { paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#FFA500', borderRadius: 4, marginLeft: 5 },
    nativeAdBadgeText: { fontSize: 10, color: '#FFA500', fontWeight: 'bold' },
    nativeAdButtonContainer: { marginTop: 4 },
    nativeAdButton: { width: '100%', height: 34, backgroundColor: '#6200EE', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    nativeAdButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
  }); 
}; 

// ====================================================================
// 2. UTILITAIRES
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

const isVideoUrl = (url: string) => !!url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);

const extractStoragePathAndBucket = (url: string) => {
  try {
    const parts = url.split('/public/');
    if (parts.length === 2) {
      const pathWithBucket = parts[1];
      const firstSlashIndex = pathWithBucket.indexOf('/');
      if (firstSlashIndex !== -1) {
        return { bucket: pathWithBucket.substring(0, firstSlashIndex), path: pathWithBucket.substring(firstSlashIndex + 1) };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

// ====================================================================
// 3. COMPOSANTS SECONDAIRES & SKELETONS
// ====================================================================
const PostSkeleton = React.memo(({ isDark, styles }: { isDark: boolean; styles: any }) => (
  <View style={[styles.card, { opacity: 0.6 }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.avatar, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
      <View style={styles.userInfoContainer}>
        <View style={{ height: 14, width: '40%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
        <View style={{ height: 10, width: '20%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginTop: 4 }} />
      </View>
    </View>
    <View style={[styles.mediaContainer, { backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0' }]} />
    <View style={styles.captionContainer}>
      <View style={{ height: 12, width: '90%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginBottom: 6 }} />
      <View style={{ height: 12, width: '60%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
    </View>
  </View>
));

const CustomNativeAd = React.memo(({ isDark, refreshKey, adUnitId, styles }: { isDark: boolean; refreshKey: number; adUnitId: string, styles: any }) => {
  const [nativeAd, setNativeAd] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    let loadedAdInstance: any = null;
    setNativeAd(null); 

    NativeAd.createForAdRequest(adUnitId)
      .then((ad) => {
        if (isMounted) {
          loadedAdInstance = ad;
          setNativeAd(ad);
        } else {
          ad?.destroy?.();
        }
      })
      .catch((error) => console.log('Erreur chargement Native Ad:', error));

    return () => { 
      isMounted = false; 
      loadedAdInstance?.destroy?.();
    };
  }, [refreshKey, adUnitId]);

  if (!nativeAd) {
    return (
      <View style={[styles.nativeAdCard, { opacity: 0.5 }]}>
        <View style={styles.nativeAdHeader}>
          <View style={[styles.nativeAdIcon, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
          <View style={styles.nativeAdTextContainer}>
            <View style={{ height: 15, width: '80%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginBottom: 6 }} />
            <View style={{ height: 12, width: '50%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
          </View>
        </View>
        <View style={[styles.nativeAdMedia, { width: '100%', backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
      </View>
    );
  }

  return (
    <View style={styles.nativeAdCard}>
      <NativeAdView nativeAd={nativeAd} style={{ width: '100%' }}>
        <View style={styles.nativeAdHeader}>
          {nativeAd.icon && (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <RNImage source={{ uri: nativeAd.icon.url }} style={styles.nativeAdIcon} />
            </NativeAsset>
          )}
          <View style={styles.nativeAdTextContainer}>
            {nativeAd.headline && (
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text style={styles.nativeAdHeadline}>{nativeAd.headline}</Text>
              </NativeAsset>
            )}
            {nativeAd.body && (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text numberOfLines={1} style={styles.nativeAdTagline}>{nativeAd.body}</Text>
              </NativeAsset>
            )}
          </View>
          <View style={styles.nativeAdBadge}>
            <Text style={styles.nativeAdBadgeText}>Annonce</Text>
          </View>
        </View>
        
        <NativeMediaView style={styles.nativeAdMedia} />
        
        {nativeAd.callToAction && (
          <View style={styles.nativeAdButtonContainer}>
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <View style={styles.nativeAdButton}>
                <Text style={styles.nativeAdButtonText}>{nativeAd.callToAction}</Text>
              </View>
            </NativeAsset>
          </View>
        )}
      </NativeAdView>
    </View>
  );
});

const PreviewVideo = React.memo(({ url }: { url: string }) => {
  const player = useVideoPlayer(url, (p) => { 
    p.loop = true; 
    p.muted = true; 
    p.pause(); 
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
});

const AudioCommentaryPlayer = React.memo(({ audioUrl, isDark, styles }: { audioUrl: string; isDark: boolean; styles: any }) => {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const isPlaying = player.playing;
  const progressPercent = (status?.currentTime && status?.duration) 
    ? (status.currentTime / status.duration) * 100 
    : 0;

  return (
    <View style={styles.audioCommentary}>
      <TouchableOpacity 
        style={styles.playButtonCommentary} 
        onPress={() => (isPlaying ? player.pause() : player.play())}
      >
        <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={styles.audioText}>Commentaire vocal</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} /> 
        </View>
      </View>
    </View>
  );
});

const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: { url: string; index: number; styles: any; onMediaError: (url: string) => void; onPress: (index: number) => void }) => {
  const isVideo = isVideoUrl(url);
  return (
    <TouchableOpacity style={styles.mediaPreviewContainer} activeOpacity={0.9} onPress={() => onPress(index)}>
      {isVideo ? (
        <View style={styles.media}>
          <PreviewVideo url={url} />
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons name="play-circle" size={50} color="#FFF" />
          </View>
        </View>
      ) : (
        <Image source={{ uri: url }} style={styles.media} contentFit="cover" cachePolicy="disk" onError={() => onMediaError(url)} transition={200} />
      )}
    </TouchableOpacity>
  );
});

// ====================================================================
// 4. POST CARD
// ====================================================================
const PostCard = React.memo(({ item, isDark, styles, currentUserId, isSuperuser, onDeleteSuccess, onOpenGallery }: { item: Post; isDark: boolean; styles: any; currentUserId: string | null; isSuperuser: boolean; onDeleteSuccess: (id: string) => void; onOpenGallery: (urls: string[], index: number) => void }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const rawMediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const validMedias = useMemo(() => rawMediasArray.filter(url => !failedUrls.has(url)), [rawMediasArray, failedUrls]);

  const handleMediaError = useCallback((failedUrl: string) => {
    setFailedUrls(prev => new Set(prev).add(failedUrl));
  }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const handleShare = useCallback(async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.godapps.Ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";
      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
      await Share.share({ message: shareMessage });
    } catch (error: any) { console.error("Erreur de partage :", error.message); }
  }, [item.caption]);

  const handleDeletePost = useCallback(() => {
    const title = isSuperuser && !isOwner ? "Action Modérateur" : "Supprimer la publication";
    Alert.alert(title, "Voulez-vous vraiment supprimer cette publication et tous ses fichiers définitivement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          // ✅ Suppression optimiste : retire immédiatement de la liste
          onDeleteSuccess(item.id);
          try {
            const urlsToDelete: string[] = [...rawMediasArray];
            // ✅ CORRECTION : suppression de item.file_url (n'existe pas)
            if (item.audio_url) urlsToDelete.push(item.audio_url);
            if (item.document_url) urlsToDelete.push(item.document_url);

            const bucketsMap: { [bucketName: string]: string[] } = {};
            urlsToDelete.forEach(url => {
              if (url && typeof url === 'string') {
                const fileInfo = extractStoragePathAndBucket(url);
                if (fileInfo) {
                  if (!bucketsMap[fileInfo.bucket]) bucketsMap[fileInfo.bucket] = [];
                  bucketsMap[fileInfo.bucket].push(fileInfo.path);
                }
              }
            });

            // ✅ Parallélisation des suppressions storage
            await Promise.all(
              Object.entries(bucketsMap).map(([bucket, paths]) =>
                paths.length > 0 ? supabase.storage.from(bucket).remove(paths) : Promise.resolve()
              )
            );

            const { error: dbError } = await supabase.from('posts').delete().eq('id', item.id);
            if (dbError) throw new Error(dbError.message);
          } catch (error: any) {
            Alert.alert("Erreur", "Impossible de supprimer la publication. " + error.message);
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  }, [item, rawMediasArray, isOwner, isSuperuser, onDeleteSuccess]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} cachePolicy="disk" transition={200} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
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
                onPress={(idx) => onOpenGallery(validMedias, idx)} 
              />
            )}
            keyExtractor={(media, index) => `${item.id}-${index}`}
            horizontal 
            pagingEnabled={true} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 0 }} 
            snapToInterval={width} 
            decelerationRate="fast"
            removeClippedSubviews
            windowSize={3}
            maxToRenderPerBatch={2}
          />
        </View>
      )}
      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}
      {hasValidAudio && <AudioCommentaryPlayer audioUrl={item.audio_url as string} isDark={isDark} styles={styles} />}
      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color={isDark ? '#FFF' : '#333'} />
          </TouchableOpacity>
        </View>
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <Ionicons name="trash-outline" size={22} color="#FF3B30" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ====================================================================
// 5. COMPOSANT GALERIE PLEIN ÉCRAN
// ====================================================================
const FullScreenVideoRenderer = ({ url, isVisible, styles }: { url: string; isVisible: boolean; styles: any }) => {
  const player = useVideoPlayer(url, (p) => { p.loop = true; });
  useEffect(() => { 
    if (isVisible) player.play();
    else player.pause();
  }, [isVisible, player]);

  return <VideoView player={player} style={styles.fullScreenMedia} contentFit="contain" nativeControls={true} />;
};

const FullScreenGallery = ({ urls, initialIndex, visible, onClose, styles }: { urls: string[], initialIndex: number, visible: boolean, onClose: () => void, styles: any }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;
  
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Ionicons name="close-circle" size={40} color="#FFF" />
        </TouchableOpacity>
        <FlatList
          data={urls}
          renderItem={({ item: url, index }) => {
            const isVideo = isVideoUrl(url);
            const isVisible = visible && currentIndex === index;
            return (
              <View style={styles.fullScreenMediaWrapper}>
                {isVideo ? (
                  <FullScreenVideoRenderer url={url} isVisible={isVisible} styles={styles} />
                ) : (
                  <Image source={{ uri: url }} style={styles.fullScreenMedia} contentFit="contain" cachePolicy="disk" />
                )}
              </View>
            );
          }}
          keyExtractor={(url, index) => `modal-${index}`}
          horizontal pagingEnabled showsHorizontalScrollIndicator={false} initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
          onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={Platform.OS === 'android'} maxToRenderPerBatch={2} windowSize={3}
        />
      </View>
    </Modal>
  );
};

// ====================================================================
// 6. FONCTION NOTIFICATIONS
// ====================================================================
async function registerForPushNotificationsAsync(userId: string | null): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    console.warn('⚠️ Notifications push : appareil physique requis');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('❌ Permission de notification refusée');
    return null;
  }

  try {
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      console.error('❌ projectId EAS manquant dans app.json');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('✅ Token Expo obtenu :', token);

    if (userId && token) {
      const { error: deleteError } = await supabase
        .from('push_tokens')
        .delete()
        .eq('user_id', userId);

      if (deleteError) console.error('❌ Erreur suppression anciens tokens :', deleteError.message);

      const { error: insertError } = await supabase
        .from('push_tokens')
        .insert({ user_id: userId, token: token });

      if (insertError) console.error('❌ Erreur insert token :', insertError.message);
      else console.log('✅ Token sauvegardé dans push_tokens pour user', userId);
    }
  } catch (e: any) {
    console.error('❌ Erreur getExpoPushTokenAsync :', e.message);
  }

  return token;
}

// ====================================================================
// 7. ÉCRAN PRINCIPAL
// ====================================================================
function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => getFeedStyles(colorScheme), [colorScheme]);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [galleryState, setGalleryState] = useState<{ urls: string[], initialIndex: number, visible: boolean }>({ urls: [], initialIndex: 0, visible: false });

  // ✅ Refs pour éviter les re-renders et les appels concurrents
  const isFetchingRef = useRef(false);
  const pureCountRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);

  // --- Injection des ads (logique inchangée) ---
  const processDataWithAds = useCallback((rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    let postsWithAds = [];
    let adCount = 0;
    let postCountSinceLastAd = 0;
    for (let i = 0; i < rawData.length; i++) {
      postsWithAds.push(rawData[i]);
      postCountSinceLastAd++;
      if (postCountSinceLastAd === 5 && adCount < 10) {
        postsWithAds.push({ isAd: true, id: `ad-inline-${adCount}-${rawData[i].id}` });
        adCount++;
        postCountSinceLastAd = 0;
      }
    }
    pureCountRef.current = rawData.length;
    return postsWithAds;
  }, []);

  // --- CHARGEMENT PRINCIPAL (cache instantané + fetch parallèle + TTL) ---
  const loadPosts = useCallback(async (opts: { skipCache?: boolean } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setError(null);

    try {
      // 1. Cache instantané (format ancien ET nouveau supportés)
      if (!opts.skipCache) {
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            const cachedData = Array.isArray(parsed) ? parsed : (parsed?.data || []);
            const cacheTs = Array.isArray(parsed) ? 0 : (parsed?.ts || 0);
            if (Array.isArray(cachedData) && cachedData.length > 0) {
              setPosts(processDataWithAds(cachedData));
              setLoading(false);
              // Si le cache est frais (< 5 min), on évite le refetch réseau
              if (Date.now() - cacheTs < CACHE_TTL) {
                isFetchingRef.current = false;
                setRefreshing(false);
                return;
              }
            }
          } catch (e) 
        }
      }

      // 2. Requêtes parallèles : session + posts
      const [sessionRes, postsRes] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from('posts')
          .select('*, profiles!user_id(full_name, avatar_url)')
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1),
      ]);

      const userId = sessionRes.data.session?.user?.id ?? null;

      // 3. Profil utilisateur (seulement si l'utilisateur a changé)
      if (userId && userId !== currentUserIdRef.current) {
        currentUserIdRef.current = userId;
        setCurrentUserId(userId);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_superuser')
          .eq('id', userId)
          .single();
        if (profile?.is_superuser) setIsSuperuser(true);
      }

      if (postsRes.error) throw postsRes.error;

      const fresh = postsRes.data || [];
      setPosts(processDataWithAds(fresh));
      setHasMore(fresh.length === PAGE_SIZE);

      // 4. Persistance cache avec timestamp
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: fresh, ts: Date.now() }));

      // 5. Push token en arrière-plan (non bloquant)
      if (userId) registerForPushNotificationsAsync(userId).catch(() => {});
    } catch (e: any) {
      console.error("Erreur de récupération :", e);
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [processDataWithAds]);

  // --- PAGINATION ---
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || isFetchingRef.current) return;
    setLoadingMore(true);
    try {
      const from = pureCountRef.current;
      const to = from + PAGE_SIZE - 1;
      const { data, error: err } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (err) throw err;
      const fresh = data || [];
      setHasMore(fresh.length === PAGE_SIZE);

      setPosts(prev => {
        const purePrev = prev.filter(p => !p.isAd && !p.isSkeleton);
        const existingIds = new Set(purePrev.map(p => p.id));
        const newOnes = fresh.filter(p => !existingIds.has(p.id));
        if (newOnes.length === 0) return prev;
        const all = [...purePrev, ...newOnes];
        return processDataWithAds(all);
      });
    } catch (e: any) {
      console.warn('loadMore:', e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, processDataWithAds]);

  // --- INITIALISATION (une seule fois) ---
  useEffect(() => {
    let notifListener: Notifications.Subscription | undefined;
    let responseListener: Notifications.Subscription | undefined;

    loadPosts();

    notifListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification reçue (foreground):', notification);
    });

    responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapée:', response);
      const data = response.notification.request.content.data;
      console.log('📦 Data:', data);
    });

    return () => {
      notifListener?.remove();
      responseListener?.remove();
    };
  }, [loadPosts]);

  // --- REFRESH ---
  const onRefresh = useCallback(() => { 
    setRefreshing(true); 
    setRefreshKey(prev => prev + 1);
    setHasMore(true);
    loadPosts({ skipCache: true });
  }, [loadPosts]);

  // --- SUPPRESSION OPTIMISTE (déjà appelé avant la requête dans PostCard) ---
  const removePostFromList = useCallback((deletedPostId: string) => { 
    setPosts((currentPosts) => {
      const purePosts = currentPosts.filter(post => !post.isAd && !post.isSkeleton && post.id !== deletedPostId);
      pureCountRef.current = purePosts.length;
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: purePosts, ts: Date.now() })).catch(err => console.error("Erreur cache :", err));
      return processDataWithAds(purePosts);
    });
  }, [processDataWithAds]);

  const handleOpenGallery = useCallback((urls: string[], index: number) => {
    setGalleryState({ urls, initialIndex: index, visible: true });
  }, []);

  const handleCloseGallery = useCallback(() => {
    setGalleryState(prev => ({ ...prev, visible: false }));
  }, []);

  // --- DONNÉES AFFICHÉES (skeleton initial) ---
  const feedData = useMemo(() => {
    if (loading && posts.length === 0) {
      return [
        { id: 'sk-1', isSkeleton: true },
        { id: 'sk-ad-1', isAd: true },
        { id: 'sk-2', isSkeleton: true },
        { id: 'sk-3', isSkeleton: true },
      ];
    }
    return posts;
  }, [loading, posts]);

  // --- CALLBACKS STABLES ---
  const keyExtractor = useCallback((item: any) => item.id.toString(), []);
  const getItemType = useCallback((item: any) => {
    if (item.isSkeleton) return 'skeleton';
    if (item.isAd) return 'ad';
    return 'post';
  }, []);

  const renderItem = useCallback(({ item }: any) => {
    if (item.isSkeleton) return <PostSkeleton isDark={isDark} styles={styles} />;
    if (item.isAd) return <CustomNativeAd isDark={isDark} refreshKey={refreshKey} adUnitId={INLINE_NATIVE_AD_ID} styles={styles} />;
    return (
      <PostCard 
        item={item as Post} 
        isDark={isDark} 
        styles={styles} 
        currentUserId={currentUserId} 
        isSuperuser={isSuperuser} 
        onDeleteSuccess={removePostFromList} 
        onOpenGallery={handleOpenGallery}
      />
    );
  }, [isDark, styles, refreshKey, currentUserId, isSuperuser, removePostFromList, handleOpenGallery]);

  // --- FOOTER ---
  const ListFooter = useMemo(() => {
    if (loadingMore) {
      return <View style={styles.footerLoader}><ActivityIndicator color="#6200EE" /></View>;
    }
    if (!hasMore && posts.length > 0) {
      return <Text style={styles.footerEndText}>— 0 0 —</Text>;
    }
    return null;
  }, [loadingMore, hasMore, posts.length, styles]);

  // --- EMPTY / ERREUR ---
  const ListEmpty = useMemo(() => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={50} color={isDark ? '#555' : '#CCC'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadPosts({ skipCache: true }); }}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
        <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
      </View>
    );
  }, [loading, error, isDark, styles, loadPosts]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        
        <FlashList
          data={feedData}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          renderItem={renderItem}
          estimatedItemSize={600}
          drawDistance={1200}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <View style={{ paddingTop: 10, paddingBottom: 5 }}>
              <CustomNativeAd isDark={isDark} refreshKey={refreshKey} adUnitId={TOP_NATIVE_AD_ID} styles={styles} />
            </View>
          }
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} tintColor={isDark ? '#FFF' : '#6200EE'} />}
        />
      </View>
      
      <FullScreenGallery 
        urls={galleryState.urls} 
        initialIndex={galleryState.initialIndex} 
        visible={galleryState.visible} 
        onClose={handleCloseGallery} 
        styles={styles} 
      />
    </SafeAreaView>
  );
}

export default FeedScreen;

*/




















/*
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Dimensions, FlatList, StyleSheet, ActivityIndicator,
  useColorScheme, Alert, Share, SafeAreaView, Platform, StatusBar, RefreshControl,
  Modal, ViewToken, Image as RNImage, ColorSchemeName
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

import { FlashList } from '@shopify/flash-list';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Image } from 'expo-image';

import { 
  TestIds, NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView
} from 'react-native-google-mobile-ads';

import { supabase } from '../../lib/supabase'; 

const { width, height } = Dimensions.get('window');

// ====================================================================
// CONFIGURATION & TYPES
// ====================================================================
const TOP_NATIVE_AD_ID = TestIds.NATIVE;
const INLINE_NATIVE_AD_ID = TestIds.NATIVE;
const CACHE_KEY = 'ganbanaaxu_feed_cache';
const SEEN_KEY = 'ganbanaaxu_seen_posts';
const CACHE_TTL = 5 * 60 * 1000;
const PAGE_SIZE = 10;
const SEEN_MAX = 500; // limite pour éviter une croissance infinie

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ====================================================================
// PRÉCHARGEMENT DES ADS (démarre à l'import du module)
// ====================================================================
let TOP_AD_PRELOADED: any = null;
let INLINE_AD_PRELOADED: any = null;

const preloadAd = (adUnitId: string, onLoaded: (ad: any) => void) => {
  NativeAd.createForAdRequest(adUnitId)
    .then((ad) => onLoaded(ad))
    .catch(() => {});
};

// Lancement immédiat (avant même le 1er rendu du composant)
preloadAd(TOP_NATIVE_AD_ID, (ad) => { TOP_AD_PRELOADED = ad; });
preloadAd(INLINE_NATIVE_AD_ID, (ad) => { INLINE_AD_PRELOADED = ad; });

interface Profile {
  full_name: string;
  avatar_url: string | null;
  is_superuser?: boolean;
}

interface Post {
  id: string;
  user_id: string;
  created_at: string;
  media_urls: string | string[];
  audio_url?: string;
  document_url?: string;
  caption?: string;
  profiles: Profile | Profile[];
  isAd?: boolean;
  isSkeleton?: boolean;
  isNew?: boolean;
}

// ====================================================================
// 1. STYLES
// ====================================================================
const getFeedStyles = (colorScheme: ColorSchemeName) => {
  const isDark = colorScheme === 'dark';
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#1E1E1E' : '#FFF', paddingTop: statusBarHeight },
    container: { flex: 1, backgroundColor: isDark ? '#121212' : '#f0f2f5' },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: isDark ? '#1E1E1E' : '#FFF', borderBottomWidth: 0.5, borderColor: isDark ? '#2A2A2A' : '#EFEFEF', flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: isDark ? '#888' : '#666', textAlign: 'center', marginTop: 10 },
    
    errorContainer: { alignItems: 'center', padding: 24, marginTop: 80 },
    errorText: { color: isDark ? '#FF6B6B' : '#D32F2F', textAlign: 'center', marginTop: 12, marginBottom: 16, fontSize: 14 },
    retryBtn: { backgroundColor: '#6200EE', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
    retryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    footerLoader: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
    
    card: { 
      backgroundColor: isDark ? '#1E1E1E' : '#FFF', 
      marginBottom: 10, 
      paddingVertical: 12, 
      borderBottomWidth: 0.4, 
      borderColor: isDark ? '#2A2A2A' : '#EFEFEF' 
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: isDark ? '#333' : '#CCC', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: isDark ? '#FFF' : '#333' },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    
    // ✅ Badge NOUVEAU
    newBadge: {
      backgroundColor: '#6200EE',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    newBadgeText: {
      color: '#FFF',
      fontSize: 9,
      fontWeight: 'bold',
      letterSpacing: 0.5,
    },
    
    mediaContainer: { 
      width: width, 
      height: width * 1.25, 
      backgroundColor: isDark ? '#000' : '#FAFAFA', 
      justifyContent: 'center', 
      position: 'relative' 
    },
    mediaPreviewContainer: { 
      width: width, 
      height: width * 1.50, 
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', 
      overflow: 'hidden' 
    },
    media: { width: '100%', height: '100%' },
    
    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10 },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    interactionText: { fontSize: 13, color: isDark ? '#888' : '#666' },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteText: { fontSize: 13, color: '#FF3B30', fontWeight: '600' },
    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 10, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: isDark ? '#FFF' : '#333' },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
    
    nativeAdCard: { 
      width: 360, height: 270, backgroundColor: isDark ? '#1E1E1E' : '#FFF', 
      marginHorizontal: 16, marginVertical: 12, padding: 12, borderRadius: 12, 
      borderWidth: 0, borderColor: isDark ? '#333' : '#EBEBEB',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 
    },
    nativeAdHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    nativeAdIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#CCC' },
    nativeAdTextContainer: { flex: 1, marginLeft: 10 },
    nativeAdHeadline: { fontWeight: 'bold', color: isDark ? '#FFF' : '#333', fontSize: 15 },
    nativeAdTagline: { color: isDark ? '#AAA' : '#666', fontSize: 12, marginTop: 2 },
    nativeAdMedia: { width: '100%', height: 150, borderRadius: 8, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', marginVertical: 8 },
    nativeAdBadge: { paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#FFA500', borderRadius: 4, marginLeft: 5 },
    nativeAdBadgeText: { fontSize: 10, color: '#FFA500', fontWeight: 'bold' },
    nativeAdButtonContainer: { marginTop: 4 },
    nativeAdButton: { width: '100%', height: 34, backgroundColor: '#6200EE', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    nativeAdButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' }
  }); 
}; 

// ====================================================================
// 2. UTILITAIRES
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

const isVideoUrl = (url: string) => !!url.match(/\.(mp4|mov|mkv|3gp|webm)$/i);

const extractStoragePathAndBucket = (url: string) => {
  try {
    const parts = url.split('/public/');
    if (parts.length === 2) {
      const pathWithBucket = parts[1];
      const firstSlashIndex = pathWithBucket.indexOf('/');
      if (firstSlashIndex !== -1) {
        return { bucket: pathWithBucket.substring(0, firstSlashIndex), path: pathWithBucket.substring(firstSlashIndex + 1) };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
};

// ====================================================================
// 3. COMPOSANTS SECONDAIRES & SKELETONS
// ====================================================================
const PostSkeleton = React.memo(({ isDark, styles }: { isDark: boolean; styles: any }) => (
  <View style={[styles.card, { opacity: 0.6 }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.avatar, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
      <View style={styles.userInfoContainer}>
        <View style={{ height: 14, width: '40%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
        <View style={{ height: 10, width: '20%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginTop: 4 }} />
      </View>
    </View>
    <View style={[styles.mediaContainer, { backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0' }]} />
    <View style={styles.captionContainer}>
      <View style={{ height: 12, width: '90%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginBottom: 6 }} />
      <View style={{ height: 12, width: '60%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
    </View>
  </View>
));

// ====================================================================
// CUSTOM NATIVE AD (avec préchargement)
// ====================================================================
const CustomNativeAd = React.memo(({ isDark, refreshKey, adUnitId, styles }: { isDark: boolean; refreshKey: number; adUnitId: string, styles: any }) => {
  const [nativeAd, setNativeAd] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    // ✅ 1. Utiliser une ad préchargée si disponible (affichage instantané)
    let preloaded: any = null;
    if (adUnitId === TOP_NATIVE_AD_ID && TOP_AD_PRELOADED) {
      preloaded = TOP_AD_PRELOADED;
      TOP_AD_PRELOADED = null;
    } else if (adUnitId === INLINE_NATIVE_AD_ID && INLINE_AD_PRELOADED) {
      preloaded = INLINE_AD_PRELOADED;
      INLINE_AD_PRELOADED = null;
    }

    if (preloaded) {
      setNativeAd(preloaded);
      // Re-précharger pour le prochain slot (légèrement décalé)
      setTimeout(() => {
        preloadAd(adUnitId, (ad) => {
          if (adUnitId === TOP_NATIVE_AD_ID) TOP_AD_PRELOADED = ad;
          else INLINE_AD_PRELOADED = ad;
        });
      }, 400);
    } else {
      // 2. Fallback : chargement direct si aucune ad préchargée n'est prête
      setNativeAd(null);
      NativeAd.createForAdRequest(adUnitId)
        .then((ad) => {
          if (isMounted) setNativeAd(ad);
          else ad?.destroy?.();
        })
        .catch((error) => console.log('Erreur chargement Native Ad:', error));
    }

    return () => { isMounted = false; };
  }, [refreshKey, adUnitId]);

  if (!nativeAd) {
    return (
      <View style={[styles.nativeAdCard, { opacity: 0.5 }]}>
        <View style={styles.nativeAdHeader}>
          <View style={[styles.nativeAdIcon, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
          <View style={styles.nativeAdTextContainer}>
            <View style={{ height: 15, width: '80%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginBottom: 6 }} />
            <View style={{ height: 12, width: '50%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
          </View>
        </View>
        <View style={[styles.nativeAdMedia, { width: '100%', backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
      </View>
    );
  }

  return (
    <View style={styles.nativeAdCard}>
      <NativeAdView nativeAd={nativeAd} style={{ width: '100%' }}>
        <View style={styles.nativeAdHeader}>
          {nativeAd.icon && (
            <NativeAsset assetType={NativeAssetType.ICON}>
              <RNImage source={{ uri: nativeAd.icon.url }} style={styles.nativeAdIcon} />
            </NativeAsset>
          )}
          <View style={styles.nativeAdTextContainer}>
            {nativeAd.headline && (
              <NativeAsset assetType={NativeAssetType.HEADLINE}>
                <Text style={styles.nativeAdHeadline}>{nativeAd.headline}</Text>
              </NativeAsset>
            )}
            {nativeAd.body && (
              <NativeAsset assetType={NativeAssetType.BODY}>
                <Text numberOfLines={1} style={styles.nativeAdTagline}>{nativeAd.body}</Text>
              </NativeAsset>
            )}
          </View>
          <View style={styles.nativeAdBadge}>
            <Text style={styles.nativeAdBadgeText}>Annonce</Text>
          </View>
        </View>
        
        <NativeMediaView style={styles.nativeAdMedia} />
        
        {nativeAd.callToAction && (
          <View style={styles.nativeAdButtonContainer}>
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <View style={styles.nativeAdButton}>
                <Text style={styles.nativeAdButtonText}>{nativeAd.callToAction}</Text>
              </View>
            </NativeAsset>
          </View>
        )}
      </NativeAdView>
    </View>
  );
});

const PreviewVideo = React.memo(({ url }: { url: string }) => {
  const player = useVideoPlayer(url, (p) => { 
    p.loop = true; 
    p.muted = true; 
    p.pause(); 
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} />
    </View>
  );
});

// ====================================================================
// AUDIO COMMENTARY PLAYER (✅ CORRIGÉ : réactivité + gestions erreurs)
// ====================================================================
const AudioCommentaryPlayer = React.memo(({ audioUrl, isDark, styles }: { audioUrl: string; isDark: boolean; styles: any }) => {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  // ✅ On lit depuis `status` (réactif) au lieu de `player.playing` (non réactif)
  const isPlaying = status?.playing ?? false;
  const currentTime = status?.currentTime ?? 0;
  const duration = status?.duration ?? 0;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const togglePlay = useCallback(() => {
    try {
      if (isPlaying) {
        player.pause();
      } else {
        if (duration > 0 && currentTime >= duration - 0.1) {
          player.seekTo(0);
        }
        player.play();
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }, [player, isPlaying, currentTime, duration]);

  return (
    <View style={styles.audioCommentary}>
      <TouchableOpacity 
        style={styles.playButtonCommentary} 
        onPress={togglePlay}
      >
        <Ionicons name={isPlaying ? "pause" : "play"} size={16} color={isDark ? "#FFF" : "#333"} />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={styles.audioText}>Commentaire vocal</Text>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progressPercent}%` }]} /> 
        </View>
      </View>
    </View>
  );
});

const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: { url: string; index: number; styles: any; onMediaError: (url: string) => void; onPress: (index: number) => void }) => {
  const isVideo = isVideoUrl(url);
  return (
    <TouchableOpacity style={styles.mediaPreviewContainer} activeOpacity={0.9} onPress={() => onPress(index)}>
      {isVideo ? (
        <View style={styles.media}>
          <PreviewVideo url={url} />
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons name="play-circle" size={50} color="#FFF" />
          </View>
        </View>
      ) : (
        <Image source={{ uri: url }} style={styles.media} contentFit="cover" cachePolicy="disk" onError={() => onMediaError(url)} transition={200} />
      )}
    </TouchableOpacity>
  );
});

// ====================================================================
// 4. POST CARD (avec badge NOUVEAU)
// ====================================================================
const PostCard = React.memo(({ 
  item, isDark, styles, currentUserId, isSuperuser, onDeleteSuccess, onOpenGallery, onMarkSeen 
}: { 
  item: Post; 
  isDark: boolean; 
  styles: any; 
  currentUserId: string | null; 
  isSuperuser: boolean; 
  onDeleteSuccess: (id: string) => void; 
  onOpenGallery: (urls: string[], index: number) => void;
  onMarkSeen: (id: string) => void;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const rawMediasArray = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const validMedias = useMemo(() => rawMediasArray.filter(url => !failedUrls.has(url)), [rawMediasArray, failedUrls]);

  // ✅ Marquer comme vu dès que la carte est montée
  useEffect(() => {
    onMarkSeen(item.id);
  }, [item.id, onMarkSeen]);

  const handleMediaError = useCallback((failedUrl: string) => {
    setFailedUrls(prev => new Set(prev).add(failedUrl));
  }, []);

  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const handleShare = useCallback(async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.godapps.Ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";
      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
      await Share.share({ message: shareMessage });
    } catch (error: any) { console.error("Erreur de partage :", error.message); }
  }, [item.caption]);

  const handleDeletePost = useCallback(() => {
    const title = isSuperuser && !isOwner ? "Action Modérateur" : "Supprimer la publication";
    Alert.alert(title, "Voulez-vous vraiment supprimer cette publication et tous ses fichiers définitivement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          onDeleteSuccess(item.id);
          try {
            const urlsToDelete: string[] = [...rawMediasArray];
            if (item.audio_url) urlsToDelete.push(item.audio_url);
            if (item.document_url) urlsToDelete.push(item.document_url);

            const bucketsMap: { [bucketName: string]: string[] } = {};
            urlsToDelete.forEach(url => {
              if (url && typeof url === 'string') {
                const fileInfo = extractStoragePathAndBucket(url);
                if (fileInfo) {
                  if (!bucketsMap[fileInfo.bucket]) bucketsMap[fileInfo.bucket] = [];
                  bucketsMap[fileInfo.bucket].push(fileInfo.path);
                }
              }
            });

            await Promise.all(
              Object.entries(bucketsMap).map(([bucket, paths]) =>
                paths.length > 0 ? supabase.storage.from(bucket).remove(paths) : Promise.resolve()
              )
            );

            const { error: dbError } = await supabase.from('posts').delete().eq('id', item.id);
            if (dbError) throw new Error(dbError.message);
          } catch (error: any) {
            Alert.alert("Erreur", "Impossible de supprimer la publication. " + error.message);
          } finally {
            setIsDeleting(false);
          }
        }
      }
    ]);
  }, [item, rawMediasArray, isOwner, isSuperuser, onDeleteSuccess]);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} cachePolicy="disk" transition={200} /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <View style={styles.usernameRow}>
            <Text style={styles.usernameText} numberOfLines={1}>{userName}</Text>
            {item.isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NOUVEAU</Text>
              </View>
            )}
          </View>
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
                onPress={(idx) => onOpenGallery(validMedias, idx)} 
              />
            )}
            keyExtractor={(media, index) => `${item.id}-${index}`}
            horizontal 
            pagingEnabled={true} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 0 }} 
            snapToInterval={width} 
            decelerationRate="fast"
            removeClippedSubviews
            windowSize={3}
            maxToRenderPerBatch={2}
          />
        </View>
      )}
      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}
      {hasValidAudio && <AudioCommentaryPlayer audioUrl={item.audio_url as string} isDark={isDark} styles={styles} />}
      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color={isDark ? '#FFF' : '#333'} />
          </TouchableOpacity>
        </View>
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePost} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <Ionicons name="trash-outline" size={22} color="#FF3B30" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ====================================================================
// 5. COMPOSANT GALERIE PLEIN ÉCRAN
// ====================================================================
const FullScreenVideoRenderer = ({ url, isVisible, styles }: { url: string; isVisible: boolean; styles: any }) => {
  const player = useVideoPlayer(url, (p) => { p.loop = true; });
  useEffect(() => { 
    if (isVisible) player.play();
    else player.pause();
  }, [isVisible, player]);

  return <VideoView player={player} style={styles.fullScreenMedia} contentFit="contain" nativeControls={true} />;
};

const FullScreenGallery = ({ urls, initialIndex, visible, onClose, styles }: { urls: string[], initialIndex: number, visible: boolean, onClose: () => void, styles: any }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;
  
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Ionicons name="close-circle" size={40} color="#FFF" />
        </TouchableOpacity>
        <FlatList
          data={urls}
          renderItem={({ item: url, index }) => {
            const isVideo = isVideoUrl(url);
            const isVisible = visible && currentIndex === index;
            return (
              <View style={styles.fullScreenMediaWrapper}>
                {isVideo ? (
                  <FullScreenVideoRenderer url={url} isVisible={isVisible} styles={styles} />
                ) : (
                  <Image source={{ uri: url }} style={styles.fullScreenMedia} contentFit="contain" cachePolicy="disk" />
                )}
              </View>
            );
          }}
          keyExtractor={(url, index) => `modal-${index}`}
          horizontal pagingEnabled showsHorizontalScrollIndicator={false} initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
          onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={viewabilityConfig}
          removeClippedSubviews={Platform.OS === 'android'} maxToRenderPerBatch={2} windowSize={3}
        />
      </View>
    </Modal>
  );
};

// ====================================================================
// 6. NOTIFICATIONS
// ====================================================================
async function registerForPushNotificationsAsync(userId: string | null): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (!Device.isDevice) {
    console.warn('⚠️ Notifications push : appareil physique requis');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('❌ Permission de notification refusée');
    return null;
  }

  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
      console.error('❌ projectId EAS manquant dans app.json');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('✅ Token Expo obtenu :', token);

    if (userId && token) {
      const { error: deleteError } = await supabase.from('push_tokens').delete().eq('user_id', userId);
      if (deleteError) console.error('❌ Erreur suppression anciens tokens :', deleteError.message);

      const { error: insertError } = await supabase.from('push_tokens').insert({ user_id: userId, token: token });
      if (insertError) console.error('❌ Erreur insert token :', insertError.message);
      else console.log('✅ Token sauvegardé dans push_tokens pour user', userId);
    }
  } catch (e: any) {
    console.error('❌ Erreur getExpoPushTokenAsync :', e.message);
  }

  return token;
}

// ====================================================================
// 7. ÉCRAN PRINCIPAL
// ====================================================================
function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => getFeedStyles(colorScheme), [colorScheme]);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [galleryState, setGalleryState] = useState<{ urls: string[], initialIndex: number, visible: boolean }>({ urls: [], initialIndex: 0, visible: false });

  const isFetchingRef = useRef(false);
  const pureCountRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);

  // ✅ Système "vu / non vu"
  const seenIdsRef = useRef<Set<string>>(new Set());       // set persistant (courant)
  const initialSeenRef = useRef<Set<string>>(new Set());   // snapshot au démarrage
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ Configuration audio
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  }, []);

  // ✅ Chargement initial de la liste des posts vus
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SEEN_KEY);
        if (raw) {
          const arr: string[] = JSON.parse(raw);
          const s = new Set(arr);
          seenIdsRef.current = s;
          initialSeenRef.current = new Set(s); // snapshot figé pour la session
        }
      } catch {}
    })();
  }, []);

  // ✅ Marquer un post comme vu (persistant, debounced)
  const markPostSeen = useCallback((postId: string) => {
    if (!postId || seenIdsRef.current.has(postId)) return;
    seenIdsRef.current.add(postId);

    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      const arr = Array.from(seenIdsRef.current).slice(-SEEN_MAX);
      AsyncStorage.setItem(SEEN_KEY, JSON.stringify(arr)).catch(() => {});
    }, 1500);
  }, []);

  // --- Injection des ads (logique inchangée, mais on préserve isNew) ---
  const processDataWithAds = useCallback((rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    const out: any[] = [];
    let adCount = 0;
    let sinceLastAd = 0;
    // Snapshot : on applique isNew selon les posts vus au démarrage de la session
    const seenSnapshot = initialSeenRef.current;

    for (let i = 0; i < rawData.length; i++) {
      const raw = rawData[i];
      const enriched = {
        ...raw,
        isNew: seenSnapshot.size > 0 && !seenSnapshot.has(raw.id), // pas de badge sur 1er install
      };
      out.push(enriched);
      sinceLastAd++;
      if (sinceLastAd === 5 && adCount < 10) {
        out.push({ isAd: true, id: `ad-inline-${adCount}-${raw.id}` });
        adCount++;
        sinceLastAd = 0;
      }
    }
    pureCountRef.current = rawData.length;
    return out;
  }, []);

  // --- CHARGEMENT PRINCIPAL ---
  const loadPosts = useCallback(async (opts: { skipCache?: boolean } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setError(null);

    try {
      // 1. Cache instantané
      if (!opts.skipCache) {
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            const cachedData = Array.isArray(parsed) ? parsed : (parsed?.data || []);
            const cacheTs = Array.isArray(parsed) ? 0 : (parsed?.ts || 0);
            if (Array.isArray(cachedData) && cachedData.length > 0) {
              setPosts(processDataWithAds(cachedData));
              setLoading(false);
              if (Date.now() - cacheTs < CACHE_TTL) {
                isFetchingRef.current = false;
                setRefreshing(false);
                return;
              }
            }
          } catch (e) {}
        }
      }

      // 2. Requêtes parallèles
      const [sessionRes, postsRes] = await Promise.all([
        supabase.auth.getSession(),
        supabase
          .from('posts')
          .select('*, profiles!user_id(full_name, avatar_url)')
          .order('created_at', { ascending: false })
          .range(0, PAGE_SIZE - 1),
      ]);

      const userId = sessionRes.data.session?.user?.id ?? null;

      if (userId && userId !== currentUserIdRef.current) {
        currentUserIdRef.current = userId;
        setCurrentUserId(userId);
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_superuser')
          .eq('id', userId)
          .single();
        if (profile?.is_superuser) setIsSuperuser(true);
      }

      if (postsRes.error) throw postsRes.error;

      const fresh = postsRes.data || [];
      setPosts(processDataWithAds(fresh));
      setHasMore(fresh.length === PAGE_SIZE);

      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: fresh, ts: Date.now() }));

      if (userId) registerForPushNotificationsAsync(userId).catch(() => {});
    } catch (e: any) {
      console.error("Erreur de récupération :", e);
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [processDataWithAds]);

  // --- PAGINATION ---
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || isFetchingRef.current) return;
    setLoadingMore(true);
    try {
      const from = pureCountRef.current;
      const to = from + PAGE_SIZE - 1;
      const { data, error: err } = await supabase
        .from('posts')
        .select('*, profiles!user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (err) throw err;
      const fresh = data || [];
      setHasMore(fresh.length === PAGE_SIZE);

      setPosts(prev => {
        const purePrev = prev.filter(p => !p.isAd && !p.isSkeleton);
        const existingIds = new Set(purePrev.map(p => p.id));
        const newOnes = fresh.filter(p => !existingIds.has(p.id));
        if (newOnes.length === 0) return prev;
        const all = [...purePrev, ...newOnes];
        return processDataWithAds(all);
      });
    } catch (e: any) {
      console.warn('loadMore:', e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, processDataWithAds]);

  // --- INIT ---
  useEffect(() => {
    let notifListener: Notifications.Subscription | undefined;
    let responseListener: Notifications.Subscription | undefined;

    loadPosts();

    notifListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('🔔 Notification reçue (foreground):', notification);
    });

    responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('👆 Notification tapée:', response);
    });

    return () => {
      notifListener?.remove();
      responseListener?.remove();
      if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    };
  }, [loadPosts]);

  // --- REFRESH ---
  const onRefresh = useCallback(() => { 
    setRefreshing(true); 
    setRefreshKey(prev => prev + 1);
    setHasMore(true);
    // ✅ Re-snapshot de la liste "vue" pour repérer les nouveaux arrivants
    initialSeenRef.current = new Set(seenIdsRef.current);
    loadPosts({ skipCache: true });
  }, [loadPosts]);

  const removePostFromList = useCallback((deletedPostId: string) => { 
    setPosts((currentPosts) => {
      const purePosts = currentPosts.filter(post => !post.isAd && !post.isSkeleton && post.id !== deletedPostId);
      pureCountRef.current = purePosts.length;
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: purePosts, ts: Date.now() })).catch(() => {});
      return processDataWithAds(purePosts);
    });
  }, [processDataWithAds]);

  const handleOpenGallery = useCallback((urls: string[], index: number) => {
    setGalleryState({ urls, initialIndex: index, visible: true });
  }, []);

  const handleCloseGallery = useCallback(() => {
    setGalleryState(prev => ({ ...prev, visible: false }));
  }, []);

  // --- DONNÉES AFFICHÉES ---
  const feedData = useMemo(() => {
    if (loading && posts.length === 0) {
      return [
        { id: 'sk-1', isSkeleton: true },
        { id: 'sk-ad-1', isAd: true },
        { id: 'sk-2', isSkeleton: true },
        { id: 'sk-3', isSkeleton: true },
      ];
    }
    return posts;
  }, [loading, posts]);

  // --- CALLBACKS STABLES ---
  const keyExtractor = useCallback((item: any) => item.id.toString(), []);
  const getItemType = useCallback((item: any) => {
    if (item.isSkeleton) return 'skeleton';
    if (item.isAd) return 'ad';
    return 'post';
  }, []);

  const renderItem = useCallback(({ item }: any) => {
    if (item.isSkeleton) return <PostSkeleton isDark={isDark} styles={styles} />;
    if (item.isAd) return <CustomNativeAd isDark={isDark} refreshKey={refreshKey} adUnitId={INLINE_NATIVE_AD_ID} styles={styles} />;
    return (
      <PostCard 
        item={item as Post} 
        isDark={isDark} 
        styles={styles} 
        currentUserId={currentUserId} 
        isSuperuser={isSuperuser} 
        onDeleteSuccess={removePostFromList} 
        onOpenGallery={handleOpenGallery}
        onMarkSeen={markPostSeen}
      />
    );
  }, [isDark, styles, refreshKey, currentUserId, isSuperuser, removePostFromList, handleOpenGallery, markPostSeen]);

  // --- FOOTER (uniquement loader, plus de "— Fin du fil —") ---
  const ListFooter = useMemo(() => {
    if (loadingMore) {
      return <View style={styles.footerLoader}><ActivityIndicator color="#6200EE" /></View>;
    }
    return null;
  }, [loadingMore, styles]);

  // --- EMPTY / ERREUR ---
  const ListEmpty = useMemo(() => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={50} color={isDark ? '#555' : '#CCC'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadPosts({ skipCache: true }); }}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
        <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
      </View>
    );
  }, [loading, error, isDark, styles, loadPosts]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        
        <FlashList
          data={feedData}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          renderItem={renderItem}
          estimatedItemSize={600}
          drawDistance={1200}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <View style={{ paddingTop: 10, paddingBottom: 5 }}>
              <CustomNativeAd isDark={isDark} refreshKey={refreshKey} adUnitId={TOP_NATIVE_AD_ID} styles={styles} />
            </View>
          }
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} tintColor={isDark ? '#FFF' : '#6200EE'} />}
        />
      </View>
      
      <FullScreenGallery 
        urls={galleryState.urls} 
        initialIndex={galleryState.initialIndex} 
        visible={galleryState.visible} 
        onClose={handleCloseGallery} 
        styles={styles} 
      />
    </SafeAreaView>
  );
}

export default FeedScreen;
*/















import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Dimensions, FlatList, StyleSheet, ActivityIndicator,
  useColorScheme, Alert, Share, SafeAreaView, Platform, StatusBar, RefreshControl,
  Modal, Image as RNImage, ColorSchemeName, ViewToken,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';

import { FlashList } from '@shopify/flash-list';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Image } from 'expo-image';
import { TestIds, NativeAd, NativeAdView, NativeAsset, NativeAssetType, NativeMediaView } from 'react-native-google-mobile-ads';
import { supabase } from '../../lib/supabase';

const { width, height } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// CONFIG & TYPES
// ═══════════════════════════════════════════════════════════════

const TOP_NATIVE_AD_ID = TestIds.NATIVE;
const INLINE_NATIVE_AD_ID = TestIds.NATIVE;



const CACHE_KEY = 'ganbanaaxu_feed_cache';
const SEEN_KEY = 'ganbanaaxu_seen_posts';
const CACHE_TTL = 5 * 60 * 1000;
const PAGE_SIZE = 10;
const SEEN_MAX = 500;


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true,
    shouldPlaySound: true, shouldSetBadge: true,
  }),
});

// Préchargement des ads (démarre à l'import)
let TOP_AD_PRELOADED: any = null;
let INLINE_AD_PRELOADED: any = null;
const preloadAd = (adUnitId: string, onLoaded: (ad: any) => void) => {
  NativeAd.createForAdRequest(adUnitId).then(onLoaded).catch(() => {});
};
preloadAd(TOP_NATIVE_AD_ID, ad => { TOP_AD_PRELOADED = ad; });
preloadAd(INLINE_NATIVE_AD_ID, ad => { INLINE_AD_PRELOADED = ad; });

interface Profile { full_name: string; avatar_url: string | null; is_superuser?: boolean; }
interface Post {
  id: string; user_id: string; created_at: string;
  media_urls: string | string[]; audio_url?: string; document_url?: string;
  caption?: string; profiles: Profile | Profile[];
  isAd?: boolean; isSkeleton?: boolean; isNew?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const getFeedStyles = (colorScheme: ColorSchemeName) => {
  const isDark = colorScheme === 'dark';
  const sb = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0;
  const bg = isDark ? '#121212' : '#f0f2f5';
  const card = isDark ? '#1E1E1E' : '#FFF';
  const txt = isDark ? '#FFF' : '#333';
  const tsec = isDark ? '#888' : '#666';
  const bord = isDark ? '#2A2A2A' : '#EFEFEF';
  const skel = isDark ? '#333' : '#E0E0E0';

  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: card, paddingTop: sb },
    container: { flex: 1, backgroundColor: bg },
    header: { paddingHorizontal: 16, paddingVertical: 15, backgroundColor: card, borderBottomWidth: 0.5, borderColor: bord, flexDirection: 'row', alignItems: 'center' },
    logoText: { fontSize: 24, fontWeight: 'bold', color: 'indigo', letterSpacing: 0.5 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100, paddingHorizontal: 20 },
    emptyText: { fontSize: 16, color: tsec, textAlign: 'center', marginTop: 10 },
    errorContainer: { alignItems: 'center', padding: 24, marginTop: 80 },
    errorText: { color: isDark ? '#FF6B6B' : '#D32F2F', textAlign: 'center', marginTop: 12, marginBottom: 16, fontSize: 14 },
    retryBtn: { backgroundColor: '#6200EE', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
    retryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    footerLoader: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },

    card: { backgroundColor: card, marginBottom: 10, paddingVertical: 12, borderBottomWidth: 0.4, borderColor: bord },
    // ✅ Halo subtil pour les posts non vus
    cardNew: { backgroundColor: isDark ? '#1F1A2E' : '#F5F0FF', borderLeftWidth: 3, borderLeftColor: '#6200EE' },
    cardHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, marginBottom: 10 },
    avatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10, backgroundColor: skel, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    avatarImage: { width: '100%', height: '100%' },
    userInfoContainer: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    usernameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    usernameText: { fontWeight: 'bold', fontSize: 15, color: txt },
    dateText: { fontSize: 11, color: isDark ? '#666' : '#999' },
    newBadge: { backgroundColor: '#6200EE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    newBadgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold', letterSpacing: 0.5 },

    mediaContainer: { width, height: width * 1.25, backgroundColor: isDark ? '#000' : '#FAFAFA', justifyContent: 'center', position: 'relative' },
    mediaPreviewContainer: { width, height: width * 1.50, backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', overflow: 'hidden' },
    media: { width: '100%', height: '100%' },

    captionContainer: { paddingHorizontal: 12, marginTop: 10 },
    captionText: { fontSize: 14, color: isDark ? '#DDD' : '#444', lineHeight: 18 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, marginTop: 12, paddingTop: 10 },
    interactionRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    interactionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },

    audioCommentary: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#222' : '#F9F9F9', marginHorizontal: 12, marginTop: 10, padding: 8, borderRadius: 8, gap: 10, borderLeftWidth: 3, borderColor: '#6200EE' },
    playButtonCommentary: { backgroundColor: isDark ? '#333' : '#E0E0E0', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    audioInfo: { flex: 1, gap: 4 },
    audioText: { fontSize: 13, fontWeight: '600', color: txt },
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2, overflow: 'hidden' },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },

    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    fullScreenMediaWrapper: { width, height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },

    nativeAdCard: { width: 360, height: 270, backgroundColor: card, marginHorizontal: 16, marginVertical: 12, padding: 12, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 2 },
    nativeAdHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    nativeAdIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#CCC' },
    nativeAdTextContainer: { flex: 1, marginLeft: 10 },
    nativeAdHeadline: { fontWeight: 'bold', color: txt, fontSize: 15 },
    nativeAdTagline: { color: tsec, fontSize: 12, marginTop: 2 },
    nativeAdMedia: { width: '100%', height: 150, borderRadius: 8, backgroundColor: skel, marginVertical: 8 },
    nativeAdBadge: { paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#FFA500', borderRadius: 4, marginLeft: 5 },
    nativeAdBadgeText: { fontSize: 10, color: '#FFA500', fontWeight: 'bold' },
    nativeAdButtonContainer: { marginTop: 4 },
    nativeAdButton: { width: '100%', height: 34, backgroundColor: '#6200EE', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    nativeAdButtonText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  });
};

// ═══════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════
const extractValidUrls = (data: any): string[] => {
  if (!data) return [];
  try {
    let p = typeof data === 'string' ? JSON.parse(data) : data;
    if (!Array.isArray(p)) p = [p];
    return p.filter((u: any) => typeof u === 'string' && u.startsWith('http') && u.length > 15);
  } catch {
    const regex = /(https?:\/\/[^\s"',\]}]+)/g;
    return (typeof data === 'string' ? data : JSON.stringify(data)).match(regex) || [];
  }
};

const isVideoUrl = (url: string) => /\.(mp4|mov|mkv|3gp|webm)$/i.test(url);

const extractStoragePathAndBucket = (url: string) => {
  try {
    const parts = url.split('/public/');
    if (parts.length !== 2) return null;
    const pathWithBucket = parts[1];
    const i = pathWithBucket.indexOf('/');
    if (i === -1) return null;
    return { bucket: pathWithBucket.substring(0, i), path: pathWithBucket.substring(i + 1) };
  } catch { return null; }
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS SECONDAIRES
// ═══════════════════════════════════════════════════════════════
const PostSkeleton = React.memo(({ isDark, styles }: any) => (
  <View style={[styles.card, { opacity: 0.6 }]}>
    <View style={styles.cardHeader}>
      <View style={[styles.avatar, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
      <View style={styles.userInfoContainer}>
        <View style={{ height: 14, width: '40%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
        <View style={{ height: 10, width: '20%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginTop: 4 }} />
      </View>
    </View>
    <View style={[styles.mediaContainer, { backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0' }]} />
    <View style={styles.captionContainer}>
      <View style={{ height: 12, width: '90%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginBottom: 6 }} />
      <View style={{ height: 12, width: '60%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
    </View>
  </View>
));

const CustomNativeAd = React.memo(({ isDark, refreshKey, adUnitId, styles }: any) => {
  const [nativeAd, setNativeAd] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    let preloaded = null;
    if (adUnitId === TOP_NATIVE_AD_ID && TOP_AD_PRELOADED) { preloaded = TOP_AD_PRELOADED; TOP_AD_PRELOADED = null; }
    else if (adUnitId === INLINE_NATIVE_AD_ID && INLINE_AD_PRELOADED) { preloaded = INLINE_AD_PRELOADED; INLINE_AD_PRELOADED = null; }

    if (preloaded) {
      setNativeAd(preloaded);
      setTimeout(() => {
        preloadAd(adUnitId, ad => {
          if (adUnitId === TOP_NATIVE_AD_ID) TOP_AD_PRELOADED = ad;
          else INLINE_AD_PRELOADED = ad;
        });
      }, 400);
    } else {
      setNativeAd(null);
      NativeAd.createForAdRequest(adUnitId)
        .then(ad => { if (isMounted) setNativeAd(ad); else ad?.destroy?.(); })
        .catch(e => console.log('Ad err:', e));
    }
    return () => { isMounted = false; };
  }, [refreshKey, adUnitId]);

  if (!nativeAd) {
    return (
      <View style={[styles.nativeAdCard, { opacity: 0.5 }]}>
        <View style={styles.nativeAdHeader}>
          <View style={[styles.nativeAdIcon, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
          <View style={styles.nativeAdTextContainer}>
            <View style={{ height: 15, width: '80%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4, marginBottom: 6 }} />
            <View style={{ height: 12, width: '50%', backgroundColor: isDark ? '#333' : '#E0E0E0', borderRadius: 4 }} />
          </View>
        </View>
        <View style={[styles.nativeAdMedia, { width: '100%', backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
      </View>
    );
  }

  return (
    <View style={styles.nativeAdCard}>
      <NativeAdView nativeAd={nativeAd} style={{ width: '100%' }}>
        <View style={styles.nativeAdHeader}>
          {nativeAd.icon && <NativeAsset assetType={NativeAssetType.ICON}><RNImage source={{ uri: nativeAd.icon.url }} style={styles.nativeAdIcon} /></NativeAsset>}
          <View style={styles.nativeAdTextContainer}>
            {nativeAd.headline && <NativeAsset assetType={NativeAssetType.HEADLINE}><Text style={styles.nativeAdHeadline}>{nativeAd.headline}</Text></NativeAsset>}
            {nativeAd.body && <NativeAsset assetType={NativeAssetType.BODY}><Text numberOfLines={1} style={styles.nativeAdTagline}>{nativeAd.body}</Text></NativeAsset>}
          </View>
          <View style={styles.nativeAdBadge}><Text style={styles.nativeAdBadgeText}>Annonce</Text></View>
        </View>
        <NativeMediaView style={styles.nativeAdMedia} />
        {nativeAd.callToAction && (
          <View style={styles.nativeAdButtonContainer}>
            <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
              <View style={styles.nativeAdButton}><Text style={styles.nativeAdButtonText}>{nativeAd.callToAction}</Text></View>
            </NativeAsset>
          </View>
        )}
      </NativeAdView>
    </View>
  );
});

const PreviewVideo = React.memo(({ url }: any) => {
  const player = useVideoPlayer(url, p => { p.loop = true; p.muted = true; p.pause(); });
  return <View style={StyleSheet.absoluteFill}><VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} /></View>;
});

const AudioCommentaryPlayer = React.memo(({ audioUrl, isDark, styles }: any) => {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);
  const isPlaying = status?.playing ?? false;
  const cur = status?.currentTime ?? 0;
  const dur = status?.duration ?? 0;
  const pct = dur > 0 ? (cur / dur) * 100 : 0;

  const toggle = useCallback(() => {
    try {
      if (isPlaying) player.pause();
      else { if (dur > 0 && cur >= dur - 0.1) player.seekTo(0); player.play(); }
    } catch (e) { console.warn(e); }
  }, [player, isPlaying, cur, dur]);

  return (
    <View style={styles.audioCommentary}>
      <TouchableOpacity style={styles.playButtonCommentary} onPress={toggle}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={isDark ? '#FFF' : '#333'} />
      </TouchableOpacity>
      <View style={styles.audioInfo}>
        <Text style={styles.audioText}>Commentaire vocal</Text>
        <View style={styles.progressContainer}><View style={[styles.progressBar, { width: `${pct}%` }]} /></View>
      </View>
    </View>
  );
});

const MediaRenderer = React.memo(({ url, index, styles, onMediaError, onPress }: any) => {
  const isVideo = isVideoUrl(url);
  return (
    <TouchableOpacity style={styles.mediaPreviewContainer} activeOpacity={0.9} onPress={() => onPress(index)}>
      {isVideo ? (
        <View style={styles.media}>
          <PreviewVideo url={url} />
          <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }]}>
            <Ionicons name="play-circle" size={50} color="#FFF" />
          </View>
        </View>
      ) : (
        <Image source={{ uri: url }} style={styles.media} contentFit="cover" cachePolicy="disk" onError={() => onMediaError(url)} transition={200} />
      )}
    </TouchableOpacity>
  );
});

// ═══════════════════════════════════════════════════════════════
// POST CARD
// ═══════════════════════════════════════════════════════════════
const PostCard = React.memo(({ item, isDark, styles, currentUserId, isSuperuser, onDeleteSuccess, onOpenGallery, onMarkSeen }: any) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  const isOwner = currentUserId !== null && currentUserId === item.user_id;
  const canDelete = isOwner || isSuperuser;

  const rawMedias = useMemo(() => extractValidUrls(item.media_urls), [item.media_urls]);
  const validMedias = useMemo(() => rawMedias.filter(u => !failedUrls.has(u)), [rawMedias, failedUrls]);

  useEffect(() => { onMarkSeen(item.id); }, [item.id, onMarkSeen]);

  const handleMediaError = useCallback((u: string) => setFailedUrls(p => new Set(p).add(u)), []);
  const hasValidAudio = typeof item.audio_url === 'string' && item.audio_url.startsWith('http');
  const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
  const userName = profileData?.full_name || 'Anonyme';
  const userAvatar = profileData?.avatar_url || null;

  const handleShare = useCallback(async () => {
    try {
      const android = 'https://play.google.com/store/apps/details?id=com.godapps.Ganbanaaxu';
      const ios = 'https://apps.apple.com/app/idTON_ID_APPLE';
      const msg = item.caption
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur Ganbanaaxu !\nAndroid : ${android}\niOS : ${ios}`
        : `Rejoignez-moi sur Ganbanaaxu !\nAndroid : ${android}\niOS : ${ios}`;
      await Share.share({ message: msg });
    } catch (e: any) { console.error(e.message); }
  }, [item.caption]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      isSuperuser && !isOwner ? 'Action Modérateur' : 'Supprimer',
      'Supprimer cette publication et tous ses fichiers ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          setIsDeleting(true);
          onDeleteSuccess(item.id);
          try {
            const urls = [...rawMedias];
            if (item.audio_url) urls.push(item.audio_url);
            if (item.document_url) urls.push(item.document_url);
            const map: { [b: string]: string[] } = {};
            urls.forEach(u => {
              if (!u) return;
              const info = extractStoragePathAndBucket(u);
              if (info) { if (!map[info.bucket]) map[info.bucket] = []; map[info.bucket].push(info.path); }
            });
            await Promise.all(Object.entries(map).map(([b, paths]) => paths.length > 0 ? supabase.storage.from(b).remove(paths) : Promise.resolve()));
            const { error } = await supabase.from('posts').delete().eq('id', item.id);
            if (error) throw error;
          } catch (e: any) { Alert.alert('Erreur', 'Suppression impossible. ' + e.message); }
          finally { setIsDeleting(false); }
        }},
      ]
    );
  }, [item, rawMedias, isOwner, isSuperuser, onDeleteSuccess]);

  return (
    <View style={[styles.card, item.isNew && styles.cardNew]}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          {userAvatar
            ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} cachePolicy="disk" transition={200} />
            : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
        </View>
        <View style={styles.userInfoContainer}>
          <View style={styles.usernameRow}>
            <Text style={styles.usernameText} numberOfLines={1}>{userName}</Text>
            {item.isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NOUVEAU</Text></View>}
          </View>
          <Text style={styles.dateText}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Date inconnue'}</Text>
        </View>
      </View>

      {validMedias.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={validMedias}
            renderItem={({ item: url, index }: any) => (
              <MediaRenderer url={url} index={index} styles={styles} onMediaError={handleMediaError} onPress={(i: number) => onOpenGallery(validMedias, i)} />
            )}
            keyExtractor={(_: any, i: number) => `${item.id}-${i}`}
            horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            snapToInterval={width} decelerationRate="fast"
            removeClippedSubviews windowSize={3} maxToRenderPerBatch={2}
          />
        </View>
      )}
      {item.caption ? <View style={styles.captionContainer}><Text style={styles.captionText}>{item.caption}</Text></View> : null}
      {hasValidAudio && <AudioCommentaryPlayer audioUrl={item.audio_url} isDark={isDark} styles={styles} />}
      <View style={styles.cardFooter}>
        <View style={styles.interactionRow}>
          <TouchableOpacity style={styles.interactionButton} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color={isDark ? '#FFF' : '#333'} />
          </TouchableOpacity>
        </View>
        {canDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={isDeleting}>
            {isDeleting ? <ActivityIndicator size="small" color="#FF3B30" /> : <Ionicons name="trash-outline" size={22} color="#FF3B30" />}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// GALERIE PLEIN ÉCRAN
// ═══════════════════════════════════════════════════════════════
const FullScreenVideoRenderer = ({ url, isVisible, styles }: any) => {
  const player = useVideoPlayer(url, p => { p.loop = true; });
  useEffect(() => { isVisible ? player.play() : player.pause(); }, [isVisible, player]);
  return <VideoView player={player} style={styles.fullScreenMedia} contentFit="contain" nativeControls />;
};

const FullScreenGallery = ({ urls, initialIndex, visible, onClose, styles }: any) => {
  const [idx, setIdx] = useState(initialIndex);
  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0) setIdx(viewableItems[0].index ?? 0);
  }).current;
  const viewConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
          <Ionicons name="close-circle" size={40} color="#FFF" />
        </TouchableOpacity>
        <FlatList
          data={urls}
          renderItem={({ item: url, index }: any) => (
            <View style={styles.fullScreenMediaWrapper}>
              {isVideoUrl(url)
                ? <FullScreenVideoRenderer url={url} isVisible={visible && idx === index} styles={styles} />
                : <Image source={{ uri: url }} style={styles.fullScreenMedia} contentFit="contain" cachePolicy="disk" />}
            </View>
          )}
          keyExtractor={(_: any, i: number) => `m-${i}`}
          horizontal pagingEnabled showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onViewableItemsChanged={onViewable} viewabilityConfig={viewConfig}
          removeClippedSubviews={Platform.OS === 'android'} maxToRenderPerBatch={2} windowSize={3}
        />
      </View>
    </Modal>
  );
};

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS PUSH
// ═══════════════════════════════════════════════════════════════
async function registerForPushNotificationsAsync(userId: string | null) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default', importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250], lightColor: '#FF231F7C',
    });
  }
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let final = existing;
  if (existing !== 'granted') final = (await Notifications.requestPermissionsAsync()).status;
  if (final !== 'granted') return null;

  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) return null;
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (userId && token) {
      await supabase.from('push_tokens').delete().eq('user_id', userId);
      await supabase.from('push_tokens').insert({ user_id: userId, token });
    }
    return token;
  } catch (e: any) { console.error(e.message); return null; }
}

// ═══════════════════════════════════════════════════════════════
// ÉCRAN PRINCIPAL
// ═══════════════════════════════════════════════════════════════
function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => getFeedStyles(colorScheme), [colorScheme]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [seenLoaded, setSeenLoaded] = useState(false);
  const [gallery, setGallery] = useState({ urls: [] as string[], initialIndex: 0, visible: false });

  const isFetchingRef = useRef(false);
  const pureCountRef = useRef(0);
  const currentUserIdRef = useRef<string | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialSeenRef = useRef<Set<string>>(new Set());
  const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstFocusRef = useRef(true); // ← distingue 1er focus / retours suivants

  // Config audio + chargement vu-set
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SEEN_KEY);
        if (raw) seenIdsRef.current = new Set(JSON.parse(raw));
      } catch {}
      initialSeenRef.current = new Set(seenIdsRef.current);
      setSeenLoaded(true);
    })();
    return () => { if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current); };
  }, []);

  // Marquer vu (debounced persistance)
  const markPostSeen = useCallback((postId: string) => {
    if (!postId || seenIdsRef.current.has(postId)) return;
    seenIdsRef.current.add(postId);
    if (persistTimeoutRef.current) clearTimeout(persistTimeoutRef.current);
    persistTimeoutRef.current = setTimeout(() => {
      const arr = Array.from(seenIdsRef.current).slice(-SEEN_MAX);
      AsyncStorage.setItem(SEEN_KEY, JSON.stringify(arr)).catch(() => {});
    }, 1500);
  }, []);

  // Injection ads + flag isNew (basé sur le snapshot du focus courant)
  const processDataWithAds = useCallback((rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    const out: any[] = [];
    let adCount = 0, sinceAd = 0;
    const snapshot = initialSeenRef.current;
    for (let i = 0; i < rawData.length; i++) {
      const raw = rawData[i];
      // ✅ isNew calculé contre le snapshot actuel (mis à jour à chaque focus)
      out.push({ ...raw, isNew: snapshot.size > 0 && !snapshot.has(raw.id) });
      sinceAd++;
      if (sinceAd === 5 && adCount < 10) {
        out.push({ isAd: true, id: `ad-${adCount}-${raw.id}` });
        adCount++; sinceAd = 0;
      }
    }
    pureCountRef.current = rawData.length;
    return out;
  }, []);

  // Chargement principal
  const loadPosts = useCallback(async (opts: { skipCache?: boolean } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setError(null);

    try {
      if (!opts.skipCache) {
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          try {
            const parsed = JSON.parse(cachedRaw);
            const data = Array.isArray(parsed) ? parsed : (parsed?.data || []);
            const ts = Array.isArray(parsed) ? 0 : (parsed?.ts || 0);
            if (Array.isArray(data) && data.length > 0) {
              setPosts(processDataWithAds(data));
              setLoading(false);
              if (Date.now() - ts < CACHE_TTL) { isFetchingRef.current = false; setRefreshing(false); return; }
            }
          } catch {}
        }
      }

      const [sessionRes, postsRes] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from('posts').select('*, profiles!user_id(full_name, avatar_url)').order('created_at', { ascending: false }).range(0, PAGE_SIZE - 1),
      ]);

      const userId = sessionRes.data.session?.user?.id ?? null;
      if (userId && userId !== currentUserIdRef.current) {
        currentUserIdRef.current = userId;
        setCurrentUserId(userId);
        const { data: profile } = await supabase.from('profiles').select('is_superuser').eq('id', userId).single();
        if (profile?.is_superuser) setIsSuperuser(true);
      }

      if (postsRes.error) throw postsRes.error;
      const fresh = postsRes.data || [];
      setPosts(processDataWithAds(fresh));
      setHasMore(fresh.length === PAGE_SIZE);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: fresh, ts: Date.now() }));
      if (userId) registerForPushNotificationsAsync(userId).catch(() => {});
    } catch (e: any) {
      console.error('Load err:', e);
      setError(e.message || 'Erreur de chargement');
    } finally {
      setLoading(false); setRefreshing(false); isFetchingRef.current = false;
    }
  }, [processDataWithAds]);

  // Pagination
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading || isFetchingRef.current) return;
    setLoadingMore(true);
    try {
      const from = pureCountRef.current;
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await supabase.from('posts').select('*, profiles!user_id(full_name, avatar_url)').order('created_at', { ascending: false }).range(from, to);
      if (error) throw error;
      const fresh = data || [];
      setHasMore(fresh.length === PAGE_SIZE);
      setPosts(prev => {
        const pure = prev.filter(p => !p.isAd && !p.isSkeleton);
        const ids = new Set(pure.map(p => p.id));
        const newOnes = fresh.filter(p => !ids.has(p.id));
        if (newOnes.length === 0) return prev;
        return processDataWithAds([...pure, ...newOnes]);
      });
    } catch (e: any) { console.warn('loadMore:', e.message); }
    finally { setLoadingMore(false); }
  }, [hasMore, loadingMore, loading, processDataWithAds]);

  // ✅ RELOAD DU FEED À CHAQUE FOCUS DE L'ÉCRAN
  // - 1er focus (ouverture app) : charge le cache puis rafraîchit
  // - Focus suivants : snapshot du vu-set AVANT chargement → posts non vus = badge NOUVEAU + halo
  useFocusEffect(
    useCallback(() => {
      if (!seenLoaded) return;
      const isFirst = isFirstFocusRef.current;
      isFirstFocusRef.current = false;

      if (!isFirst) {
        // Snapshot avant reload → nouveau badge pour ce qui arrive
        initialSeenRef.current = new Set(seenIdsRef.current);
        setRefreshKey(p => p + 1);
        setHasMore(true);
      }
      loadPosts({ skipCache: !isFirst });
    }, [seenLoaded, loadPosts])
  );

  // Listeners notifications
  useEffect(() => {
    const n1 = Notifications.addNotificationReceivedListener(n => console.log('🔔', n));
    const n2 = Notifications.addNotificationResponseReceivedListener(r => console.log('👆', r));
    return () => { n1?.remove(); n2?.remove(); };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey(p => p + 1);
    setHasMore(true);
    initialSeenRef.current = new Set(seenIdsRef.current); // snapshot frais
    loadPosts({ skipCache: true });
  }, [loadPosts]);

  const removePostFromList = useCallback((id: string) => {
    setPosts(cur => {
      const pure = cur.filter(p => !p.isAd && !p.isSkeleton && p.id !== id);
      pureCountRef.current = pure.length;
      AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: pure, ts: Date.now() })).catch(() => {});
      return processDataWithAds(pure);
    });
  }, [processDataWithAds]);

  const handleOpenGallery = useCallback((urls: string[], index: number) => {
    setGallery({ urls, initialIndex: index, visible: true });
  }, []);
  const handleCloseGallery = useCallback(() => setGallery(p => ({ ...p, visible: false })), []);

  const feedData = useMemo(() => {
    if (loading && posts.length === 0) {
      return [
        { id: 'sk-1', isSkeleton: true },
        { id: 'sk-ad-1', isAd: true },
        { id: 'sk-2', isSkeleton: true },
        { id: 'sk-3', isSkeleton: true },
      ];
    }
    return posts;
  }, [loading, posts]);

  const keyExtractor = useCallback((item: any) => item.id.toString(), []);
  const getItemType = useCallback((item: any) => item.isSkeleton ? 'skeleton' : item.isAd ? 'ad' : 'post', []);

  const renderItem = useCallback(({ item }: any) => {
    if (item.isSkeleton) return <PostSkeleton isDark={isDark} styles={styles} />;
    if (item.isAd) return <CustomNativeAd isDark={isDark} refreshKey={refreshKey} adUnitId={INLINE_NATIVE_AD_ID} styles={styles} />;
    return (
      <PostCard
        item={item} isDark={isDark} styles={styles}
        currentUserId={currentUserId} isSuperuser={isSuperuser}
        onDeleteSuccess={removePostFromList}
        onOpenGallery={handleOpenGallery}
        onMarkSeen={markPostSeen}
      />
    );
  }, [isDark, styles, refreshKey, currentUserId, isSuperuser, removePostFromList, handleOpenGallery, markPostSeen]);

  const ListFooter = useMemo(() => loadingMore ? (
    <View style={styles.footerLoader}><ActivityIndicator color="#6200EE" /></View>
  ) : null, [loadingMore, styles]);

  const ListEmpty = useMemo(() => {
    if (loading) return null;
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline-outline" size={50} color={isDark ? '#555' : '#CCC'} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); loadPosts({ skipCache: true }); }}>
            <Text style={styles.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
        <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
      </View>
    );
  }, [loading, error, isDark, styles, loadPosts]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.logoText}>Ganbanaaxu</Text></View>

        <FlashList
          data={feedData}
          keyExtractor={keyExtractor}
          getItemType={getItemType}
          renderItem={renderItem}
          estimatedItemSize={600}
          drawDistance={1200}
          onEndReached={loadMore}
          onEndReachedThreshold={0.6}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <View style={{ paddingTop: 10, paddingBottom: 5 }}>
              <CustomNativeAd isDark={isDark} refreshKey={refreshKey} adUnitId={TOP_NATIVE_AD_ID} styles={styles} />
            </View>
          }
          ListFooterComponent={ListFooter}
          ListEmptyComponent={ListEmpty}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#6200EE']} tintColor={isDark ? '#FFF' : '#6200EE'} />}
        />
      </View>

      <FullScreenGallery
        urls={gallery.urls}
        initialIndex={gallery.initialIndex}
        visible={gallery.visible}
        onClose={handleCloseGallery}
        styles={styles}
      />
    </SafeAreaView>
  );
}

export default FeedScreen;





















