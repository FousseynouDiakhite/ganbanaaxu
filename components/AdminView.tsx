




















/*

// AdminView.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { supabase } from '../lib/supabase';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

interface AdminViewProps {
  isDark?: boolean;
}

export default function AdminView({ isDark = false }: AdminViewProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // --- 1. Prendre une Photo ou Vidéo (Nouveau) ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newItems: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      }));
      setSelectedMedia((prev) => [...prev, ...newItems]);
    }
  };

  // --- 2. Choisir depuis la Galerie ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newItems: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      }));
      setSelectedMedia((prev) => [...prev, ...newItems]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- 3. Choisir un fichier Audio existant (Nouveau) ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- 4. Enregistrement Vocal ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    if (uri) setAudioUri(uri);
  };

  const toggleAudioPreview = async () => {
    if (!audioUri) return;
    try {
      if (sound) {
        if (isPlayingAudio) {
          await sound.pauseAsync();
          setIsPlayingAudio(false);
        } else {
          await sound.playAsync();
          setIsPlayingAudio(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlayingAudio(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) setIsPlayingAudio(false);
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteAudio = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
    setAudioUri(null);
    setIsPlayingAudio(false);
  };

  // --- Upload et Publication ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    let mimeType = folder === 'medias' ? (fileExt === 'mp4' || fileExt === 'mov' ? 'video/mp4' : 'image/jpeg') : 'audio/m4a';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage.from('ganbanaaxu-media').upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !audioUri) {
      Alert.alert('Rien à envoyer', 'Ajoutez une photo, vidéo ou vocal.');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Connectez-vous.');

      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = audioUri ? await uploadFileToSupabase(audioUri, 'audios') : null;

      const { error } = await supabase.from('posts').insert([{ user_id: user.id, media_urls: uploadedMediaUrls, audio_url: uploadedAudioUrl }]);
      if (error) throw error;

      Alert.alert('Succès !', 'Envoyé avec succès.');
      setSelectedMedia([]);
      await deleteAudio();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const themeText = isDark ? styles.textDark : styles.textLight;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      
      <View style={styles.grid}>
        
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

      
        <TouchableOpacity 
          style={[styles.bigButton, recording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={recording ? stopRecording : startRecording} 
          disabled={loading}
        >
          <Ionicons name={recording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{recording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

      
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.previewSection}>
        
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                {item.type === 'video' && (
                  <View style={styles.videoBadge}><Ionicons name="videocam" size={20} color="#FFF" /></View>
                )}
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        
        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={isPlayingAudio ? "pause" : "play"} size={30} color="#FFF" />
              <Text style={styles.btnPlayText}>Écouter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio}>
              <Ionicons name="trash" size={30} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

    
      <TouchableOpacity
        style={[styles.btnSendHuge, loading ? styles.disabledBtn : null]}
        onPress={handlePublishProcess}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 50 },
  previewContainer: { flexDirection: 'row' },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 100, height: 100, borderRadius: 12 },
  videoBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  removeBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 15 },
  
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 15, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 24, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  textDark: { color: '#FFF' },
  textLight: { color: '#000' }
});

*/






























