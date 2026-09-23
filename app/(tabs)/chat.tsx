






/*
import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// --- MODULES EXPO-VIDEO ---
import { useVideoPlayer, VideoView } from 'expo-video';

// --- MODULES EXPO-AUDIO ---
import { 
  useAudioPlayer, 
  useAudioRecorder, 
  AudioModule,     
  RecordingPresets,     
  setAudioModeAsync
} from 'expo-audio';

// --- MODULE DE COMPRESSION ---
import { Video as VideoCompressor } from 'react-native-compressor';

// --- API Legacy pour les fichiers ---
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const CACHE_KEY = 'ganbanaaxu_chat_cache';

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
  chatBubbleSender: isDark ? '#BB86FC' : '#6200EE',
  chatBubbleReceiver: isDark ? '#2D2D2D' : '#E2E8F0',
  chatTextSender: '#FFFFFF',
  chatTextReceiver: isDark ? '#FFFFFF' : '#1A202C',
});

interface Profile {
  full_name?: string;
  avatar_url?: string;
  is_banned?: boolean;
  is_superuser?: boolean;
}

interface Message {
  id: string;
  content?: string | null;
  audio_url?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  user_id: string;
  created_at: string;
  profiles?: Profile | null;
}

// --- 1. LECTEUR VIDÉO AVEC APERÇU ---
const VideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
  });

  useEffect(() => {
    return () => {
      try {
        if (player) player.pause();
      } catch (e) {}
    };
  }, [player]);

  return (
    <View style={{ backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
      <VideoView
        player={player}
        style={{ width: 240, height: 180 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        contentFit="contain" 
      />
    </View>
  );
});

// --- 2. LECTEUR AUDIO (OPTIMISÉ : TIMER ACTIF UNIQUEMENT PENDANT LA LECTURE) ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setPosition(player.currentTime || 0);
        setDuration(player.duration || 0);
        setIsPlaying(player.playing || false);
      }, 250); // Fréquence ramenée à 250ms pour réduire la charge CPU
    } else {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [player, isPlaying]);
  
  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const isMilliseconds = duration > 1000 || time > 1000; 
    const totalSeconds = isMilliseconds ? Math.floor(time / 1000) : Math.floor(time);
    
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;
  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 220, paddingVertical: 4 }}>
      <TouchableOpacity 
        onPress={togglePlay} 
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFF" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : colors.border, overflow: 'hidden', marginBottom: 4 }}>
          <View style={{ height: '100%', backgroundColor: textColor, width: `${progress}%` }} />
        </View>
        <Text style={{ fontSize: 11, color: textColor, opacity: 0.8, marginTop: 2 }}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
});

// --- 3. MESSAGE ITEM ---
const MessageItem = memo(({ item, isMine, colors, isSuperuser, onDelete, onImagePress, onPdfPress }: any) => {
  const profile = item.profiles;
  const displayName = profile?.full_name || 'Utilisateur';
  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  const renderContent = () => {
    if (item.audio_url) return <AudioBubble audioUrl={item.audio_url} isMine={isMine} colors={colors} />;
    
    if (item.file_type === 'image' && item.file_url) {
      return (
        <TouchableOpacity onPress={() => onImagePress(item.file_url)}>
          <Image 
            source={{ uri: item.file_url }} 
            style={{ width: 220, height: 160, borderRadius: 12 }} 
            contentFit="cover" 
            cachePolicy="disk" 
          />
        </TouchableOpacity>
      );
    }
    
    if (item.file_type === 'video' && item.file_url) return <VideoBubble fileUrl={item.file_url} />;
    
    if (item.file_type === 'pdf' && item.file_url) {
      return (
        <TouchableOpacity onPress={() => onPdfPress(item.file_url)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', padding: 10, borderRadius: 8 }}>
          <Ionicons name="download-outline" size={30} color={textColor} />
          <View style={{ marginLeft: 8 }}>
            <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13 }}>Document PDF</Text>
            <Text style={{ color: textColor, fontSize: 11, opacity: 0.8 }}>Toucher pour télécharger</Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    return <Text style={{ color: textColor, fontSize: 15 }}>{item.content}</Text>;
  };

  const isMedia = item.file_type || item.audio_url;
  const canDelete = isMine || isSuperuser;

  return (
    <View style={[{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' }, isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
      {!isMine && (
        profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} contentFit="cover" cachePolicy="disk" />
        ) : (
          <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )
      )}

      <View style={{ maxWidth: '85%' }}>
        {!isMine && <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3, marginLeft: 4 }}>{displayName}</Text>}
        
        <View style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}>
          {!isMedia ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() => { if (canDelete) onDelete(item.id, isMine); }}
            >
              {renderContent()}
            </TouchableOpacity>
          ) : (
            renderContent()
          )}
          
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 }}>
            {canDelete && isMedia && (
              <TouchableOpacity 
                onPress={() => onDelete(item.id, isMine)} 
                style={{ marginRight: 8, paddingHorizontal: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={14} color={isMine ? 'rgba(255,255,255,0.7)' : colors.danger} />
              </TouchableOpacity>
            )}
            
            <Text style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// --- CHAT PRINCIPAL ---
export default function Chat() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const saveToCache = async (data: Message[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.slice(0, 30)));
    } catch (e) {
      console.warn('Erreur de sauvegarde du cache', e);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        // Chargement instantané depuis le cache local
        const cachedMessages = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedMessages) {
          setMessages(JSON.parse(cachedMessages));
          setLoading(false);
        }

        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, is_banned, is_superuser')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            setUserProfile(profile);
            if (profile.is_banned) setIsBanned(true);
            if (profile.is_superuser) setIsSuperuser(true);
          }

          await fetchMessages();
        } else {
          Alert.alert('Erreur', 'Vous devez être connecté.');
          router.replace('/');
        }
      } catch (err: any) {
        console.error('Erreur init chat :', err.message);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    const messageSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const { data: fullMsg } = await supabase
          .from('messages')
          .select('*, profiles:user_id(full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single();

        if (fullMsg) {
          setMessages((prev) => {
            // Remplace le message optimiste s'il existe déjà
            const filtered = prev.filter((m) => m.id !== fullMsg.id && !m.id.startsWith('temp-'));
            const newMessages = [fullMsg, ...filtered];
            saveToCache(newMessages);
            return newMessages;
          });
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          const newMessages = prev.filter((m) => m.id !== payload.old.id);
          saveToCache(newMessages);
          return newMessages;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30); // Limite initiale pour accélérer le temps d'affichage

      if (error) throw error;
      if (data) {
        setMessages(data);
        saveToCache(data);
      }
    } catch (err: any) {
      console.error('Erreur récupération messages :', err.message);
    }
  };

  const downloadAndSharePDF = useCallback(async (fileUrl: string) => {
    try {
      const fileName = fileUrl.split('/').pop() || `document_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  }, []);

  const handleDeleteMessage = useCallback((messageId: string, isMine: boolean) => {
    const title = isMine ? 'Supprimer' : 'Action Modérateur';
    Alert.alert(title, 'Voulez-vous vraiment supprimer ce message ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('messages').delete().eq('id', messageId);
          } catch (err) {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        },
      },
    ]);
  }, []);

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        finalUri = await VideoCompressor.compress(fileUri, { 
          compressionMethod: 'auto', 
          minimumFileSizeForCompress: 0,
          maxSize: 720,       
          bitrate: 2000000,   
        });

        if (Platform.OS === 'android' && !finalUri.startsWith('file://') && !finalUri.startsWith('content://')) {
          finalUri = 'file://' + finalUri;
        }
      }

      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const response = await fetch(finalUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media')
        .upload(filePath, blob, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType }]);
    } catch (err) {
      console.error('Erreur Upload:', err);
      Alert.alert('Erreur', "Échec de l'envoi du fichier.");
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images', 'videos'], 
      quality: 0.8 
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isVideo = asset.type === 'video';
      await uploadAndSendMessage(asset.uri, isVideo ? 'video/mp4' : 'image/jpeg', isVideo ? 'video' : 'image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        await uploadAndSendMessage(result.assets[0].uri, 'application/pdf', 'pdf');
      }
    } catch (err) {}
  };

  // --- ENVOI OPTIMISTE POUR UN RENDU INSTANTANÉ ---
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isBanned) return;
    
    const textToSend = newMessage.trim();
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: textToSend,
      user_id: user.id,
      created_at: new Date().toISOString(),
      profiles: userProfile
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      const { error } = await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
      if (error) throw error;
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const startRecording = async () => {
    if (isBanned) return;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record(); 
      
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } catch (err) {}
  };

  const stopAndSendRecording = async () => {
    if (!isRecording || !user || isBanned) return;
    try {
      setSending(true);
      if (timerRef.current) clearInterval(timerRef.current);
      await audioRecorder.stop(); 
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = audioRecorder.uri;
      setIsRecording(false);
      if (!uri) return;

      const response = await fetch(uri);
      const blob = await response.blob();
      const filePath = `${user.id}/${Date.now()}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media')
        .upload(filePath, blob, { contentType: 'audio/m4a' });
        
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi de l'audio.");
    } finally {
      setSending(false);
      setIsRecording(false);
    }
  };

  const cancelRecording = async () => {
    if (isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      await audioRecorder.stop(); 
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <MessageItem
      item={item}
      isMine={item.user_id === user?.id}
      colors={colors}
      isSuperuser={isSuperuser}
      onDelete={handleDeleteMessage}
      onImagePress={setFullScreenImage}
      onPdfPress={downloadAndSharePDF}
    />
  ), [user?.id, colors, isSuperuser, handleDeleteMessage, downloadAndSharePDF]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={{ 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border, 
        backgroundColor: colors.cardBackground, 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Chat Global</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          initialNumToRender={12}
          maxToRenderPerBatch={6}
          windowSize={5}
          removeClippedSubviews={true} 
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          inverted 
        />

        {isBanned ? (
          <View style={{ padding: 16, backgroundColor: colors.danger, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Vous êtes banni du chat.</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardBackground }}>
            {isRecording ? (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={cancelRecording} style={{ padding: 8 }}>
                  <Text style={{ color: colors.danger, fontWeight: '600' }}>Annuler</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, marginRight: 8 }} />
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>

                <TouchableOpacity style={{ backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={stopAndSendRecording}>
                  {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 2 }} />}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowMediaModal(true)} style={{ marginRight: 8 }}>
                  <Ionicons name="add-circle-outline" size={30} color={colors.primary} />
                </TouchableOpacity>

                <TextInput
                  style={{ flex: 1, backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 }}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Écrivez un message..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />

                {newMessage.trim().length > 0 ? (
                  <TouchableOpacity style={{ marginLeft: 8, backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={handleSendMessage}>
                    <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={{ marginLeft: 8, backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={startRecording}>
                    <Ionicons name="mic" size={22} color="#FFF" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={showMediaModal} transparent animationType="slide" onRequestClose={() => setShowMediaModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowMediaModal(false)}>
          <View style={{ backgroundColor: colors.cardBackground, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Partager un média</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={pickMedia}>
              <Ionicons name="images" size={24} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: colors.text }}>Photo ou Vidéo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={pickDocument}>
              <Ionicons name="document-attach" size={24} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: colors.text }}>Document PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMediaModal(false)} style={{ marginTop: 12, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!fullScreenImage} transparent animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 }} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
          {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={{ width: '100%', height: '80%' }} contentFit="contain" cachePolicy="disk" />}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

*/











