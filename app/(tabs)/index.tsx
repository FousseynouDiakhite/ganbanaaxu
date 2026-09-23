













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

// En production (remplacez par votre vrai ID AdMob fourni par Google)
// const TOP_NATIVE_AD_ID = Platform.OS === 'android' 
//   ? 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY' 
//   : 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ';

// const INLINE_NATIVE_AD_ID = Platform.OS === 'android' 
//   ? 'ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY' 
//   : 'ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
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
  file_url?: string;
  document_url?: string;
  caption?: string;
  profiles: Profile | Profile[];
  isAd?: boolean;
  isSkeleton?: boolean;
}

// ====================================================================
// 1. STYLES (Modifiés façon Instagram)
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
    
    // Modification du cadre des posts (bord à bord)
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
    
    // Médias format Instagram (ratio 4:5, largeur = écran complet)
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
    media: { 
      width: '100%', 
      height: '100%' 
    },
    
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
    progressContainer: { width: '100%', height: 4, backgroundColor: isDark ? '#444' : '#DDD', borderRadius: 2 },
    progressBar: { height: '100%', backgroundColor: '#6200EE', borderRadius: 2 },
    
    // Fullscreen et Ads
    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
    modalCloseButton: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 },
    fullScreenMediaWrapper: { width: width, height: height, justifyContent: 'center', alignItems: 'center' },
    fullScreenMedia: { width: '100%', height: '100%' },
    
    // --- Style de la pub (Réduit et formaté en carte) ---
    nativeAdCard: { 
      width: 360,
      height: 270,
      backgroundColor: isDark ? '#1E1E1E' : '#FFF', 
      marginHorizontal: 16, 
      marginVertical: 12, 
      padding: 12, 
      borderRadius: 12, 
      borderWidth: 0, 
      borderColor: isDark ? '#333' : '#EBEBEB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2 
    },
    nativeAdHeader: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 8 
    },
    nativeAdIcon: { 
      width: 40, 
      height: 40, 
      borderRadius: 8, 
      backgroundColor: '#CCC' 
    },
    nativeAdTextContainer: { 
      flex: 1, 
      marginLeft: 10 
    },
    nativeAdHeadline: { 
      fontWeight: 'bold', 
      color: isDark ? '#FFF' : '#333', 
      fontSize: 15 
    },
    nativeAdTagline: { 
      color: isDark ? '#AAA' : '#666', 
      fontSize: 12, 
      marginTop: 2 
    },
    nativeAdMedia: { 
      width: '100%', 
      height: 150, 
      borderRadius: 8, 
      backgroundColor: isDark ? '#2A2A2A' : '#E0E0E0', 
      marginVertical: 8 
    },
    nativeAdBadge: { 
      paddingHorizontal: 5, 
      paddingVertical: 2, 
      borderWidth: 1, 
      borderColor: '#FFA500', 
      borderRadius: 4, 
      marginLeft: 5 
    },
    nativeAdBadgeText: { 
      fontSize: 10, 
      color: '#FFA500', 
      fontWeight: 'bold' 
    },
    nativeAdButtonContainer: { 
      marginTop: 4 
    },
    nativeAdButton: { 
      width: '100%', 
      height: 34, 
      backgroundColor: '#6200EE', 
      borderRadius: 8, 
      justifyContent: 'center', 
      alignItems: 'center' 
    },
    nativeAdButtonText: { 
      color: '#FFF', 
      fontSize: 15, 
      fontWeight: 'bold' 
    }
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
        <View style={[styles.nativeAdButtonContainer, { marginTop: 4 }]}>
          <View style={[styles.nativeAdButton, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
        </View>
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
  const isPlaying = status.isPlaying;

  return (
    <View style={styles.audioCommentary}>
      <TouchableOpacity style={styles.playButtonCommentary} onPress={() => (isPlaying ? player.pause() : player.play())}>
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
        <Image source={{ uri: url }} style={styles.media} contentFit="cover" cachePolicy="disk" onError={() => onMediaError(url)} />
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

  const handleShare = async () => {
    try {
      const playStoreLink = "https://play.google.com/store/apps/details?id=com.godapps.Ganbanaaxu";
      const appStoreLink = "https://apps.apple.com/app/idTON_ID_APPLE";
      const shareMessage = item.caption 
        ? `« ${item.caption} »\n\nDécouvrez plus de contenus sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`
        : `Rejoignez-moi sur l'application Ganbanaaxu !\nTéléchargez ici :\nAndroid : ${playStoreLink}\niOS : ${appStoreLink}`;
      await Share.share({ message: shareMessage });
    } catch (error: any) { console.error("Erreur de partage :", error.message); }
  };

  const handleDeletePost = () => {
    const title = isSuperuser && !isOwner ? "Action Modérateur" : "Supprimer la publication";
    Alert.alert(title, "Voulez-vous vraiment supprimer cette publication et tous ses fichiers définitivement ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer", style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          try {
            const urlsToDelete: string[] = [...rawMediasArray];
            if (item.audio_url) urlsToDelete.push(item.audio_url);
            if (item.file_url) urlsToDelete.push(item.file_url); 
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

            for (const [bucket, paths] of Object.entries(bucketsMap)) {
              if (paths.length > 0) await supabase.storage.from(bucket).remove(paths);
            }

            const { error: dbError } = await supabase.from('posts').delete().eq('id', item.id);
            if (dbError) throw new Error(dbError.message);
            onDeleteSuccess(item.id);
          } catch (error: any) {
            Alert.alert("Erreur", "Impossible de supprimer la publication. " + error.message);
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
          {userAvatar ? <Image source={{ uri: userAvatar }} style={styles.avatarImage} cachePolicy="disk" /> : <Ionicons name="person-circle-outline" size={42} color={isDark ? '#FFF' : '#333'} />}
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
}

// ====================================================================
// 6. ÉCRAN PRINCIPAL
// ====================================================================
function FeedScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => getFeedStyles(colorScheme), [colorScheme]);
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [galleryState, setGalleryState] = useState<{ urls: string[], initialIndex: number, visible: boolean }>({ urls: [], initialIndex: 0, visible: false });

  const processDataWithAds = useCallback((rawData: any[]) => {
    if (!Array.isArray(rawData)) return [];
    let postsWithAds = [];
    let adCount = 0;
    let postCountSinceLastAd = 0;

    for (let i = 0; i < rawData.length; i++) {
      postsWithAds.push(rawData[i]);
      postCountSinceLastAd++;
      
      if (postCountSinceLastAd === 5 && adCount < 10) {
        postsWithAds.push({ isAd: true, id: `ad-inline-${adCount}` });
        adCount++;
        postCountSinceLastAd = 0;
      }
    }
    return postsWithAds;
  }, []);

  const fetchUserAndPosts = async () => {
    try {
      const cachedPosts = await AsyncStorage.getItem('ganbanaaxu_feed_cache');
      if (cachedPosts) {
        setPosts(processDataWithAds(JSON.parse(cachedPosts)));
        setLoading(false); 
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);
        const { data: profile } = await supabase.from('profiles').select('is_superuser').eq('id', session.user.id).single();
        if (profile?.is_superuser) setIsSuperuser(true);
      }

      const { data, error } = await supabase.from('posts').select('*, profiles!user_id(full_name, avatar_url)').order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setPosts(processDataWithAds(data));
        await AsyncStorage.setItem('ganbanaaxu_feed_cache', JSON.stringify(data));
      }
      
    } catch (error) {
      console.error("Erreur de récupération :", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserAndPosts();
  }, []);

  const onRefresh = useCallback(() => { 
    setRefreshing(true); 
    setRefreshKey(prev => prev + 1); 
    fetchUserAndPosts(); 
  }, []);

  const removePostFromList = useCallback((deletedPostId: string) => { 
    setPosts((currentPosts) => {
      const remainingPosts = currentPosts.filter(post => post.id !== deletedPostId);
      const purePosts = remainingPosts.filter(item => !item.isAd);
      AsyncStorage.setItem('ganbanaaxu_feed_cache', JSON.stringify(purePosts)).catch(err => console.error("Erreur cache :", err));
      return processDataWithAds(purePosts);
    });
  }, [processDataWithAds]);

  const handleOpenGallery = useCallback((urls: string[], index: number) => {
    setGalleryState({ urls, initialIndex: index, visible: true });
  }, []);

  const handleCloseGallery = useCallback(() => {
    setGalleryState(prev => ({ ...prev, visible: false }));
  }, []);

  // Détermination des données à afficher (Squelettes si chargement initial sans posts)
  const feedData = loading && posts.length === 0 ? [
    { id: 'sk-1', isSkeleton: true },
    { id: 'sk-ad-1', isAd: true },
    { id: 'sk-2', isSkeleton: true },
    { id: 'sk-3', isSkeleton: true },
  ] : posts;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logoText}>Ganbanaaxu</Text>
        </View>
        
        <FlashList
          data={feedData}
          keyExtractor={(item) => item.id.toString()}
          getItemType={(item) => {
            if (item.isSkeleton) return 'skeleton';
            if (item.isAd) return 'ad';
            return 'post';
          }}
          ListHeaderComponent={
            <View style={{ paddingTop: 10, paddingBottom: 5 }}>
              <CustomNativeAd isDark={isDark} refreshKey={refreshKey} adUnitId={TOP_NATIVE_AD_ID} styles={styles} />
            </View>
          }
          renderItem={({ item }) => {
            if (item.isSkeleton) {
              return <PostSkeleton isDark={isDark} styles={styles} />;
            }
            if (item.isAd) {
              return <CustomNativeAd isDark={isDark} refreshKey={refreshKey} adUnitId={INLINE_NATIVE_AD_ID} styles={styles} />;
            }
            return (
              <PostCard 
                item={item} 
                isDark={isDark} 
                styles={styles} 
                currentUserId={currentUserId} 
                isSuperuser={isSuperuser} 
                onDeleteSuccess={removePostFromList} 
                onOpenGallery={handleOpenGallery}
              />
            );
          }}
          estimatedItemSize={600}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="newspaper-outline" size={50} color={isDark ? '#555' : '#CCC'} />
                <Text style={styles.emptyText}>Aucune publication pour le moment.</Text>
              </View>
            ) : null
          }
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






































