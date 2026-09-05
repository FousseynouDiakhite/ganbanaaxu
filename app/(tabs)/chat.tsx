




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
*/


























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
  useAudioPlayerStatus, 
  useAudioRecorder, 
  AudioModule,          
  RecordingPresets,     
  setAudioModeAsync
} from 'expo-audio';

// --- CORRECTION AVERTISSEMENT : Import de l'API Legacy ---
import * as FileSystem from 'expo-file-system/legacy';
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

// --- LECTEUR VIDÉO ---
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

// --- LECTEUR AUDIO ---
function AudioBubble({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const formatTime = (milliseconds: number) => {
    if (isNaN(milliseconds) || milliseconds < 0) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const duration = status.duration || 0;
  const position = status.currentTime || 0;
  const progress = duration > 0 ? (position / duration) * 100 : 0;
  
  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 180, paddingVertical: 4 }}>
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={22} color="#FFF" />
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: isMine ? 'rgba(255,255,255,0.3)' : colors.border, overflow: 'hidden', marginBottom: 4 }}>
          <View style={{ height: '100%', backgroundColor: textColor, width: `${progress}%` }} />
        </View>
        <Text style={{ fontSize: 11, color: textColor, opacity: 0.8 }}>
          {status.playing ? formatTime(position) : formatTime(duration)}
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

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
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
            
            // OPTIMISATION : Ajout au début car la liste est inversée (inverted)
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      // OPTIMISATION : Nettoyage du timer pour éviter les fuites de mémoire
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        // OPTIMISATION : ascending false pour afficher les plus récents en bas avec la liste inversée
        .order('created_at', { ascending: false }); 

      if (error) throw error;

      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record(); 
      
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'activer le micro.");
      console.error(err);
    }
  };

  const stopAndSendRecording = async () => {
    if (!isRecording || !user || isBanned) return;
    try {
      setSending(true);
      if (timerRef.current) clearInterval(timerRef.current);
      
      await audioRecorder.stop(); 
      await setAudioModeAsync({ allowsRecording: false });
      
      const uri = audioRecorder.uri;
      
      setIsRecording(false);
      if (!uri) return;

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media') 
        .upload(filePath, decode(base64), { contentType: 'audio/m4a' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err: any) {
      Alert.alert('Erreur', "Échec de l'envoi du vocal.");
    } finally {
      setSending(false);
      setIsRecording(false);
    }
  };

  const cancelRecording = async () => {
    if (isRecording) {
      if (timerRef.current) clearInterval(timerRef.current);
      await audioRecorder.stop(); 
      await setAudioModeAsync({ allowsRecording: false });
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

      
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} 
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          inverted // OPTIMISATION : Liste inversée activée
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
  useAudioPlayerStatus, 
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
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// --- LECTEUR VIDÉO OPTIMISÉ ET AGRANDI ---
function VideoBubble({ fileUrl }: { fileUrl: string }) {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
    player.pause();
  });

  // CORRECTION MÉMOIRE : Vérifie si le player est initialisé et non relâché avant de couper
  useEffect(() => {
    return () => {
      try {
        if (player) {
          player.pause();
        }
      } catch (e) {
        // Ignore l'erreur si l'objet natif est déjà détruit lors d'un défilement rapide
      }
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      // CADRE AGRANDI : 280 de large et 210 de haut pour un meilleur confort visuel
      style={{ width: 280, height: 210, borderRadius: 12 }}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls={true}
      contentFit="cover"
    />
  );
}

// --- LECTEUR AUDIO OPTIMISÉ ---
function AudioBubble({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) {
  const player = useAudioPlayer(audioUrl);
  const status = useAudioPlayerStatus(player);

  const duration = status.duration || 0;
  const position = status.currentTime || 0;

  // Coupe l'audio si le composant sort de l'écran
  useEffect(() => {
    return () => {
      if (status.playing) player.pause();
    };
  }, [status.playing]);
  
  const togglePlay = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 200) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const formatTime = (milliseconds: number) => {
    if (isNaN(milliseconds) || milliseconds < 0) return '0:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progress = duration > 0 ? (position / duration) * 100 : 0;
  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  return (
    // LARGEUR AUGMENTÉE (220) pour bien afficher les deux durées sans écraser la barre
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 220, paddingVertical: 4 }}>
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={22} color="#FFF" />
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

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) {
        setMessages(JSON.parse(cachedMessages));
      }

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;

      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        finalUri = await VideoCompressor.compress(
          fileUri,
          {
            compressionMethod: 'auto',
            minimumFileSizeForCompress: 5, 
          }
        );
      }

      const base64 = await FileSystem.readAsStringAsync(finalUri, { encoding: FileSystem.EncodingType.Base64 });
      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
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
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record(); 
      
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => setRecordingDuration((prev) => prev + 1), 1000);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'activer le micro.");
      console.error(err);
    }
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

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media') 
        .upload(filePath, decode(base64), { contentType: 'audio/m4a' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err: any) {
      Alert.alert('Erreur', "Échec de l'envoi du vocal.");
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
            style={{ width: 220, height: 160, borderRadius: 12 }} 
            contentFit="cover" 
            cachePolicy="disk" 
          />
        </TouchableOpacity>
      );
    }

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

        <View style={{ maxWidth: '85%' }}>
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

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0} 
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          inverted 
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




