/*
// AdminView.tsx
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { 
  useAudioPlayer, 
  useAudioPlayerStatus, 
  useAudioRecorder, 
  AudioModule, 
  RecordingPresets, 
  setAudioModeAsync 
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Video as VideoCompressor } from 'react-native-compressor';
import { supabase } from '../lib/supabase';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

interface AdminViewProps {
  isDark?: boolean;
}

export default function AdminView({ isDark = false }: AdminViewProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Gestion Audio avec la nouvelle API expo-audio ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  // --- 1. Prendre une Photo ou Vidéo ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newItems: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      }));
      setSelectedMedia((prev) => [...prev, ...newItems]);
    }
  };

  // --- 2. Choisir depuis la Galerie ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const newItems: MediaItem[] = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      }));
      setSelectedMedia((prev) => [...prev, ...newItems]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- 3. Choisir un fichier Audio existant ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- 4. Enregistrement Vocal ---
  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      
      const uri = recorder.uri;
      if (uri) setAudioUri(uri);
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  const toggleAudioPreview = () => {
    if (!player) return;
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) {
      player.pause();
    }
    setAudioUri(null);
  };

  // --- 5. Upload avec Compression Vidéo ---
  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;

    // Compression uniquement si c'est une vidéo
    if (type === 'video') {
      try {
        console.log('Compression de la vidéo en cours...');
        fileUri = await VideoCompressor.compress(uri, {
          compressionMethod: 'auto',
        });
      } catch (err) {
        console.log('Erreur de compression, utilisation du fichier original', err);
      }
    }

    const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    
    const fileExt = fileUri.split('.').pop()?.split('?')[0] || (type === 'video' ? 'mp4' : 'bin');
    let mimeType = type === 'video' ? 'video/mp4' : (type === 'image' ? 'image/jpeg' : 'audio/m4a');
    const folder = type === 'audio' ? 'audios' : 'medias';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage.from('ganbanaaxu-media').upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !audioUri) {
      Alert.alert('Rien à envoyer', 'Ajoutez une photo, vidéo ou vocal.');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Connectez-vous.');

      // Upload des médias (images et vidéos)
      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
      // Upload de l'audio si présent
      let uploadedAudioUrl = audioUri ? await uploadFileToSupabase(audioUri, 'audio') : null;

      const { error } = await supabase.from('posts').insert([{ 
        user_id: user.id, 
        media_urls: uploadedMediaUrls, 
        audio_url: uploadedAudioUrl 
      }]);
      
      if (error) throw error;

      Alert.alert('Succès !', 'Publication envoyée avec succès.');
      setSelectedMedia([]);
      deleteAudio();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  const themeText = isDark ? styles.textDark : styles.textLight;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecording ? stopRecording : startRecording} 
          disabled={loading}
        >
          <Ionicons name={isRecording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                {item.type === 'video' && (
                  <View style={styles.videoBadge}><Ionicons name="videocam" size={20} color="#FFF" /></View>
                )}
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={30} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio}>
              <Ionicons name="trash" size={30} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.btnSendHuge, loading ? styles.disabledBtn : null]}
        onPress={handlePublishProcess}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 50 },
  previewContainer: { flexDirection: 'row' },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 100, height: 100, borderRadius: 12 },
  videoBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  removeBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 15 },
  
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 15, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 24, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  textDark: { color: '#FFF' },
  textLight: { color: '#000' }
});
*/















// AdminView.tsx
import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Modal,
  FlatList,
  Dimensions,
  Pressable,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Video as VideoCompressor } from 'react-native-compressor';
import { supabase } from '../lib/supabase';

// ==========================================
// TYPES
// ==========================================
interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

interface PickedMedia {
  uri: string;
  type: 'image' | 'video';
  duration?: number;
}

interface AdminViewProps {
  isDark?: boolean;
}

// ==========================================
// UTILITAIRES
// ==========================================
const { width: SCREEN_W } = Dimensions.get('window');
const GRID_COLS = 4;
const GRID_GAP = 2;
const GRID_SIZE = (SCREEN_W - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;

const getPickerColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#f8f9fa',
  text: isDark ? '#FFFFFF' : '#1A202C',
  textSecondary: isDark ? '#AAA' : '#666',
  border: isDark ? '#2D2D2D' : '#E2E8F0',
  primary: isDark ? '#BB86FC' : '#6200EE',
  danger: '#D32F2F',
  sheet: isDark ? '#1E1E1E' : '#FFFFFF',
  overlay: 'rgba(0,0,0,0.85)',
  recorder: '#00897B',
});

