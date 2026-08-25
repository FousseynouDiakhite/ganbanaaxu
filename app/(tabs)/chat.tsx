




/*

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
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
} from 'react-native';
// IMPORTATIONS MODIFIÉES POUR LE CACHE
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image'; 

import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
import { Audio, Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

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

// --- LECTEUR AUDIO ---
function AudioBubble({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [loadingAudio, setLoadingAudio] = useState(false);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const togglePlay = async () => {
    try {
      if (sound) {
        if (isPlaying) await sound.pauseAsync();
        else await sound.playAsync();
      } else {
        setLoadingAudio(true);
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: audioUrl }, { shouldPlay: true }, onPlaybackStatusUpdate);
        setSound(newSound);
      }
    } catch (err) {
      console.error('Erreur lecture audio :', err);
    } finally {
      setLoadingAudio(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setIsPlaying(status.isPlaying);
      setPosition(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const formatMillis = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 180, paddingVertical: 4 }}>
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
        {loadingAudio ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#FFF" />}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : colors.border, overflow: 'hidden', marginBottom: 4 }}>
          <View style={{ height: '100%', backgroundColor: textColor, width: duration ? `${(position / duration) * 100}%` : '0%' }} />
        </View>
        <Text style={{ fontSize: 11, color: textColor, opacity: 0.8 }}>{isPlaying ? formatMillis(position) : formatMillis(duration)}</Text>
      </View>
    </View>
  );
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_banned, is_superuser')
            .eq('id', session.user.id)
            .single();
            
          if (profile?.is_banned) setIsBanned(true);
          if (profile?.is_superuser) setIsSuperuser(true);

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

    // TEMPS RÉEL (INSERT & DELETE) AVEC MISE À JOUR DU CACHE
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
            const isDuplicate = prev.some((m) => m.id === fullMsg.id);
            if (isDuplicate) return prev;
            
            const newMessages = [...prev, fullMsg];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          const newMessages = prev.filter((m) => m.id !== payload.old.id);
          AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
          return newMessages;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      // 1. CHARGEMENT DU CACHE
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
      }

      // 2. RÉCUPÉRATION SUPABASE
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // 3. MISE À JOUR UI ET CACHE
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
      }
    } catch (err: any) {
      console.error('Erreur récupération messages :', err.message);
    }
  };

  const downloadAndSharePDF = async (fileUrl: string) => {
    try {
      const fileName = fileUrl.split('/').pop() || `document_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger le document PDF' });
      } else {
        Alert.alert('Non supporté', "Le téléchargement n'est pas supporté sur cet appareil.");
      }
    } catch (error) {
      console.error('Erreur téléchargement PDF :', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
    const title = isMine ? 'Supprimer le message' : 'Action Modérateur';
    const message = isMine 
      ? 'Voulez-vous supprimer votre message pour tout le monde ?'
      : 'En tant que super-utilisateur, voulez-vous supprimer ce message ?';

    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('messages').delete().eq('id', messageId);
            if (error) throw error;
          } catch (err: any) {
            console.error('Erreur suppression :', err.message);
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        },
      },
    ]);
  };

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      const extension = fileUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media')
        .upload(filePath, decode(base64), { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('messages').insert([
        { user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType },
      ]);

      if (insertError) throw insertError;
    } catch (err: any) {
      console.error('Erreur envoi média :', err.message);
      Alert.alert('Erreur', "Échec de l'envoi du média.");
    } finally {
      setSending(false);
      setShowMediaModal(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Accès aux photos requis.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
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
    } catch (err) {
      console.error('Erreur sélection document :', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isBanned) return;
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      const { error } = await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Erreur', "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (isBanned) return;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') return;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'activer le micro.");
    }
  };

  const stopAndSendRecording = async () => {
    if (!recording || !user || isBanned) return;
    try {
      setSending(true);
      if (timerRef.current) clearInterval(timerRef.current);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      const uri = recording.getURI();
      setRecording(null);
      setIsRecording(false);
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from('chat-audios')
        .upload(filePath, decode(base64), { contentType: 'audio/m4a' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('chat-audios').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err: any) {
      Alert.alert('Erreur', "Échec de l'envoi du vocal.");
    } finally {
      setSending(false);
      setIsRecording(false);
    }
  };

  const cancelRecording = async () => {
    if (recording) {
      if (timerRef.current) clearInterval(timerRef.current);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }
    setRecording(null);
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const renderMessageContent = (item: Message, isMine: boolean) => {
    const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

    if (item.audio_url) {
      return <AudioBubble audioUrl={item.audio_url} isMine={isMine} colors={colors} />;
    }

    if (item.file_type === 'image' && item.file_url) {
      return (
        <TouchableOpacity onPress={() => setFullScreenImage(item.file_url!)}>
        
          <Image 
            source={{ uri: item.file_url }} 
            style={{ width: 200, height: 150, borderRadius: 12 }} 
            contentFit="cover" 
            cachePolicy="disk" 
          />
        </TouchableOpacity>
      );
    }

    if (item.file_type === 'video' && item.file_url) {
      return (
        <Video
          source={{ uri: item.file_url }}
          useNativeControls
          resizeMode={ResizeMode.CONTAIN}
          style={{ width: 220, height: 160, borderRadius: 12 }}
        />
      );
    }

    if (item.file_type === 'pdf' && item.file_url) {
      return (
        <TouchableOpacity
          onPress={() => downloadAndSharePDF(item.file_url!)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', padding: 10, borderRadius: 8 }}
        >
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.user_id === user?.id;
    const profile = item.profiles;
    const displayName = profile?.full_name || 'Utilisateur';

    return (
      <View style={[{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' }, isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        {!isMine &&
          (profile?.avatar_url ? (
            <Image 
              source={{ uri: profile.avatar_url }} 
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} 
              contentFit="cover"
              cachePolicy="disk" 
            />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          ))}

        <View style={{ maxWidth: '75%' }}>
          {!isMine && <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3, marginLeft: 4 }}>{displayName}</Text>}
          
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => {
               if (isMine || isSuperuser) handleDeleteMessage(item.id, isMine);
            }}
            style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
          >
            {renderMessageContent(item, isMine)}
            <Text style={{ fontSize: 10, marginTop: 4, alignSelf: 'flex-end', color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.cardBackground }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 8 }}>Retour</Text>
        </TouchableOpacity>
        <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 4 }}>Chat Global</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isBanned ? (
          <View style={{ padding: 16, backgroundColor: colors.danger, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Vous avez été banni du chat par un administrateur.</Text>
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
                  <TouchableOpacity style={{ marginLeft: 8, backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={handleSendMessage} disabled={sending}>
                    {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 3 }} />}
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
          <TouchableOpacity 
            style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 }} 
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>

          {fullScreenImage && (
            <Image 
              source={{ uri: fullScreenImage }} 
              style={{ width: '100%', height: '80%' }} 
              contentFit="contain" 
              cachePolicy="disk"
            />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

*/






