/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// --- 1. LECTEUR VIDÉO OPTIMISÉ (Utilisation de React.memo pour la fluidité) ---
// React.memo empêche le lecteur vidéo de se recharger inutilement quand on écrit un message.
const VideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
    player.pause();
  });

  useEffect(() => {
    return () => {
      try {
        if (player) player.pause();
      } catch (e) {}
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={{ width: 280, height: 210, borderRadius: 12 }}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls={true}
      contentFit="cover"
    />
  );
});

// --- 2. LECTEUR AUDIO EXACT (Extraction temps réel) ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Intervalle pour forcer la mise à jour exacte des minutes et secondes (tous les dixièmes de seconde)
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      // Reprendre à zéro si on est à la fin
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  // Convertisseur intelligent (gère millisecondes et secondes)
  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    
    // Si la durée totale est grande (ex: 2000), c'est des millisecondes. Sinon, des secondes.
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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

// --- 3. MESSAGE ITEM (Isolé et mémorisé pour éviter les ralentissements) ---
const MessageItem = memo(({ item, isMine, colors, isSuperuser, onDelete, onImagePress, onPdfPress }: any) => {
  const profile = item.profiles;
  const displayName = profile?.full_name || 'Utilisateur';
  const textColor = isMine ? colors.chatTextSender : colors.chatTextReceiver;

  const renderContent = () => {
    if (item.audio_url) return <AudioBubble audioUrl={item.audio_url} isMine={isMine} colors={colors} />;
    
    if (item.file_type === 'image' && item.file_url) {
      return (
        <TouchableOpacity onPress={() => onImagePress(item.file_url)}>
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => { if (isMine || isSuperuser) onDelete(item.id, isMine); }}
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
          {renderContent()}
          <Text style={{ fontSize: 10, marginTop: 4, alignSelf: 'flex-end', color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
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

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        finalUri = await VideoCompressor.compress(fileUri, { compressionMethod: 'auto', minimumFileSizeForCompress: 5 });
      }

      const base64 = await FileSystem.readAsStringAsync(finalUri, { encoding: FileSystem.EncodingType.Base64 });
      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: mimeType });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const isVideo = result.assets[0].type === 'video';
      await uploadAndSendMessage(result.assets[0].uri, isVideo ? 'video/mp4' : 'image/jpeg', isVideo ? 'video' : 'image');
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: 'audio/m4a' });
      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          // OPTIMISATION CLÉ POUR LA VIDÉO : 
          // Retirer la destruction excessive des vues, limiter les rendus simultanés
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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


















/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// --- 1. LECTEUR VIDÉO OPTIMISÉ (Chargement à la demande) ---

// Ce sous-composant n'est monté QUE lorsque l'utilisateur a cliqué sur "Play".
// Cela évite de créer 15 instances de lecteurs vidéo en mémoire simultanément.
const LoadedVideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
    player.play(); // Auto-play dès que le lecteur est monté
  });

  useEffect(() => {
    return () => {
      try {
        if (player) player.pause();
      } catch (e) {}
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={{ width: 280, height: 210, borderRadius: 12 }}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls={true}
      contentFit="cover"
    />
  );
});