const formatDuration = (ms: number) => {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ==========================================
// SOUS-COMPOSANTS (modales WhatsApp-style)
// ==========================================
const GalleryPickerModal = memo(({
  visible, onClose, isDark, mediaTypes = ['photo', 'video'], onSelect,
}: {
  visible: boolean; onClose: () => void; isDark: boolean;
  mediaTypes?: ('photo' | 'video')[];
  onSelect: (m: PickedMedia) => void;
}) => {
  const colors = getPickerColors(isDark);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);

  const loadAssets = useCallback(async (reset = false) => {
    if (loading) return;
    if (!reset && !hasMore) return;
    setLoading(true);
    try {
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permission', 'Accès à la galerie requis.');
        onClose();
        return;
      }
      const page = await MediaLibrary.getAssetsAsync({
        first: 60,
        after: reset ? undefined : endCursor,
        mediaType: mediaTypes,
        sortBy: ['creationTime'],
      });
      setAssets(prev => (reset ? page.assets : [...prev, ...page.assets]));
      setHasMore(page.hasNextPage);
      setEndCursor(page.endCursor);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [endCursor, hasMore, loading, mediaTypes, onClose]);

  useEffect(() => {
    if (visible) {
      setAssets([]);
      setEndCursor(undefined);
      setHasMore(true);
      loadAssets(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const renderItem = ({ item }: { item: MediaLibrary.Asset }) => (
    <TouchableOpacity
      onPress={() => onSelect({
        uri: item.uri,
        type: item.mediaType === 'video' ? 'video' : 'image',
        duration: item.duration || 0,
      })}
      style={{ width: GRID_SIZE, height: GRID_SIZE, marginRight: GRID_GAP, marginBottom: GRID_GAP }}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%', backgroundColor: colors.border }} />
      {item.mediaType === 'video' && (
        <View style={{ position: 'absolute', right: 4, bottom: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 }}>
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '600' }}>
            {formatDuration((item.duration || 0) * 1000)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity onPress={onClose} style={{ padding: 6 }}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Galerie</Text>
          <View style={{ width: 38 }} />
        </View>

        <FlatList
          data={assets}
          keyExtractor={(i) => i.id}
          numColumns={GRID_COLS}
          renderItem={renderItem}
          onEndReached={() => loadAssets(false)}
          onEndReachedThreshold={0.5}
          ListFooterComponent={loading ? (
            <View style={{ padding: 20 }}><ActivityIndicator color={colors.primary} /></View>
          ) : null}
        />
      </SafeAreaView>
    </Modal>
  );
});

const CameraModal = memo(({
  visible, onClose, isDark, mode = 'both', onCapture,
}: {
  visible: boolean; onClose: () => void; isDark: boolean;
  mode?: 'photo' | 'video' | 'both';
  onCapture: (m: PickedMedia) => void;
}) => {
  const colors = getPickerColors(isDark);
  const [camPerm, requestCamPerm] = useCameraPermissions();
  const [micPerm, requestMicPerm] = useMicrophonePermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [flash, setFlash] = useState<'off' | 'on' | 'auto'>('off');
  const [isVideoMode, setIsVideoMode] = useState(mode === 'video');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible && !camPerm?.granted) requestCamPerm();
    if (visible && isVideoMode && !micPerm?.granted) requestMicPerm();
  }, [visible, isVideoMode]);

  useEffect(() => {
    if (recording) timerRef.current = setInterval(() => setElapsed((e) => e + 1000), 1000);
    else { if (timerRef.current) clearInterval(timerRef.current); setElapsed(0); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording]);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      if (!isVideoMode) {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
        if (photo?.uri) onCapture({ uri: photo.uri, type: 'image' });
      } else {
        if (recording) { cameraRef.current.stopRecording(); setRecording(false); }
        else {
          setRecording(true);
          const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
          setRecording(false);
          if (video?.uri) onCapture({ uri: video.uri, type: 'video' });
        }
      }
    } catch (e) { console.error(e); setRecording(false); }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" />
        {camPerm?.granted ? (
          <>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              flash={flash}
              mode={isVideoMode ? 'video' : 'picture'}
            />
            <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16 }}>
                <TouchableOpacity onPress={onClose} style={pickerStyles.camBtn}>
                  <Ionicons name="close" size={26} color="#FFF" />
                </TouchableOpacity>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => setFlash(f => f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off')} style={pickerStyles.camBtn}>
                    <Ionicons name={flash === 'off' ? 'flash-off' : flash === 'on' ? 'flash' : 'flash-outline'} size={22} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={pickerStyles.camBtn}>
                    <Ionicons name="camera-reverse" size={22} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>

            {mode === 'both' && (
              <View style={{ position: 'absolute', bottom: 170, alignSelf: 'center', flexDirection: 'row', gap: 20 }}>
                {(['photo', 'video'] as const).map((m) => {
                  const active = (m === 'video') === isVideoMode;
                  return (
                    <TouchableOpacity key={m} onPress={() => setIsVideoMode(m === 'video')}>
                      <Text style={{ color: active ? '#FFF' : 'rgba(255,255,255,0.5)', fontWeight: active ? '700' : '500', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>
                        {m === 'photo' ? 'Photo' : 'Vidéo'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {recording && (
              <View style={{ position: 'absolute', top: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F00', marginRight: 8 }} />
                <Text style={{ color: '#FFF', fontWeight: '600' }}>{formatDuration(elapsed)}</Text>
              </View>
            )}

            <View style={{ position: 'absolute', bottom: 60, alignSelf: 'center' }}>
              <TouchableOpacity
                onPress={handleCapture}
                activeOpacity={0.7}
                style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 5, borderColor: '#FFF', justifyContent: 'center', alignItems: 'center' }}
              >
                <View style={{
                  width: recording ? 30 : 58,
                  height: recording ? 30 : 58,
                  borderRadius: recording ? 6 : 29,
                  backgroundColor: recording ? '#E53935' : '#FFF',
                }} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Ionicons name="camera-outline" size={64} color="#FFF" />
            <Text style={{ color: '#FFF', marginTop: 16, textAlign: 'center' }}>Accès à la caméra requis</Text>
            <TouchableOpacity onPress={requestCamPerm} style={{ marginTop: 20, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 }}>
              <Text style={{ color: '#FFF', fontWeight: '700' }}>Autoriser</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
});

const AudioRecorderModal = memo(({
  visible, onClose, isDark, onRecorded,
}: {
  visible: boolean; onClose: () => void; isDark: boolean;
  onRecorded: (uri: string, durationMs: number) => void;
}) => {
  const colors = getPickerColors(isDark);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder, 200);
  const previewPlayer = useAudioPlayer(recorderState.url ? { uri: recorderState.url } : null);
  const previewStatus = useAudioPlayerStatus(previewPlayer);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const barsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (recorderState.isRecording && !recorderState.isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(barsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(barsAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    } else barsAnim.stopAnimation();
  }, [recorderState.isRecording, recorderState.isPaused]);

  useEffect(() => {
    if (recorderState.isRecording && !recorderState.isPaused) {
      timerRef.current = setInterval(() => setElapsed((e) => e + 100), 100);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recorderState.isRecording, recorderState.isPaused]);

  useEffect(() => {
    if (!visible) resetAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const resetAll = async () => {
    try {
      if (recorderState.isRecording) await audioRecorder.stop();
      if (previewPlayer) previewPlayer.pause();
    } catch {}
    setElapsed(0);
  };

  const startRecording = async () => {
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission', 'Accès au micro requis.'); return; }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setElapsed(0);
    } catch (e) { console.error(e); Alert.alert('Erreur', "Impossible de démarrer l'enregistrement"); }
  };

  const stopRecording = async () => { try { await audioRecorder.stop(); } catch (e) { console.error(e); } };

  const togglePause = async () => {
    try {
      if (recorderState.isPaused) audioRecorder.record();
      else audioRecorder.pause();
    } catch (e) { console.error(e); }
  };

  const togglePreview = async () => {
    if (!previewPlayer) return;
    if (previewStatus.playing) previewPlayer.pause();
    else { previewPlayer.seekTo(0); previewPlayer.play(); }
  };

  const handleSend = () => {
    if (recorderState.url) { onRecorded(recorderState.url, elapsed); resetAll(); }
  };

  const handleClose = async () => { await resetAll(); onClose(); };

  if (!visible) return null;

  const hasRecording = !!recorderState.url;
  const isRecording = recorderState.isRecording;
  const isPaused = recorderState.isPaused;

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' }}>
        <SafeAreaView style={{ backgroundColor: colors.sheet, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <View style={{ padding: 24, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>
                {hasRecording ? 'Aperçu audio' : isRecording ? 'Enregistrement...' : 'Message vocal'}
              </Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', height: 60, marginBottom: 24 }}>
              <TouchableOpacity
                onPress={hasRecording ? togglePreview : undefined}
                style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: hasRecording ? colors.primary : colors.recorder, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}
              >
                <Ionicons name={hasRecording ? (previewStatus.playing ? 'pause' : 'play') : (isRecording ? 'pause' : 'mic')} size={22} color="#FFF" />
              </TouchableOpacity>

              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 40 }}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map((i) => {
                  const base = 6 + ((i * 7) % 20);
                  const scale = isRecording && !isPaused && !hasRecording
                    ? barsAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1.4] })
                    : 1;
                  return (
                    <Animated.View
                      key={i}
                      style={{
                        width: 3, height: base, borderRadius: 2,
                        backgroundColor: hasRecording ? colors.primary : colors.textSecondary,
                        marginHorizontal: 2,
                        opacity: isRecording && !isPaused ? 0.9 : 0.5,
                        transform: [{ scaleY: scale }],
                      }}
                    />
                  );
                })}
              </View>

              <Text style={{ color: colors.text, fontWeight: '600', marginLeft: 12, minWidth: 44, textAlign: 'right' }}>
                {formatDuration(elapsed)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              {!hasRecording ? (
                <>
                  <TouchableOpacity onPress={handleClose} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: colors.border }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>Annuler</Text>
                  </TouchableOpacity>

                  {!isRecording ? (
                    <TouchableOpacity onPress={startRecording} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.recorder, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="mic" size={32} color="#FFF" />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={togglePause} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name={isPaused ? 'play' : 'pause'} size={30} color={colors.text} />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={stopRecording}
                    disabled={!isRecording}
                    style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: isRecording ? colors.danger : colors.border, opacity: isRecording ? 1 : 0.4 }}
                  >
                    <Ionicons name="stop" size={22} color="#FFF" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity onPress={resetAll} style={{ paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: colors.border }}>
                    <Text style={{ color: colors.text, fontWeight: '600' }}>Recommencer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleSend} style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="send" size={28} color="#FFF" />
                  </TouchableOpacity>

                  <View style={{ width: 100 }} />
                </>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

const ImageEditorModal = memo(({
  visible, uri, onClose, onSave,
}: {
  visible: boolean; uri: string | null; onClose: () => void;
  onSave: (newUri: string) => void;
}) => {
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (visible) { setRotation(0); setFlipH(false); }
  }, [visible, uri]);

  if (!visible || !uri) return null;

  const handleSave = async () => {
    try {
      setProcessing(true);
      const actions: ImageManipulator.Action[] = [];
      if (rotation !== 0) actions.push({ rotate: rotation });
      if (flipH) actions.push({ flip: ImageManipulator.FlipType.Horizontal });
      const result = await ImageManipulator.manipulateAsync(uri, actions, {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      onSave(result.uri);
    } catch (e) { console.error(e); Alert.alert('Erreur', "Impossible d'appliquer les modifications."); }
    finally { setProcessing(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <StatusBar barStyle="light-content" />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="#FFF" /></TouchableOpacity>
          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>Modifier</Text>
          <TouchableOpacity onPress={handleSave} disabled={processing}>
            {processing ? <ActivityIndicator color="#FFF" /> : <Ionicons name="checkmark" size={26} color="#FFF" />}
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Image
            source={{ uri }}
            style={{ width: SCREEN_W - 32, height: SCREEN_W - 32, transform: [{ rotate: `${rotation}deg` }, { scaleX: flipH ? -1 : 1 }] }}
            resizeMode="contain"
          />
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 24 }}>
          <TouchableOpacity onPress={() => setRotation((r) => r + 90)} style={{ alignItems: 'center' }}>
            <Ionicons name="refresh" size={26} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>Rotation</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFlipH((f) => !f)} style={{ alignItems: 'center' }}>
            <Ionicons name="swap-horizontal" size={26} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 11, marginTop: 4 }}>Miroir</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
});

const MediaThumbnail = ({ item, onRemove }: { item: MediaItem; onRemove: () => void }) => {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    if (item.type === 'video') {
      VideoThumbnails.getThumbnailAsync(item.uri, { time: 500 })
        .then(({ uri }) => mounted && setThumb(uri))
        .catch(() => {});
    }
    return () => { mounted = false; };
  }, [item]);

  return (
    <View style={styles.thumbnailWrapper}>
      <Image source={{ uri: item.type === 'video' ? (thumb || item.uri) : item.uri }} style={styles.thumbnail} />
      {item.type === 'video' && (
        <View style={styles.videoBadge}><Ionicons name="videocam" size={20} color="#FFF" /></View>
      )}
      <TouchableOpacity style={styles.removeBadge} onPress={onRemove}>
        <Ionicons name="close-circle" size={30} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export default function AdminView({ isDark = false }: AdminViewProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Modales
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [editorUri, setEditorUri] = useState<string | null>(null);

  // Aperçu audio (player inline)
  const previewPlayer = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const previewStatus = useAudioPlayerStatus(previewPlayer);

  const addMediaFromPicker = (media: PickedMedia) => {
    if (media.type === 'image') setEditorUri(media.uri);
    else setSelectedMedia((prev) => [...prev, { uri: media.uri, type: 'video' }]);
  };

  const handleEditorSave = (newUri: string) => {
    setSelectedMedia((prev) => [...prev, { uri: newUri, type: 'image' }]);
    setEditorUri(null);
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) setAudioUri(result.assets[0].uri);
    } catch (err) { console.log('Erreur sélection audio', err); }
  };

  const deleteAudio = () => setAudioUri(null);

  const toggleAudioPreview = () => {
    if (!previewPlayer) return;
    if (previewStatus.playing) previewPlayer.pause();
    else { previewPlayer.seekTo(0); previewPlayer.play(); }
  };

  // Upload Supabase
  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;
    if (type === 'video') {
      try {
        console.log('Compression de la vidéo...');
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) { console.log('Compression échouée, original utilisé', err); }
    }

    const file = new File(fileUri);
    const base64 = await file.base64();
    const arrayBuffer = decode(base64);

    const cleanUri = fileUri.split('?')[0];
    const extFromName = cleanUri.split('.').pop();
    const fileExt = extFromName && extFromName.length <= 5
      ? extFromName
      : type === 'video' ? 'mp4' : type === 'image' ? 'jpg' : 'm4a';

    const mimeType = type === 'video' ? 'video/mp4' : type === 'image' ? 'image/jpeg' : 'audio/m4a';
    const folder = type === 'audio' ? 'audios' : 'medias';
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media')
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    if (error) throw new Error(`Erreur Storage: ${error.message}`);

    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !audioUri) {
      Alert.alert('Rien à envoyer', 'Ajoutez une photo, vidéo ou vocal.');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Connectez-vous.');

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map((item) => uploadFileToSupabase(item.uri, item.type))
      );
      const uploadedAudioUrl = audioUri ? await uploadFileToSupabase(audioUri, 'audio') : null;

      const { error } = await supabase.from('posts').insert([{
        user_id: user.id,
        media_urls: uploadedMediaUrls,
        audio_url: uploadedAudioUrl,
      }]);
      if (error) throw error;

      Alert.alert('Succès !', 'Publication envoyée avec succès.');
      setSelectedMedia([]);
      deleteAudio();
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={() => setCameraOpen(true)} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={() => setGalleryOpen(true)} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF3B30' }]} onPress={() => setAudioOpen(true)} disabled={loading}>
          <Ionicons name="mic" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Parler</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((item, index) => (
              <MediaThumbnail key={index} item={item} onRemove={() => removeMedia(index)} />
            ))}
          </ScrollView>
        )}

        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={previewStatus.playing ? 'pause' : 'play'} size={30} color="#FFF" />
              <Text style={styles.btnPlayText}>{previewStatus.playing ? 'Pause' : 'Écouter'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio}>
              <Ionicons name="trash" size={30} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.btnSendHuge, loading ? styles.disabledBtn : null]}
        onPress={handlePublishProcess}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>

      {/* ==== Modales ==== */}
      <GalleryPickerModal
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        isDark={isDark}
        mediaTypes={['photo', 'video']}
        onSelect={(m) => { setGalleryOpen(false); setTimeout(() => addMediaFromPicker(m), 250); }}
      />

      <CameraModal
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        isDark={isDark}
        mode="both"
        onCapture={(m) => { setCameraOpen(false); setTimeout(() => addMediaFromPicker(m), 250); }}
      />

      <AudioRecorderModal
        visible={audioOpen}
        onClose={() => setAudioOpen(false)}
        isDark={isDark}
        onRecorded={(uri) => { setAudioUri(uri); setAudioOpen(false); }}
      />

      <ImageEditorModal
        visible={!!editorUri}
        uri={editorUri}
        onClose={() => setEditorUri(null)}
        onSave={handleEditorSave}
      />
    </ScrollView>
  );
}

// ==========================================
// STYLES
// ==========================================
const pickerStyles = StyleSheet.create({
  camBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
});

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },

  previewSection: { marginBottom: 20, minHeight: 50 },
  previewContainer: { flexDirection: 'row' },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 100, height: 100, borderRadius: 12, backgroundColor: '#DDD' },
  videoBadge: { position: 'absolute', bottom: 5, left: 5, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  removeBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 15 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },

  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 15, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 24, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
});