import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  StatusBar,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  Animated,
  Image as RNImage,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// --- MODULES ADMOB ---
import {
  TestIds,
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";

// --- MODULES EXPO-VIDEO ---
import { useVideoPlayer, VideoView } from 'expo-video';

// --- MODULES EXPO-AUDIO ---
import { 
  useAudioPlayer, 
  useAudioRecorder, 
  AudioModule,     
  RecordingPresets,     
  setAudioModeAsync
} from 'expo-audio';

// --- MODULE DE COMPRESSION ---
import { Video as VideoCompressor } from 'react-native-compressor';

// --- API Legacy pour les fichiers ---
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const CACHE_KEY = 'ganbanaaxu_chat_cache';

// ====================================================================
// CONFIGURATION PUBLICITÉS ADMOB (PRODUCTION & DÉVELOPPEMENT)
// ====================================================================
const CHAT_NATIVE_AD_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_CHAT_NATIVE_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_CHAT_NATIVE_ID",
      default: TestIds.NATIVE,
    });

// --- THÈME ---
const getThemeColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  cardBackground: isDark ? '#1A1A1A' : '#FFFFFF',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  success: '#388E3C',
  chatBubbleSender: isDark ? '#BB86FC' : '#6200EE',
  chatBubbleReceiver: isDark ? '#2D2D2D' : '#E2E8F0',
  chatTextSender: '#FFFFFF',
  chatTextReceiver: isDark ? '#FFFFFF' : '#1A202C',
  skeletonBase: isDark ? '#2A2A2A' : '#E0E0E0',
});