// Composant principal de la bulle vidéo
const VideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Tant que la vidéo n'est pas cliquée, on affiche une miniature légère
  if (!isLoaded) {
    return (
      <TouchableOpacity
        style={{
          width: 280,
          height: 210,
          borderRadius: 12,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={0.8}
        onPress={() => setIsLoaded(true)}
      >
        <View style={{
          width: 60, height: 60, borderRadius: 30,
          backgroundColor: 'rgba(255,255,255,0.3)',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <Ionicons name="play" size={34} color="#FFF" style={{ marginLeft: 4 }} />
        </View>
        <Text style={{ color: '#FFF', position: 'absolute', bottom: 10, left: 10, fontSize: 12, opacity: 0.8 }}>
          Appuyer pour lire
        </Text>
      </TouchableOpacity>
    );
  }

  // Une fois cliquée, on charge le lecteur lourd
  return <LoadedVideoBubble fileUrl={fileUrl} />;
});

// --- 2. LECTEUR AUDIO EXACT ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => { if (isMine || isSuperuser) onDelete(item.id, isMine); }}
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
          {renderContent()}
          <Text style={{ fontSize: 10, marginTop: 4, alignSelf: 'flex-end', color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
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

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        finalUri = await VideoCompressor.compress(fileUri, { compressionMethod: 'auto', minimumFileSizeForCompress: 5 });
      }

      const base64 = await FileSystem.readAsStringAsync(finalUri, { encoding: FileSystem.EncodingType.Base64 });
      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: mimeType });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const isVideo = result.assets[0].type === 'video';
      await uploadAndSendMessage(result.assets[0].uri, isVideo ? 'video/mp4' : 'image/jpeg', isVideo ? 'video' : 'image');
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: 'audio/m4a' });
      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          // OPTIMISATIONS MÉMOIRE SUPPLÉMENTAIRES
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={true} // Oblige la destruction des vues hors écran
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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


















/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// --- 1. LECTEUR VIDÉO OPTIMISÉ ---
const LoadedVideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
    player.play(); 
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
        style={{ width: 280, height: 210 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        // CORRECTION ICI : "contain" affiche la vidéo entière sans la couper
        contentFit="contain" 
      />
    </View>
  );
});

const VideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return (
      <TouchableOpacity
        style={{
          width: 280,
          height: 210,
          borderRadius: 12,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={0.8}
        onPress={() => setIsLoaded(true)}
      >
        <View style={{
          width: 60, height: 60, borderRadius: 30,
          backgroundColor: 'rgba(255,255,255,0.3)',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <Ionicons name="play" size={34} color="#FFF" style={{ marginLeft: 4 }} />
        </View>
        <Text style={{ color: '#FFF', position: 'absolute', bottom: 10, left: 10, fontSize: 12, opacity: 0.8 }}>
          Appuyer pour lire
        </Text>
      </TouchableOpacity>
    );
  }

  return <LoadedVideoBubble fileUrl={fileUrl} />;
});

// --- 2. LECTEUR AUDIO EXACT ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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
        
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        <TouchableOpacity
          activeOpacity={0.8}
          onLongPress={() => { if (isMine || isSuperuser) onDelete(item.id, isMine); }}
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
          {renderContent()}
          <Text style={{ fontSize: 10, marginTop: 4, alignSelf: 'flex-end', color: isMine ? 'rgba(255,255,255,0.7)' : colors.textSecondary }}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </TouchableOpacity>
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

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        finalUri = await VideoCompressor.compress(fileUri, { compressionMethod: 'auto', minimumFileSizeForCompress: 5 });
      }

      const base64 = await FileSystem.readAsStringAsync(finalUri, { encoding: FileSystem.EncodingType.Base64 });
      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: mimeType });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const isVideo = result.assets[0].type === 'video';
      await uploadAndSendMessage(result.assets[0].uri, isVideo ? 'video/mp4' : 'image/jpeg', isVideo ? 'video' : 'image');
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: 'audio/m4a' });
      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={true} 
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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