import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
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
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image'; 
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';

// --- NOUVEAUX MODULES EXPO-VIDEO ET EXPO-AUDIO ---
import { useVideoPlayer, VideoView } from 'expo-video';
import { useAudioPlayer, AudioRecorder, useAudioRecorder } from 'expo-audio';

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

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

// --- LECTEUR VIDÉO (NOUVEAU COMPOSANT) ---
function VideoBubble({ fileUrl }: { fileUrl: string }) {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
    player.pause();
  });

  return (
    <VideoView
      player={player}
      style={{ width: 220, height: 160, borderRadius: 12 }}
      allowsFullscreen
      allowsPictureInPicture
    />
  );
}

// --- LECTEUR AUDIO (MIS À JOUR) ---
function AudioBubble({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) {
  const player = useAudioPlayer(audioUrl);

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  // expo-audio utilise généralement des secondes, on convertit pour l'affichage
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const duration = player.duration || 0;
  const position = player.currentTime || 0;
  const progress = duration > 0 ? (position / duration) * 100 : 0;
  
  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 180, paddingVertical: 4 }}>
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
        <Ionicons name={player.playing ? 'pause' : 'play'} size={22} color="#FFF" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : colors.border, overflow: 'hidden', marginBottom: 4 }}>
          <View style={{ height: '100%', backgroundColor: textColor, width: `${progress}%` }} />
        </View>
        <Text style={{ fontSize: 11, color: textColor, opacity: 0.8 }}>
          {player.playing ? formatTime(position) : formatTime(duration)}
        </Text>
      </View>
    </View>
  );
}

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  // NOUVEAU: Hook d'enregistrement expo-audio
  const audioRecorder = useAudioRecorder();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_banned, is_superuser')
            .eq('id', session.user.id)
            .single();
            
          if (profile?.is_banned) setIsBanned(true);
          if (profile?.is_superuser) setIsSuperuser(true);

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

    // TEMPS RÉEL (INSERT & DELETE)
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
            const isDuplicate = prev.some((m) => m.id === fullMsg.id);
            if (isDuplicate) return prev;
            
            const newMessages = [...prev, fullMsg];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          const newMessages = prev.filter((m) => m.id !== payload.old.id);
          AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
          return newMessages;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageSubscription);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 200);
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 200);
      }
    } catch (err: any) {
      console.error('Erreur récupération messages :', err.message);
    }
  };

  const downloadAndSharePDF = async (fileUrl: string) => {
    try {
      const fileName = fileUrl.split('/').pop() || `document_${Date.now()}.pdf`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const { uri } = await FileSystem.downloadAsync(fileUrl, fileUri);
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger le document PDF' });
      } else {
        Alert.alert('Non supporté', "Le téléchargement n'est pas supporté sur cet appareil.");
      }
    } catch (error) {
      console.error('Erreur téléchargement PDF :', error);
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
    const title = isMine ? 'Supprimer le message' : 'Action Modérateur';
    const message = isMine 
      ? 'Voulez-vous supprimer votre message pour tout le monde ?'
      : 'En tant que super-utilisateur, voulez-vous supprimer ce message ?';

    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('messages').delete().eq('id', messageId);
            if (error) throw error;
          } catch (err: any) {
            console.error('Erreur suppression :', err.message);
            Alert.alert('Erreur', 'Impossible de supprimer.');
          }
        },
      },
    ]);
  };

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      const extension = fileUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media')
        .upload(filePath, decode(base64), { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('messages').insert([
        { user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType },
      ]);

      if (insertError) throw insertError;
    } catch (err: any) {
      console.error('Erreur envoi média :', err.message);
      Alert.alert('Erreur', "Échec de l'envoi du média.");
    } finally {
      setSending(false);
      setShowMediaModal(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Accès aux photos requis.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
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
    } catch (err) {
      console.error('Erreur sélection document :', err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || isBanned) return;
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      const { error } = await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
      if (error) throw error;
    } catch (err: any) {
      Alert.alert('Erreur', "Impossible d'envoyer le message.");
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    if (isBanned) return;
    try {
      // expo-audio : demande de permission et démarrage
      const status = await AudioRecorder.requestPermissionsAsync();
      if (!status.granted) return;
      
      await audioRecorder.recordAsync();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'activer le micro.");
      console.error(err);
    }
  };

  const stopAndSendRecording = async () => {
    if (!audioRecorder.isRecording || !user || isBanned) return;
    try {
      setSending(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      await audioRecorder.stopAsync();
      const uri = audioRecorder.uri;
      
      setIsRecording(false);
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from('chat-audios')
        .upload(filePath, decode(base64), { contentType: 'audio/m4a' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('chat-audios').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err: any) {
      Alert.alert('Erreur', "Échec de l'envoi du vocal.");
    } finally {
      setSending(false);
      setIsRecording(false);
    }
  };

  const cancelRecording = async () => {
    if (audioRecorder.isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      await audioRecorder.stopAsync();
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const renderMessageContent = (item: Message, isMine: boolean) => {
    const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

    if (item.audio_url) {
      return <AudioBubble audioUrl={item.audio_url} isMine={isMine} colors={colors} />;
    }

    if (item.file_type === 'image' && item.file_url) {
      return (
        <TouchableOpacity onPress={() => setFullScreenImage(item.file_url!)}>
          <Image 
            source={{ uri: item.file_url }} 
            style={{ width: 200, height: 150, borderRadius: 12 }} 
            contentFit="cover" 
            cachePolicy="disk" 
          />
        </TouchableOpacity>
      );
    }

    // UTILISATION DU NOUVEAU COMPOSANT VIDÉO
    if (item.file_type === 'video' && item.file_url) {
      return <VideoBubble fileUrl={item.file_url} />;
    }

    if (item.file_type === 'pdf' && item.file_url) {
      return (
        <TouchableOpacity
          onPress={() => downloadAndSharePDF(item.file_url!)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.15)', padding: 10, borderRadius: 8 }}
        >
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

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.user_id === user?.id;
    const profile = item.profiles;
    const displayName = profile?.full_name || 'Utilisateur';

    return (
      <View style={[{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' }, isMine ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        {!isMine &&
          (profile?.avatar_url ? (
            <Image 
              source={{ uri: profile.avatar_url }} 
              style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8 }} 
              contentFit="cover"
              cachePolicy="disk" 
            />
          ) : (
            <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
          ))}

        <View style={{ maxWidth: '75%' }}>
          {!isMine && <Text style={{ fontSize: 11, color: colors.textSecondary, marginBottom: 3, marginLeft: 4 }}>{displayName}</Text>}
          
          <TouchableOpacity
            activeOpacity={0.8}
            onLongPress={() => {
               if (isMine || isSuperuser) handleDeleteMessage(item.id, isMine);
            }}
            style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
          >
            {renderMessageContent(item, isMine)}
            <Text style={{ fontSize: 10, marginTop: 4, alignSelf: 'flex-end', color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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

      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.cardBackground }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', zIndex: 1 }}>
          <Ionicons name="arrow-back" size={24} color={colors.primary} />
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.primary, marginLeft: 8 }}>Retour</Text>
        </TouchableOpacity>
        <View style={{ position: 'absolute', left: 0, right: 0, alignItems: 'center', pointerEvents: 'none' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 4 }}>Chat Global</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {isBanned ? (
          <View style={{ padding: 16, backgroundColor: colors.danger, alignItems: 'center' }}>
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>Vous avez été banni du chat par un administrateur.</Text>
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
                  <TouchableOpacity style={{ marginLeft: 8, backgroundColor: colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }} onPress={handleSendMessage} disabled={sending}>
                    {sending ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 3 }} />}
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
          <TouchableOpacity 
            style={{ position: 'absolute', top: Platform.OS === 'ios' ? 50 : 30, right: 20, zIndex: 10, padding: 10 }} 
            onPress={() => setFullScreenImage(null)}
          >
            <Ionicons name="close-circle" size={40} color="#FFF" />
          </TouchableOpacity>

          {fullScreenImage && (
            <Image 
              source={{ uri: fullScreenImage }} 
              style={{ width: '100%', height: '80%' }} 
              contentFit="contain" 
              cachePolicy="disk"
            />
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
}