interface Profile {
  full_name?: string;
  avatar_url?: string;
  is_banned?: boolean;
  is_superuser?: boolean;
}

interface Message {
  id: string;
  content?: string | null;
  audio_url?: string | null;
  file_url?: string | null;
  file_type?: string | null;
  user_id?: string;
  created_at?: string;
  profiles?: Profile | null;
  isAd?: boolean;
}

// ====================================================================
// COMPOSANT NATIVE AD (Standard et Compact pour le Chat)
// ====================================================================
const CustomNativeAd = React.memo(
  ({
    isDark,
    adUnitId,
    colors,
  }: {
    isDark: boolean;
    adUnitId: string;
    colors: any;
  }) => {
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
        .catch((error) => console.log("Erreur chargement Native Ad:", error));

      return () => {
        isMounted = false;
        loadedAdInstance?.destroy?.();
      };
    }, [adUnitId]);

    const mediaHeight = 120;
    const btnHeight = 34;

    const styles = {
      nativeAdCard: {
        width: "90%",
        alignSelf: 'center',
        borderRadius: 12,
        padding: 12,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.cardBackground,
      },
      nativeAdHeader: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        marginBottom: 8,
      },
      nativeAdIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: colors.skeletonBase,
      },
      nativeAdTextContainer: {
        flex: 1,
        marginLeft: 10,
      },
      nativeAdHeadline: {
        fontWeight: "bold" as const,
        fontSize: 15,
        color: colors.text,
      },
      nativeAdTagline: {
        fontSize: 12,
        marginTop: 2,
        color: colors.textSecondary,
      },
      nativeAdBadge: {
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderWidth: 1,
        borderColor: "#FFA500",
        borderRadius: 4,
        marginLeft: 5,
      },
      nativeAdBadgeText: {
        fontSize: 10,
        color: "#FFA500",
        fontWeight: "bold" as const,
      },
      nativeAdMedia: {
        width: "100%",
        borderRadius: 8,
        marginVertical: 8,
        height: mediaHeight,
        backgroundColor: colors.skeletonBase,
      },
      nativeAdButton: {
        width: "100%",
        borderRadius: 8,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        height: btnHeight,
        backgroundColor: colors.primary,
      },
      nativeAdButtonText: {
        color: "#FFF",
        fontSize: 14,
        fontWeight: "bold" as const,
      },
    };

    // SKELETON AD (chargement instantané)
    if (!nativeAd) {
      return (
        <View style={[styles.nativeAdCard, { opacity: 0.5 }]}>
          <View style={styles.nativeAdHeader}>
            <View style={styles.nativeAdIcon} />
            <View style={styles.nativeAdTextContainer}>
              <View style={{ height: 15, width: "80%", backgroundColor: colors.skeletonBase, borderRadius: 4, marginBottom: 6 }} />
              <View style={{ height: 12, width: "50%", backgroundColor: colors.skeletonBase, borderRadius: 4 }} />
            </View>
          </View>
          <View style={styles.nativeAdMedia} />
          <View style={{ marginTop: 4 }}>
            <View style={[styles.nativeAdButton, { backgroundColor: colors.skeletonBase }]} />
          </View>
        </View>
      );
    }

    // ANNONCE CHARGÉE
    return (
      <View style={styles.nativeAdCard}>
        <NativeAdView nativeAd={nativeAd} style={{ width: "100%" }}>
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

          <NativeMediaView style={[styles.nativeAdMedia, { backgroundColor: 'transparent' }]} />

          {nativeAd.callToAction && (
            <View style={{ marginTop: 4 }}>
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
  }
);

// --- SKELETON LOADER POUR LE CHAT ---
const ChatSkeleton = memo(({ colors }: { colors: any }) => {
  const fadeAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim]);

  const skeletonMessages = [
    { id: 1, isMine: false, width: '60%', hasAvatar: true },
    { id: 2, isMine: true, width: '40%', hasAvatar: false },
    { id: 3, isMine: false, width: '75%', hasAvatar: true },
    { id: 4, isMine: false, width: '50%', hasAvatar: false },
    { id: 5, isMine: true, width: '65%', hasAvatar: false },
    { id: 6, isMine: false, width: '80%', hasAvatar: true, isMedia: true },
  ];

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'flex-end', backgroundColor: colors.background }}>
      {skeletonMessages.map((msg) => (
        <View key={msg.id} style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', justifyContent: msg.isMine ? 'flex-end' : 'flex-start' }}>
          {!msg.isMine && msg.hasAvatar && (
            <Animated.View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.skeletonBase, marginRight: 8, opacity: fadeAnim }} />
          )}
          {!msg.isMine && !msg.hasAvatar && <View style={{ width: 32, marginRight: 8 }} />} 
          
          <Animated.View style={{ 
            height: msg.isMedia ? 160 : 40, 
            width: msg.isMedia ? 220 : msg.width, 
            backgroundColor: colors.skeletonBase, 
            borderRadius: 16, 
            borderBottomRightRadius: msg.isMine ? 2 : 16,
            borderBottomLeftRadius: msg.isMine ? 16 : 2,
            opacity: fadeAnim 
          }} />
        </View>
      ))}
    </View>
  );
});