/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

// --- 1. LECTEUR VIDÉO OPTIMISÉ ---
const LoadedVideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const player = useVideoPlayer(fileUrl, (player) => {
    player.loop = false;
    player.play(); 
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
        style={{ width: 280, height: 210 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        contentFit="contain" 
      />
    </View>
  );
});

const VideoBubble = memo(({ fileUrl }: { fileUrl: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return (
      <TouchableOpacity
        style={{
          width: 280,
          height: 210,
          borderRadius: 12,
          backgroundColor: '#000',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        activeOpacity={0.8}
        onPress={() => setIsLoaded(true)}
      >
        <View style={{
          width: 60, height: 60, borderRadius: 30,
          backgroundColor: 'rgba(255,255,255,0.3)',
          justifyContent: 'center', alignItems: 'center'
        }}>
          <Ionicons name="play" size={34} color="#FFF" style={{ marginLeft: 4 }} />
        </View>
        <Text style={{ color: '#FFF', position: 'absolute', bottom: 10, left: 10, fontSize: 12, opacity: 0.8 }}>
          Appuyer pour lire
        </Text>
      </TouchableOpacity>
    );
  }

  return <LoadedVideoBubble fileUrl={fileUrl} />;
});

// --- 2. LECTEUR AUDIO EXACT ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        
        <View
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
         
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

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        finalUri = await VideoCompressor.compress(fileUri, { compressionMethod: 'auto', minimumFileSizeForCompress: 5 });
      }

      const base64 = await FileSystem.readAsStringAsync(finalUri, { encoding: FileSystem.EncodingType.Base64 });
      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: mimeType });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const isVideo = result.assets[0].type === 'video';
      await uploadAndSendMessage(result.assets[0].uri, isVideo ? 'video/mp4' : 'image/jpeg', isVideo ? 'video' : 'image');
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: 'audio/m4a' });
      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={true} 
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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

















/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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
import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  // On ne lance plus le .play() automatiquement, 
  // le lecteur affichera la première image de la vidéo (aperçu) de lui-même
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
        style={{ width: 280, height: 210 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        contentFit="contain" 
      />
    </View>
  );
});

// --- 2. LECTEUR AUDIO ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        <View
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
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

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        finalUri = await VideoCompressor.compress(fileUri, { compressionMethod: 'auto', minimumFileSizeForCompress: 5 });
      }

      const base64 = await FileSystem.readAsStringAsync(finalUri, { encoding: FileSystem.EncodingType.Base64 });
      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: mimeType });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const isVideo = result.assets[0].type === 'video';
      await uploadAndSendMessage(result.assets[0].uri, isVideo ? 'video/mp4' : 'image/jpeg', isVideo ? 'video' : 'image');
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const filePath = `${user.id}/${Date.now()}.m4a`;

      await supabase.storage.from('ganbanaaxu-media').upload(filePath, decode(base64), { contentType: 'audio/m4a' });
      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', audio_url: publicUrlData.publicUrl }]);
    } catch (err) {
      Alert.alert('Erreur', "Échec de l'envoi.");
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
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={true} 
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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
















/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
        style={{ width: 280, height: 210 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        contentFit="contain" 
      />
    </View>
  );
});

// --- 2. LECTEUR AUDIO ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        <View
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
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

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        // Paramètres de compression optimisés pour réduire drastiquement le poids
        finalUri = await VideoCompressor.compress(fileUri, { 
          compressionMethod: 'auto', 
          minimumFileSizeForCompress: 5,
          maxSize: 720,       // Convertit en 720p maximum
          bitrate: 2000000    // Limite le bitrate à 2 Mbps
        });

        // Sécurité React Native : Ajouter 'file://' si manquant pour pouvoir lire le blob
        if (!finalUri.startsWith('file://') && !finalUri.startsWith('content://')) {
          finalUri = 'file://' + finalUri;
        }
      }

      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      // UTILISATION D'UN BLOB AU LIEU DE BASE64 POUR ÉVITER LE CRASH OOM
      const response = await fetch(finalUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('ganbanaaxu-media')
        .upload(filePath, blob, { contentType: mimeType });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(filePath);
      await supabase.from('messages').insert([{ user_id: user.id, content: '', file_url: publicUrlData.publicUrl, file_type: fileType }]);
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', "Échec de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const isVideo = result.assets[0].type === 'video';
      await uploadAndSendMessage(result.assets[0].uri, isVideo ? 'video/mp4' : 'image/jpeg', isVideo ? 'video' : 'image');
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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

      // UTILISATION D'UN BLOB POUR L'AUDIO AUSSI
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
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={true} 
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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















/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
        style={{ width: 280, height: 210 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        contentFit="contain" 
      />
    </View>
  );
});

// --- 2. LECTEUR AUDIO ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        <View
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
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

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  // --- UPLOAD DES MÉDIAS AVEC COMPRESSION VIDÉO ---
  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        // Compression vidéo avant l'envoi pour éviter le crash OOM et accélérer l'upload
        finalUri = await VideoCompressor.compress(fileUri, { 
          compressionMethod: 'auto', 
          minimumFileSizeForCompress: 0,
          maxSize: 720,       // Résolution max 720p
          bitrate: 2000000,   // Rate à 2 Mbps
        });

        if (Platform.OS === 'android' && !finalUri.startsWith('file://') && !finalUri.startsWith('content://')) {
          finalUri = 'file://' + finalUri;
        }
      }

      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      // Utilisation du Blob Natif pour réduire le surcoût mémoire
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

  // --- SÉLECTION DES MÉDIAS (CORRECTION DE MEDIATYPES DEPRECATED) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images', 'videos'], // Format à jour non déprécié
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={true} 
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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














/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
        style={{ width: 280, height: 210 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        contentFit="contain" 
      />
    </View>
  );
});