// --- LECTEUR VIDÉO AVEC APERÇU ---
const VideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
  });

  useEffect(() => {
    return () => {
      try {
        if (player) player.pause();
      } catch (e) {}
    };
  }, [player]);

  return (
    <View style={{ backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }}>
      <VideoView
        player={player}
        style={{ width: 240, height: 180 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        contentFit="contain" 
      />
    </View>
  );
});

// --- LECTEUR AUDIO ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    
    let interval: NodeJS.Timeout | null = null;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setPosition(player.currentTime || 0);
        setDuration(player.duration || 0);
        setIsPlaying(player.playing || false);
      }, 250); 
    } else {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [player, isPlaying]);
  
  const togglePlay = () => {
    if (!player) return;
    if (isPlaying) {
      player.pause();
      setIsPlaying(false);
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const isMilliseconds = duration > 1000 || time > 1000; 
    const totalSeconds = isMilliseconds ? Math.floor(time / 1000) : Math.floor(time);
    
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;
  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 220, paddingVertical: 4 }}>
      <TouchableOpacity 
        onPress={togglePlay} 
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFF" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : colors.border, overflow: 'hidden', marginBottom: 4 }}>
          <View style={{ height: '100%', backgroundColor: textColor, width: `${progress}%` }} />
        </View>
        <Text style={{ fontSize: 11, color: textColor, opacity: 0.8, marginTop: 2 }}>
          {formatTime(position)} / {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
});

// --- MESSAGE ITEM ---
const MessageItem = memo(({ item, isMine, colors, isSuperuser, onDelete, onImagePress, onPdfPress }: any) => {
  const profile = item.profiles;
  const displayName = profile?.full_name || 'Utilisateur';
  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  const renderContent = () => {
    if (item.audio_url) return <AudioBubble audioUrl={item.audio_url} isMine={isMine} colors={colors} />;
    
    if (item.file_type === 'image' && item.file_url) {
      return (
        <TouchableOpacity onPress={() => onImagePress(item.file_url)}>
          <Image 
            source={{ uri: item.file_url }} 
            style={{ width: 220, height: 160, borderRadius: 12 }} 
            contentFit="cover" 
            cachePolicy="disk" 
          />
        </TouchableOpacity>
      );
    }
    
    if (item.file_type === 'video' && item.file_url) return <VideoBubble fileUrl={item.file_url} />;
    
    if (item.file_type === 'pdf' && item.file_url) {
      return (
        <TouchableOpacity onPress={() => onPdfPress(item.file_url)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', padding: 10, borderRadius: 8 }}>
          <Ionicons name="download-outline" size={30} color={textColor} />
          <View style={{ marginLeft: 8 }}>
            <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 13 }}>Document PDF</Text>
            <Text style={{ color: textColor, fontSize: 11, opacity: 0.8 }}>Toucher pour télécharger</Text>
          </View>
        </TouchableOpacity>
      );
    }
    
    return <Text style={{ color: textColor, fontSize: 15 }}>{item.content}</Text>;
  };

  const isMedia = item.file_type || item.audio_url;
  const canDelete = isMine || isSuperuser;

  return (
    <View style={[{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' }, isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
      {!isMine && (
        profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} contentFit="cover" cachePolicy="disk" />
        ) : (
          <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
        )
      )}

      <View style={{ maxWidth: '85%' }}>
        {!isMine && <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3, marginLeft: 4 }}>{displayName}</Text>}
        
        <View style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}>
          {!isMedia ? (
            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() => { if (canDelete) onDelete(item.id, isMine); }}
            >
              {renderContent()}
            </TouchableOpacity>
          ) : (
            renderContent()
          )}
          
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4 }}>
            {canDelete && isMedia && (
              <TouchableOpacity 
                onPress={() => onDelete(item.id, isMine)} 
                style={{ marginRight: 8, paddingHorizontal: 4 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash-outline" size={14} color={isMine ? 'rgba(255,255,255,0.7)' : colors.danger} />
              </TouchableOpacity>
            )}
            
            <Text style={{ fontSize: 10, color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
              {new Date(item.created_at || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
});

// --- CHAT PRINCIPAL ---
export default function Chat() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useMemo(() => getThemeColors(isDark), [isDark]);
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const saveToCache = async (data: Message[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data.slice(0, 30)));
    } catch (e) {
      console.warn('Erreur de sauvegarde du cache', e);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        const cachedMessages = await AsyncStorage.getItem(CACHE_KEY);
        if (cachedMessages) {
          setMessages(JSON.parse(cachedMessages));
          setLoading(false); 
        }

        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, is_banned, is_superuser')
            .eq('id', session.user.id)
            .single();
            
          if (profile) {
            setUserProfile(profile);
            if (profile.is_banned) setIsBanned(true);
            if (profile.is_superuser) setIsSuperuser(true);
          }

          await fetchMessages();
        } else {
          Alert.alert('Erreur', 'Vous devez être connecté.');
          router.replace('/');
        }
      } catch (err: any) {
        console.error('Erreur init chat :', err.message);
      } finally {
        setLoading(false);
      }
    };

    initChat();

    const messageSubscription = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const { data: fullMsg } = await supabase
          .from('messages')
          .select('*, profiles:user_id(full_name, avatar_url)')
          .eq('id', payload.new.id)
          .single();

        if (fullMsg) {
          setMessages((prev) => {
            const filtered = prev.filter((m) => m.id !== fullMsg.id && !m.id.startsWith('temp-'));
            const newMessages = [fullMsg, ...filtered];
            saveToCache(newMessages);
            return newMessages;
          });
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          const newMessages = prev.filter((m) => m.id !== payload.old.id);
          saveToCache(newMessages);
          return newMessages;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      if (data) {
        setMessages(data);
        saveToCache(data);
      }
    } catch (err: any) {
      console.error('Erreur récupération messages :', err.message);
    }
  };

  // --- LOGIQUE D'INJECTION DES NATIVE ADS ---
  const messagesWithAds = useMemo(() => {
    const withAds = [];
    let messageCountSinceLastAd = 0;
    // Définit la fréquence aléatoire d'apparition de la pub (tous les 6 à 10 messages)
    let nextAdTarget = Math.floor(Math.random() * 5) + 6; 

    for (let i = 0; i < messages.length; i++) {
      withAds.push(messages[i]);
      messageCountSinceLastAd++;

      if (messageCountSinceLastAd >= nextAdTarget && i !== messages.length - 1) {
        withAds.push({
          id: `ad-${messages[i].id}-${i}`,
          isAd: true,
        });
        messageCountSinceLastAd = 0;
        nextAdTarget = Math.floor(Math.random() * 5) + 6; 
      }
    }
    return withAds;
  }, [messages]);

  const downloadAndSharePDF = useCallback(async (fileUrl: string) => {
    try {
      const fileName = fileUrl.split('/').pop() || `document_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  }, []);

  const handleDeleteMessage = useCallback((messageId: string, isMine: boolean) => {
    const title = isMine ? 'Supprimer' : 'Action Modérateur';
    Alert.alert(title, 'Voulez-vous vraiment supprimer ce message ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('messages').delete().eq('id', messageId);
          } catch (err) {
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        },
      },
    ]);
  }, []);

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        finalUri = await VideoCompressor.compress(fileUri, { 
          compressionMethod: 'auto', 
          minimumFileSizeForCompress: 0,
          maxSize: 720,       
          bitrate: 2000000,   
        });

        if (Platform.OS === 'android' && !finalUri.startsWith('file://') && !finalUri.startsWith('content://')) {
          finalUri = 'file://' + finalUri;
        }
      }

      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const response = await fetch(finalUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media')
        .upload(filePath, blob, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType }]);
    } catch (err) {
      console.error('Erreur Upload:', err);
      Alert.alert('Erreur', "Échec de l'envoi du fichier.");
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images', 'videos'], 
      quality: 0.8 
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isVideo = asset.type === 'video';
      await uploadAndSendMessage(asset.uri, isVideo ? 'video/mp4' : 'image/jpeg', isVideo ? 'video' : 'image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) {
        await uploadAndSendMessage(result.assets[0].uri, 'application/pdf', 'pdf');
      }
    } catch (err) {}
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isBanned) return;
    
    const textToSend = newMessage.trim();
    setNewMessage('');

    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      content: textToSend,
      user_id: user.id,
      created_at: new Date().toISOString(),
      profiles: userProfile
    };

    setMessages((prev) => [optimisticMsg, ...prev]);

    try {
      const { error } = await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
      if (error) throw error;
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  const startRecording = async () => {
    if (isBanned) return;
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record(); 
      
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } catch (err) {}
  };

  const stopAndSendRecording = async () => {
    if (!isRecording || !user || isBanned) return;
    try {
      setSending(true);
      if (timerRef.current) clearInterval(timerRef.current);
      await audioRecorder.stop(); 
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = audioRecorder.uri;
      setIsRecording(false);
      if (!uri) return;

      const response = await fetch(uri);
      const blob = await response.blob();
      const filePath = `${user.id}/${Date.now()}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media')
        .upload(filePath, blob, { contentType: 'audio/m4a' });
        
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi de l'audio.");
    } finally {
      setSending(false);
      setIsRecording(false);
    }
  };

  const cancelRecording = async () => {
    if (isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      await audioRecorder.stop(); 
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const renderItem = useCallback(({ item }: { item: Message }) => {
    // Rend la VRAIE publicité Google AdMob
    if (item.isAd) {
      return (
        <CustomNativeAd 
          isDark={isDark} 
          colors={colors} 
          adUnitId={CHAT_NATIVE_AD_ID} 
        />
      );
    }

    return (
      <MessageItem
        item={item}
        isMine={item.user_id === user?.id}
        colors={colors}
        isSuperuser={isSuperuser}
        onDelete={handleDeleteMessage}
        onImagePress={setFullScreenImage}
        onPdfPress={downloadAndSharePDF}
      />
    );
  }, [user?.id, colors, isSuperuser, isDark, handleDeleteMessage, downloadAndSharePDF]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={{ 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: colors.border, 
        backgroundColor: colors.cardBackground, 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Chat Global</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        
        {/* AFFICHE LE SKELETON PENDANT LE CHARGEMENT INITIAL */}
        {loading ? (
          <ChatSkeleton colors={colors} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messagesWithAds} // Utilise la liste modifiée avec des pubs
            keyExtractor={(item) => item.id}
            initialNumToRender={12}
            maxToRenderPerBatch={6}
            windowSize={5}
            removeClippedSubviews={true} 
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            inverted 
          />
        )}

        {isBanned ? (
          <View style={{ padding: 16, backgroundColor: colors.danger, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Vous êtes banni du chat.</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.cardBackground }}>
            {isRecording ? (
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={cancelRecording} style={{ padding: 8 }}>
                  <Text style={{ color: colors.danger, fontWeight: '600' }}>Annuler</Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger, marginRight: 8 }} />
                  <Text style={{ color: colors.text, fontWeight: 'bold' }}>
                    {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>

                <TouchableOpacity style={{ backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={stopAndSendRecording}>
                  {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 2 }} />}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowMediaModal(true)} style={{ marginRight: 8 }}>
                  <Ionicons name="add-circle-outline" size={30} color={colors.primary} />
                </TouchableOpacity>

                <TextInput
                  style={{ flex: 1, backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 }}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Écrivez un message..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />

                {newMessage.trim().length > 0 ? (
                  <TouchableOpacity style={{ marginLeft: 8, backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={handleSendMessage}>
                    <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={{ marginLeft: 8, backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={startRecording}>
                    <Ionicons name="mic" size={22} color="#FFF" />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={showMediaModal} transparent animationType="slide" onRequestClose={() => setShowMediaModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => setShowMediaModal(false)}>
          <View style={{ backgroundColor: colors.cardBackground, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 16 }}>Partager un média</Text>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={pickMedia}>
              <Ionicons name="images" size={24} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: colors.text }}>Photo ou Vidéo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={pickDocument}>
              <Ionicons name="document-attach" size={24} color={colors.primary} style={{ marginRight: 12 }} />
              <Text style={{ fontSize: 16, color: colors.text }}>Document PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMediaModal(false)} style={{ marginTop: 12, paddingVertical: 10, alignItems: 'center' }}>
              <Text style={{ color: colors.danger, fontWeight: '600' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!fullScreenImage} transparent animationType="fade" onRequestClose={() => setFullScreenImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 }} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>
          {fullScreenImage && <Image source={{ uri: fullScreenImage }} style={{ width: '100%', height: '80%' }} contentFit="contain" cachePolicy="disk" />}
        </View>
      </Modal>

    </SafeAreaView>
  );
}