// --- 2. LECTEUR AUDIO ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        <View
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
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

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(newMessages));
            return newMessages;
          });
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const cachedMessages = await AsyncStorage.getItem('ganbanaaxu_chat_cache');
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        await AsyncStorage.setItem('ganbanaaxu_chat_cache', JSON.stringify(data));
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  // --- UPLOAD DES MÉDIAS AVEC COMPRESSION VIDÉO ---
  const uploadAndSendMessage = async (fileUri: string, mimeType: string, fileType: 'image' | 'video' | 'pdf') => {
    if (!user || isBanned) return;

    try {
      setSending(true);
      let finalUri = fileUri;
      setShowMediaModal(false);

      if (fileType === 'video') {
        // Compression vidéo avant l'envoi pour éviter le crash OOM et accélérer l'upload
        finalUri = await VideoCompressor.compress(fileUri, { 
          compressionMethod: 'auto', 
          minimumFileSizeForCompress: 0,
          maxSize: 720,       // Résolution max 720p
          bitrate: 2000000,   // Rate à 2 Mbps
        });

        if (Platform.OS === 'android' && !finalUri.startsWith('file://') && !finalUri.startsWith('content://')) {
          finalUri = 'file://' + finalUri;
        }
      }

      const extension = finalUri.split('.').pop() || (fileType === 'pdf' ? 'pdf' : 'jpg');
      const filePath = `${user.id}/${Date.now()}.${extension}`;

      // Utilisation du Blob Natif pour réduire le surcoût mémoire
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

  // --- SÉLECTION DES MÉDIAS (CORRECTION DE MEDIATYPES DEPRECATED) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert('Permission requise', 'Accès aux photos requis.');

    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images', 'videos'], // Format à jour non déprécié
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={true} 
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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















/*
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
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
        style={{ width: 280, height: 210 }}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={true}
        contentFit="contain" 
      />
    </View>
  );
});

// --- 2. LECTEUR AUDIO ---
const AudioBubble = memo(({ audioUrl, isMine, colors }: { audioUrl: string; isMine: boolean; colors: any }) => {
  const player = useAudioPlayer(audioUrl);
  
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setPosition(player.currentTime || 0);
      setDuration(player.duration || 0);
      setIsPlaying(player.playing || false);
    }, 100); 

    return () => clearInterval(interval);
  }, [player]);
  
  const togglePlay = () => {
    if (isPlaying) {
      player.pause();
    } else {
      if (duration > 0 && position >= duration - 0.5) {
        player.seekTo(0);
      }
      player.play();
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
      <TouchableOpacity onPress={togglePlay} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isMine ? 'rgba(255,255,255,0.2)' : colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
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
          <Image source={{ uri: item.file_url }} style={{ width: 220, height: 160, borderRadius: 12 }} contentFit="cover" cachePolicy="disk" />
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
        
        <View
          style={[{ padding: 10, borderRadius: 16 }, isMine ? { backgroundColor: colors.chatBubbleSender, borderBottomRightRadius: 2 } : { backgroundColor: colors.chatBubbleReceiver, borderBottomLeftRadius: 2 }]}
        >
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

  // Fonction utilitaire pour sauvegarder dans le cache
  const saveToCache = async (data: Message[]) => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Erreur de sauvegarde du cache', e);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });

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
            const newMessages = [fullMsg, ...prev];
            saveToCache(newMessages); // Mise en cache optimisée
            return newMessages;
          });
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          const newMessages = prev.filter((m) => m.id !== payload.old.id);
          saveToCache(newMessages); // Mise en cache optimisée
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
      const cachedMessages = await AsyncStorage.getItem(CACHE_KEY);
      if (cachedMessages) setMessages(JSON.parse(cachedMessages));

      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .order('created_at', { ascending: false }); 

      if (error) throw error;
      if (data) {
        setMessages(data);
        saveToCache(data);
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
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Télécharger PDF' });
      } else {
        Alert.alert('Erreur', "Le partage n'est pas supporté.");
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de télécharger le fichier.');
    }
  };

  const handleDeleteMessage = (messageId: string, isMine: boolean) => {
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
  };

  // --- UPLOAD DES MÉDIAS AVEC COMPRESSION VIDÉO ---
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
    try {
      setSending(true);
      const textToSend = newMessage.trim();
      setNewMessage('');
      await supabase.from('messages').insert([{ content: textToSend, user_id: user.id }]);
    } catch (err) {
      Alert.alert('Erreur', "Impossible d'envoyer.");
    } finally {
      setSending(false);
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
          initialNumToRender={8}
          maxToRenderPerBatch={4}
          windowSize={7}
          removeClippedSubviews={true} 
          renderItem={({ item }) => (
            <MessageItem
              item={item}
              isMine={item.user_id === user?.id}
              colors={colors}
              isSuperuser={isSuperuser}
              onDelete={handleDeleteMessage}
              onImagePress={setFullScreenImage}
              onPdfPress={downloadAndSharePDF}
            />
          )}
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