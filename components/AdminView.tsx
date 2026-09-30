




















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























/*
// AdminView.tsx
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
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

// --- Nouveaux imports ---
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Gestion Caméra ---
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // --- Gestion Audio (expo-audio) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  // =========================================================================
  // 🛠 EXPO-IMAGE-MANIPULATOR : Optimisation des images (Résolution & Poids)
  // =========================================================================
  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      // On redimensionne l'image pour qu'elle ne dépasse pas 1080px de large
      // et on la compresse à 70% en JPEG pour économiser de la RAM et de la Data.
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], 
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.log("Erreur de manipulation de l'image:", error);
      return uri; // En cas d'erreur, on retourne l'image originale
    }
  };

  // =========================================================================
  // 📸 CAMÉRA (EXPO-CAMERA)
  // =========================================================================
  const openCamera = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    setIsCameraActive(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        // Prise de photo rapide sans traitement lourd natif
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
        if (photo) {
          setIsCameraActive(false); // Ferme la caméra immédiatement
          const optimizedUri = await optimizeImage(photo.uri);
          setSelectedMedia((prev) => [...prev, { uri: optimizedUri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const toggleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecordingVideo) {
        cameraRef.current.stopRecording();
        setIsRecordingVideo(false);
        setIsCameraActive(false);
      } else {
        setIsRecordingVideo(true);
        const video = await cameraRef.current.recordAsync();
        if (video) {
          setSelectedMedia((prev) => [...prev, { uri: video.uri, type: 'video' }]);
        }
      }
    }
  };

  // =========================================================================
  // 🖼 GALERIE (EXPO-IMAGE-PICKER)
  // =========================================================================
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 1, // On récupère la qualité max, puis on optimise
    });

    if (!result.canceled) {
      setLoading(true);
      // On traite toutes les images sélectionnées avec ImageManipulator
      const processedItems = await Promise.all(
        result.assets.map(async (asset) => {
          if (asset.type === 'video') {
            return { uri: asset.uri, type: 'video' as const };
          } else {
            const optimizedUri = await optimizeImage(asset.uri);
            return { uri: optimizedUri, type: 'image' as const };
          }
        })
      );
      setSelectedMedia((prev) => [...prev, ...processedItems]);
      setLoading(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // 🎙 AUDIO
  // =========================================================================
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

  const startRecordingAudio = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAudio = async () => {
    try {
      setIsRecordingAudio(false);
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
    if (player && playerStatus.playing) player.pause();
    setAudioUri(null);
  };

  // =========================================================================
  // 🚀 UPLOAD SUPABASE
  // =========================================================================
  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;

    if (type === 'video') {
      try {
        console.log('Compression de la vidéo en cours...');
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) {
        console.log('Erreur de compression vidéo', err);
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

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
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

  // =========================================================================
  // 🖥 RENDU - VUE CAMÉRA
  // =========================================================================
  if (isCameraActive) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing} 
          mode={cameraMode}
        >
         
          <View style={styles.cameraTopControls}>
            <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.iconButton}>
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setCameraMode(prev => prev === 'picture' ? 'video' : 'picture')}
              style={styles.modeToggleBtn}
            >
              <Ionicons name={cameraMode === 'picture' ? "camera" : "videocam"} size={20} color="#FFF" />
              <Text style={styles.modeToggleText}>
                {cameraMode === 'picture' ? 'Mode Photo' : 'Mode Vidéo'}
              </Text>
            </TouchableOpacity>
          </View>

          
          <View style={styles.cameraBottomControls}>
            <View style={{ width: 50 }} /> 
            <TouchableOpacity 
              style={[styles.captureButton, isRecordingVideo && styles.recordingButton]}
              onPress={cameraMode === 'picture' ? takePicture : toggleRecordVideo}
            />

            <TouchableOpacity 
              onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} 
              style={styles.iconButton}
            >
              <Ionicons name="camera-reverse" size={32} color="#FFF" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // 🖥 RENDU - VUE ADMIN (NORMALE)
  // =========================================================================
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecordingAudio ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} 
          disabled={loading}
        >
          <Ionicons name={isRecordingAudio ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecordingAudio ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        
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
  
  // --- Styles Caméra ---
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1, justifyContent: 'space-between' },
  cameraTopControls: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  cameraBottomControls: { flexDirection: 'row', justifyContent: 'space-between', padding: 30, alignItems: 'center', paddingBottom: 50 },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  recordingButton: { backgroundColor: '#FF3B30' },
  modeToggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeToggleText: { color: '#FFF', fontWeight: 'bold' }
});
*/















/*
// AdminView.tsx
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
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

// --- Imports Caméra & Manipulation ---
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

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
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Gestion Caméra ---
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // --- Gestion Audio (expo-audio) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  // =========================================================================
  // 🛠 EXPO-IMAGE-MANIPULATOR : Optimisation des images (Résolution & Poids)
  // =========================================================================
  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], 
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.log("Erreur de manipulation de l'image:", error);
      return uri;
    }
  };

  // =========================================================================
  // 📸 CAMÉRA (EXPO-CAMERA)
  // =========================================================================
  const openCamera = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    setIsCameraActive(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true });
        if (photo) {
          setIsCameraActive(false);
          const optimizedUri = await optimizeImage(photo.uri);
          setSelectedMedia((prev) => [...prev, { uri: optimizedUri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const toggleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecordingVideo) {
        cameraRef.current.stopRecording();
        setIsRecordingVideo(false);
        setIsCameraActive(false);
      } else {
        setIsRecordingVideo(true);
        const video = await cameraRef.current.recordAsync();
        if (video) {
          setSelectedMedia((prev) => [...prev, { uri: video.uri, type: 'video' }]);
        }
      }
    }
  };

  // =========================================================================
  // 🖼 GALERIE (EXPO-IMAGE-PICKER)
  // =========================================================================
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLoading(true);
      const processedItems = await Promise.all(
        result.assets.map(async (asset) => {
          if (asset.type === 'video') {
            return { uri: asset.uri, type: 'video' as const };
          } else {
            const optimizedUri = await optimizeImage(asset.uri);
            return { uri: optimizedUri, type: 'image' as const };
          }
        })
      );
      setSelectedMedia((prev) => [...prev, ...processedItems]);
      setLoading(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // 🎙 AUDIO
  // =========================================================================
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

  const startRecordingAudio = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAudio = async () => {
    try {
      setIsRecordingAudio(false);
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
    if (player && playerStatus.playing) player.pause();
    setAudioUri(null);
  };

  // =========================================================================
  // 🚀 UPLOAD SUPABASE
  // =========================================================================
  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;

    if (type === 'video') {
      try {
        console.log('Compression de la vidéo en cours...');
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) {
        console.log('Erreur de compression vidéo', err);
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

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
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

  // =========================================================================
  // 🖥 RENDU - VUE CAMÉRA (Overlay autonome)
  // =========================================================================
  if (isCameraActive) {
    return (
      <SafeAreaView style={styles.cameraContainer}>
        <View style={styles.cameraWrapper}>
          <CameraView 
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject} 
            facing={facing} 
            mode={cameraMode}
          />

          <View style={styles.cameraOverlay}>
            <View style={styles.cameraTopControls}>
              <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.iconButton}>
                <Ionicons name="close" size={32} color="#FFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setCameraMode(prev => prev === 'picture' ? 'video' : 'picture')}
                style={styles.modeToggleBtn}
              >
                <Ionicons name={cameraMode === 'picture' ? "camera" : "videocam"} size={20} color="#FFF" />
                <Text style={styles.modeToggleText}>
                  {cameraMode === 'picture' ? 'Mode Photo' : 'Mode Vidéo'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cameraBottomControls}>
              <View style={{ width: 50 }} /> 
              <TouchableOpacity 
                style={[styles.captureButton, isRecordingVideo && styles.recordingButton]}
                onPress={cameraMode === 'picture' ? takePicture : toggleRecordVideo}
              />

              <TouchableOpacity 
                onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} 
                style={styles.iconButton}
              >
                <Ionicons name="camera-reverse" size={32} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================================
  // 🖥 RENDU - VUE ADMIN (NORMALE)
  // =========================================================================
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecordingAudio ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} 
          disabled={loading}
        >
          <Ionicons name={isRecordingAudio ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecordingAudio ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        
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
  
  // --- Styles Caméra ---
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cameraTopControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    paddingTop: 40 
  },
  cameraBottomControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 30, 
    alignItems: 'center', 
    paddingBottom: 50 
  },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  recordingButton: { backgroundColor: '#FF3B30' },
  modeToggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeToggleText: { color: '#FFF', fontWeight: 'bold' }
});
*/















/*
// AdminView.tsx
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
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

// --- Imports Caméra & Manipulation ---
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

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
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Modal de Retouche Image ---
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // --- Gestion Caméra ---
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // --- Gestion Audio (expo-audio) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  // =========================================================================
  // 🛠 EXPO-IMAGE-MANIPULATOR : Optimisation & Retouche des images
  // =========================================================================
  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], 
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.log("Erreur de manipulation de l'image:", error);
      return uri;
    }
  };

  const rotateImage = async (index: number) => {
    const item = selectedMedia[index];
    if (item.type !== 'image') return;
    try {
      setLoading(true);
      const result = await manipulateAsync(
        item.uri,
        [{ rotate: 90 }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setSelectedMedia((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], uri: result.uri };
        return updated;
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de pivoter l\'image.');
    } finally {
      setLoading(false);
    }
  };

  const flipImage = async (index: number) => {
    const item = selectedMedia[index];
    if (item.type !== 'image') return;
    try {
      setLoading(true);
      const result = await manipulateAsync(
        item.uri,
        [{ flip: FlipType.Horizontal }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setSelectedMedia((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], uri: result.uri };
        return updated;
      });
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de retourner l\'image.');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 📸 CAMÉRA (EXPO-CAMERA)
  // =========================================================================
  const openCamera = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    setIsCameraActive(true);
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
        if (photo) {
          setIsCameraActive(false);
          const optimizedUri = await optimizeImage(photo.uri);
          setSelectedMedia((prev) => [...prev, { uri: optimizedUri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const toggleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecordingVideo) {
        cameraRef.current.stopRecording();
        setIsRecordingVideo(false);
        setIsCameraActive(false);
      } else {
        setIsRecordingVideo(true);
        const video = await cameraRef.current.recordAsync();
        if (video) {
          setSelectedMedia((prev) => [...prev, { uri: video.uri, type: 'video' }]);
        }
      }
    }
  };

  // =========================================================================
  // 🖼 GALERIE (EXPO-IMAGE-PICKER)
  // =========================================================================
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLoading(true);
      const processedItems = await Promise.all(
        result.assets.map(async (asset) => {
          if (asset.type === 'video') {
            return { uri: asset.uri, type: 'video' as const };
          } else {
            const optimizedUri = await optimizeImage(asset.uri);
            return { uri: optimizedUri, type: 'image' as const };
          }
        })
      );
      setSelectedMedia((prev) => [...prev, ...processedItems]);
      setLoading(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  // =========================================================================
  // 🎙 AUDIO
  // =========================================================================
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAudio = async () => {
    try {
      setIsRecordingAudio(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = recorder.uri;
      if (uri) setAudioUri(uri);
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  const toggleAudioPreview = async () => {
    if (!player) return;
    try {
      // S'assurer que le mode d'enregistrement est désactivé pour la lecture haut-parleur
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playerStatus.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (err) {
      console.log('Erreur lecture audio:', err);
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) player.pause();
    setAudioUri(null);
  };

  // =========================================================================
  // 🚀 UPLOAD SUPABASE
  // =========================================================================
  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;

    if (type === 'video') {
      try {
        console.log('Compression de la vidéo en cours...');
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) {
        console.log('Erreur de compression vidéo', err);
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

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
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

  // =========================================================================
  // 🖥 RENDU PRINCIPAL
  // =========================================================================
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
   
      <Modal
        visible={isCameraActive}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraActive(false)}
      >
        <SafeAreaView style={styles.cameraContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject} 
              facing={facing} 
              mode={cameraMode}
            />

            <View style={styles.cameraOverlay}>
              <View style={styles.cameraTopControls}>
                <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setCameraMode(prev => prev === 'picture' ? 'video' : 'picture')}
                  style={styles.modeToggleBtn}
                >
                  <Ionicons name={cameraMode === 'picture' ? "camera" : "videocam"} size={20} color="#FFF" />
                  <Text style={styles.modeToggleText}>
                    {cameraMode === 'picture' ? 'Mode Photo' : 'Mode Vidéo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cameraBottomControls}>
                <View style={{ width: 50 }} /> 
                <TouchableOpacity 
                  style={[styles.captureButton, isRecordingVideo && styles.recordingButton]}
                  onPress={cameraMode === 'picture' ? takePicture : toggleRecordVideo}
                />

                <TouchableOpacity 
                  onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} 
                  style={styles.iconButton}
                >
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

    
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecordingAudio ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} 
          disabled={loading}
        >
          <Ionicons name={isRecordingAudio ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecordingAudio ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                
                {item.type === 'video' ? (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={18} color="#FFF" />
                  </View>
                ) : (
               
                  <TouchableOpacity 
                    style={styles.editBadge} 
                    onPress={() => setEditingIndex(editingIndex === index ? null : index)}
                  >
                    <Ionicons name="pencil" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                </TouchableOpacity>

              
                {editingIndex === index && item.type === 'image' && (
                  <View style={styles.retouchToolbar}>
                    <TouchableOpacity onPress={() => rotateImage(index)} style={styles.retouchBtn}>
                      <Ionicons name="refresh-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => flipImage(index)} style={styles.retouchBtn}>
                      <Ionicons name="swap-horizontal-outline" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter le vocal"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio} style={styles.btnDeleteAudio}>
              <Ionicons name="trash" size={26} color="#FF3B30" />
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
            <Ionicons name="send" size={30} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 60 },
  previewContainer: { flexDirection: 'row', paddingVertical: 10 },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 110, borderRadius: 14 },
  videoBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },
  
  retouchToolbar: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    padding: 4,
    gap: 8,
  },
  retouchBtn: { padding: 4 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnDeleteAudio: { padding: 6 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  
  // --- Styles Caméra Modal ---
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cameraTopControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    paddingTop: 40 
  },
  cameraBottomControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 30, 
    alignItems: 'center', 
    paddingBottom: 50 
  },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  recordingButton: { backgroundColor: '#FF3B30' },
  modeToggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeToggleText: { color: '#FFF', fontWeight: 'bold' }
});
*/
























/*
// AdminView.tsx
import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
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

// --- Imports Caméra & Manipulation ---
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Modal Studio de Retouche Image ---
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [tempEditedUri, setTempEditedUri] = useState<string | null>(null);

  // --- Gestion Caméra ---
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // --- Gestion Audio (expo-audio) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : null);
  const playerStatus = useAudioPlayerStatus(player);

  // =========================================================================
  // 🛠 EXPO-IMAGE-MANIPULATOR : Compression & Retouche
  // =========================================================================
  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], 
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.log("Erreur de manipulation de l'image:", error);
      return uri;
    }
  };

  const openImageEditor = (index: number) => {
    if (selectedMedia[index]?.type === 'image') {
      setEditingImageIndex(index);
      setTempEditedUri(selectedMedia[index].uri);
    }
  };

  const applyRotate = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ rotate: 90 }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la rotation.');
    }
  };

  const applyFlipHorizontal = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ flip: FlipType.Horizontal }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec du mode miroir.');
    }
  };

  const applyFlipVertical = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ flip: FlipType.Vertical }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec du retournement.');
    }
  };

  const applySquareCrop = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ crop: { originX: 0, originY: 0, width: 800, height: 800 } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec du rognage.');
    }
  };

  const saveEditedImage = () => {
    if (editingImageIndex !== null && tempEditedUri) {
      setSelectedMedia((prev) => {
        const updated = [...prev];
        updated[editingImageIndex] = { ...updated[editingImageIndex], uri: tempEditedUri };
        return updated;
      });
    }
    closeImageEditor();
  };

  const closeImageEditor = () => {
    setEditingImageIndex(null);
    setTempEditedUri(null);
  };

  // =========================================================================
  // 📸 CAMÉRA (EXPO-CAMERA)
  // =========================================================================
  const openCamera = async () => {
    let camPerm = cameraPermission;
    let micPerm = micPermission;

    if (!camPerm?.granted) {
      camPerm = await requestCameraPermission();
    }
    if (!micPerm?.granted) {
      micPerm = await requestMicPermission();
    }

    if (camPerm?.granted) {
      setIsCameraActive(true);
    } else {
      Alert.alert('Permission requise', 'Accès à la caméra refusé.');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
        if (photo) {
          setIsCameraActive(false);
          const optimizedUri = await optimizeImage(photo.uri);
          setSelectedMedia((prev) => [...prev, { uri: optimizedUri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const toggleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecordingVideo) {
        cameraRef.current.stopRecording();
        setIsRecordingVideo(false);
        setIsCameraActive(false);
      } else {
        setIsRecordingVideo(true);
        const video = await cameraRef.current.recordAsync();
        if (video) {
          setSelectedMedia((prev) => [...prev, { uri: video.uri, type: 'video' }]);
        }
      }
    }
  };

  // =========================================================================
  // 🖼 GALERIE (EXPO-IMAGE-PICKER)
  // =========================================================================
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLoading(true);
      const processedItems = await Promise.all(
        result.assets.map(async (asset) => {
          if (asset.type === 'video') {
            return { uri: asset.uri, type: 'video' as const };
          } else {
            const optimizedUri = await optimizeImage(asset.uri);
            return { uri: optimizedUri, type: 'image' as const };
          }
        })
      );
      setSelectedMedia((prev) => [...prev, ...processedItems]);
      setLoading(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // 🎙 AUDIO
  // =========================================================================
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAudio = async () => {
    try {
      setIsRecordingAudio(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = recorder.uri;
      if (uri) setAudioUri(uri);
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  const toggleAudioPreview = async () => {
    if (!player) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playerStatus.playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch (err) {
      console.log('Erreur lecture audio:', err);
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) player.pause();
    setAudioUri(null);
  };

  // =========================================================================
  // 🚀 UPLOAD SUPABASE
  // =========================================================================
  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;

    if (type === 'video') {
      try {
        console.log('Compression de la vidéo en cours...');
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) {
        console.log('Erreur de compression vidéo', err);
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

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
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

  // =========================================================================
  // 🖥 RENDU PRINCIPAL
  // =========================================================================
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
    
      <Modal
        visible={isCameraActive}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraActive(false)}
      >
        <SafeAreaView style={styles.cameraContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={{ flex: 1 }} 
              facing={facing} 
              mode={cameraMode}
            />

            <View style={styles.cameraOverlay}>
              <View style={styles.cameraTopControls}>
                <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setCameraMode(prev => prev === 'picture' ? 'video' : 'picture')}
                  style={styles.modeToggleBtn}
                >
                  <Ionicons name={cameraMode === 'picture' ? "camera" : "videocam"} size={20} color="#FFF" />
                  <Text style={styles.modeToggleText}>
                    {cameraMode === 'picture' ? 'Mode Photo' : 'Mode Vidéo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cameraBottomControls}>
                <View style={{ width: 50 }} /> 
                <TouchableOpacity 
                  style={[styles.captureButton, isRecordingVideo && styles.recordingButton]}
                  onPress={cameraMode === 'picture' ? takePicture : toggleRecordVideo}
                />

                <TouchableOpacity 
                  onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} 
                  style={styles.iconButton}
                >
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

    
      <Modal
        visible={editingImageIndex !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={closeImageEditor}
      >
        <SafeAreaView style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={closeImageEditor} style={styles.editorHeaderBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
              <Text style={styles.editorHeaderBtnText}>Annuler</Text>
            </TouchableOpacity>

            <Text style={styles.editorTitle}>Retoucher l'image</Text>

            <TouchableOpacity onPress={saveEditedImage} style={[styles.editorHeaderBtn, styles.editorSaveBtn]}>
              <Ionicons name="checkmark" size={24} color="#FFF" />
              <Text style={styles.editorHeaderBtnText}>OK</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editorPreviewContainer}>
            {tempEditedUri && (
              <Image source={{ uri: tempEditedUri }} style={styles.editorPreviewImage} resizeMode="contain" />
            )}
          </View>

          <View style={styles.editorToolbar}>
            <TouchableOpacity onPress={applyRotate} style={styles.toolBtn}>
              <Ionicons name="refresh-outline" size={26} color="#FFF" />
              <Text style={styles.toolText}>Pivoter 90°</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipHorizontal} style={styles.toolBtn}>
              <Ionicons name="swap-horizontal-outline" size={26} color="#FFF" />
              <Text style={styles.toolText}>Miroir</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipVertical} style={styles.toolBtn}>
              <Ionicons name="swap-vertical-outline" size={26} color="#FFF" />
              <Text style={styles.toolText}>Vertical</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applySquareCrop} style={styles.toolBtn}>
              <Ionicons name="crop-outline" size={26} color="#FFF" />
              <Text style={styles.toolText}>Carré 1:1</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

    
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecordingAudio ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} 
          disabled={loading}
        >
          <Ionicons name={isRecordingAudio ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecordingAudio ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                
                {item.type === 'video' ? (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={18} color="#FFF" />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.editBadge} 
                    onPress={() => openImageEditor(index)}
                  >
                    <Ionicons name="pencil" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

      
        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter le vocal"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio} style={styles.btnDeleteAudio}>
              <Ionicons name="trash" size={26} color="#FF3B30" />
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
            <Ionicons name="send" size={30} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 60 },
  previewContainer: { flexDirection: 'row', paddingVertical: 10 },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 110, borderRadius: 14 },
  videoBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnDeleteAudio: { padding: 6 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  
  // --- Styles Caméra Modal ---
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cameraTopControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    paddingTop: 40 
  },
  cameraBottomControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 30, 
    alignItems: 'center', 
    paddingBottom: 50 
  },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  recordingButton: { backgroundColor: '#FF3B30' },
  modeToggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeToggleText: { color: '#FFF', fontWeight: 'bold' },

  // --- Styles Modal Éditeur de retouche ---
  editorContainer: { flex: 1, backgroundColor: '#1C1C1E' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#38383A' },
  editorHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editorHeaderBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  editorTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  editorSaveBtn: { backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editorPreviewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  editorPreviewImage: { width: SCREEN_WIDTH - 20, height: '100%' },
  editorToolbar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 20, borderTopWidth: 0.5, borderColor: '#38383A', backgroundColor: '#000' },
  toolBtn: { alignItems: 'center', gap: 6 },
  toolText: { color: '#FFF', fontSize: 12, fontWeight: '500' },
});
*/














/*
// AdminView.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
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

// --- Imports Caméra & Manipulation ---
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Modal Studio de Retouche Image ---
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [tempEditedUri, setTempEditedUri] = useState<string | null>(null);

  // --- Gestion Caméra ---
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // --- Gestion Audio (expo-audio) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : { uri: '' });
  const playerStatus = useAudioPlayerStatus(player);

  // S'assurer que le lecteur audio se met à jour quand l'URI change
  useEffect(() => {
    if (audioUri && player) {
      player.replace({ uri: audioUri });
    }
  }, [audioUri]);

  // =========================================================================
  // 🛠 EXPO-IMAGE-MANIPULATOR : Compression & Retouche Flexible
  // =========================================================================
  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], 
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.log("Erreur de manipulation de l'image:", error);
      return uri;
    }
  };

  const openImageEditor = (index: number) => {
    if (selectedMedia[index]?.type === 'image') {
      setEditingImageIndex(index);
      setTempEditedUri(selectedMedia[index].uri);
    }
  };

  const applyRotate = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ rotate: 90 }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la rotation.');
    }
  };

  const applyFlipHorizontal = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ flip: FlipType.Horizontal }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec du mode miroir.');
    }
  };

  const applyFlipVertical = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ flip: FlipType.Vertical }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec du retournement.');
    }
  };

  // Recadrage dynamique et flexible selon les dimensions de l'image
  const applyCropPreset = async (ratioType: 'square' | 'portrait' | 'landscape' | 'center') => {
    if (!tempEditedUri) return;
    try {
      Image.getSize(tempEditedUri, async (width, height) => {
        let cropWidth = width;
        let cropHeight = height;
        let originX = 0;
        let originY = 0;

        if (ratioType === 'square') {
          const size = Math.min(width, height);
          cropWidth = size;
          cropHeight = size;
          originX = (width - size) / 2;
          originY = (height - size) / 2;
        } else if (ratioType === 'portrait') {
          // Format 3:4
          if (width / height > 3 / 4) {
            cropHeight = height;
            cropWidth = height * (3 / 4);
            originX = (width - cropWidth) / 2;
            originY = 0;
          } else {
            cropWidth = width;
            cropHeight = width * (4 / 3);
            originX = 0;
            originY = (height - cropHeight) / 2;
          }
        } else if (ratioType === 'landscape') {
          // Format 4:3
          if (width / height > 4 / 3) {
            cropWidth = width;
            cropHeight = width * (3 / 4);
            originX = 0;
            originY = (height - cropHeight) / 2;
          } else {
            cropHeight = height;
            cropWidth = height * (4 / 3);
            originX = (width - cropWidth) / 2;
            originY = 0;
          }
        } else if (ratioType === 'center') {
          cropWidth = width * 0.8;
          cropHeight = height * 0.8;
          originX = width * 0.1;
          originY = height * 0.1;
        }

        const result = await manipulateAsync(
          tempEditedUri,
          [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
          { compress: 0.8, format: SaveFormat.JPEG }
        );
        setTempEditedUri(result.uri);
      }, () => {
        Alert.alert('Erreur', "Impossible de lire les dimensions de l'image.");
      });
    } catch (err) {
      Alert.alert('Erreur', 'Échec du rognage.');
    }
  };

  const saveEditedImage = () => {
    if (editingImageIndex !== null && tempEditedUri) {
      setSelectedMedia((prev) => {
        const updated = [...prev];
        updated[editingImageIndex] = { ...updated[editingImageIndex], uri: tempEditedUri };
        return updated;
      });
    }
    closeImageEditor();
  };

  const closeImageEditor = () => {
    setEditingImageIndex(null);
    setTempEditedUri(null);
  };

  // =========================================================================
  // 📸 CAMÉRA (EXPO-CAMERA)
  // =========================================================================
  const openCamera = async () => {
    let camPerm = cameraPermission;
    let micPerm = micPermission;

    if (!camPerm?.granted) {
      camPerm = await requestCameraPermission();
    }
    if (!micPerm?.granted) {
      micPerm = await requestMicPermission();
    }

    if (camPerm?.granted) {
      setIsCameraActive(true);
    } else {
      Alert.alert('Permission requise', 'Accès à la caméra refusé.');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
        if (photo) {
          setIsCameraActive(false);
          const optimizedUri = await optimizeImage(photo.uri);
          setSelectedMedia((prev) => [...prev, { uri: optimizedUri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const toggleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecordingVideo) {
        cameraRef.current.stopRecording();
        setIsRecordingVideo(false);
        setIsCameraActive(false);
      } else {
        setIsRecordingVideo(true);
        const video = await cameraRef.current.recordAsync();
        if (video) {
          setSelectedMedia((prev) => [...prev, { uri: video.uri, type: 'video' }]);
        }
      }
    }
  };

  // =========================================================================
  // 🖼 GALERIE (EXPO-IMAGE-PICKER)
  // =========================================================================
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLoading(true);
      const processedItems = await Promise.all(
        result.assets.map(async (asset) => {
          if (asset.type === 'video') {
            return { uri: asset.uri, type: 'video' as const };
          } else {
            const optimizedUri = await optimizeImage(asset.uri);
            return { uri: optimizedUri, type: 'image' as const };
          }
        })
      );
      setSelectedMedia((prev) => [...prev, ...processedItems]);
      setLoading(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // 🎙 AUDIO
  // =========================================================================
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAudio = async () => {
    try {
      setIsRecordingAudio(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = recorder.uri;
      if (uri) {
        setAudioUri(uri);
        if (player) {
          player.replace({ uri });
        }
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  const toggleAudioPreview = async () => {
    if (!audioUri || !player) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playerStatus.playing) {
        player.pause();
      } else {
        player.seekTo(0);
        player.play();
      }
    } catch (err) {
      console.log('Erreur lecture audio:', err);
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) player.pause();
    setAudioUri(null);
  };

  // =========================================================================
  // 🚀 UPLOAD SUPABASE
  // =========================================================================
  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;

    if (type === 'video') {
      try {
        console.log('Compression de la vidéo en cours...');
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) {
        console.log('Erreur de compression vidéo', err);
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

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
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

  // =========================================================================
  // 🖥 RENDU PRINCIPAL
  // =========================================================================
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
    
      <Modal
        visible={isCameraActive}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraActive(false)}
      >
        <SafeAreaView style={styles.cameraContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={{ flex: 1 }} 
              facing={facing} 
              mode={cameraMode}
            />

            <View style={styles.cameraOverlay}>
              <View style={styles.cameraTopControls}>
                <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setCameraMode(prev => prev === 'picture' ? 'video' : 'picture')}
                  style={styles.modeToggleBtn}
                >
                  <Ionicons name={cameraMode === 'picture' ? "camera" : "videocam"} size={20} color="#FFF" />
                  <Text style={styles.modeToggleText}>
                    {cameraMode === 'picture' ? 'Mode Photo' : 'Mode Vidéo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cameraBottomControls}>
                <View style={{ width: 50 }} /> 
                <TouchableOpacity 
                  style={[styles.captureButton, isRecordingVideo && styles.recordingButton]}
                  onPress={cameraMode === 'picture' ? takePicture : toggleRecordVideo}
                />

                <TouchableOpacity 
                  onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} 
                  style={styles.iconButton}
                >
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={editingImageIndex !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={closeImageEditor}
      >
        <SafeAreaView style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={closeImageEditor} style={styles.editorHeaderBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
              <Text style={styles.editorHeaderBtnText}>Annuler</Text>
            </TouchableOpacity>

            <Text style={styles.editorTitle}>Retoucher l'image</Text>

            <TouchableOpacity onPress={saveEditedImage} style={[styles.editorHeaderBtn, styles.editorSaveBtn]}>
              <Ionicons name="checkmark" size={24} color="#FFF" />
              <Text style={styles.editorHeaderBtnText}>OK</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editorPreviewContainer}>
            {tempEditedUri && (
              <Image source={{ uri: tempEditedUri }} style={styles.editorPreviewImage} resizeMode="contain" />
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editorToolbar}>
            <TouchableOpacity onPress={applyRotate} style={styles.toolBtn}>
              <Ionicons name="refresh-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Pivoter</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipHorizontal} style={styles.toolBtn}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Miroir</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipVertical} style={styles.toolBtn}>
              <Ionicons name="swap-vertical-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Vertical</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => applyCropPreset('square')} style={styles.toolBtn}>
              <Ionicons name="crop-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Carré 1:1</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => applyCropPreset('portrait')} style={styles.toolBtn}>
              <Ionicons name="phone-portrait-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Portrait 3:4</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => applyCropPreset('landscape')} style={styles.toolBtn}>
              <Ionicons name="phone-landscape-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Paysage 4:3</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => applyCropPreset('center')} style={styles.toolBtn}>
              <Ionicons name="scan-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Centré 80%</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

   
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecordingAudio ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} 
          disabled={loading}
        >
          <Ionicons name={isRecordingAudio ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecordingAudio ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

    
      <View style={styles.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                
                {item.type === 'video' ? (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={18} color="#FFF" />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.editBadge} 
                    onPress={() => openImageEditor(index)}
                  >
                    <Ionicons name="pencil" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

   
        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter le vocal"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio} style={styles.btnDeleteAudio}>
              <Ionicons name="trash" size={26} color="#FF3B30" />
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
            <Ionicons name="send" size={30} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 60 },
  previewContainer: { flexDirection: 'row', paddingVertical: 10 },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 110, borderRadius: 14 },
  videoBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnDeleteAudio: { padding: 6 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  
  // --- Styles Caméra Modal ---
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cameraTopControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    paddingTop: 40 
  },
  cameraBottomControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 30, 
    alignItems: 'center', 
    paddingBottom: 50 
  },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  recordingButton: { backgroundColor: '#FF3B30' },
  modeToggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeToggleText: { color: '#FFF', fontWeight: 'bold' },

  // --- Styles Modal Éditeur de retouche ---
  editorContainer: { flex: 1, backgroundColor: '#1C1C1E' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#38383A' },
  editorHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editorHeaderBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  editorTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  editorSaveBtn: { backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editorPreviewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 10 },
  editorPreviewImage: { width: SCREEN_WIDTH - 20, height: '100%' },
  editorToolbar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderTopWidth: 0.5, borderColor: '#38383A', backgroundColor: '#000', gap: 15 },
  toolBtn: { alignItems: 'center', gap: 4, minWidth: 70 },
  toolText: { color: '#FFF', fontSize: 11, fontWeight: '500', textAlign: 'center' },
});
*/














/*
// AdminView.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
  PanResponder,
  Animated,
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

// --- Imports Caméra & Manipulation ---
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CROP_BOX_SIZE = SCREEN_WIDTH - 40; // Cadre carré style WhatsApp

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
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Modal Studio de Retouche Image (Grille style WhatsApp) ---
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [tempEditedUri, setTempEditedUri] = useState<string | null>(null);
  
  const [scale, setScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panX.setOffset(panOffset.x);
        panY.setOffset(panOffset.y);
        panX.setValue(0);
        panY.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: panX, dy: panY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        panX.flattenOffset();
        panY.flattenOffset();
        setPanOffset({
          x: panOffset.x + gestureState.dx,
          y: panOffset.y + gestureState.dy,
        });
      },
    })
  ).current;

  // --- Gestion Caméra ---
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // --- Gestion Audio (expo-audio) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : { uri: '' });
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (audioUri && player) {
      player.replace({ uri: audioUri });
    }
  }, [audioUri]);

  // =========================================================================
  // 🛠 EXPO-IMAGE-MANIPULATOR : Compression & Retouche Grille
  // =========================================================================
  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], 
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.log("Erreur de manipulation de l'image:", error);
      return uri;
    }
  };

  const openImageEditor = (index: number) => {
    if (selectedMedia[index]?.type === 'image') {
      setEditingImageIndex(index);
      setTempEditedUri(selectedMedia[index].uri);
      setScale(1);
      setPanOffset({ x: 0, y: 0 });
      panX.setValue(0);
      panY.setValue(0);
    }
  };

  const applyRotate = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ rotate: 90 }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la rotation.');
    }
  };

  const applyFlipHorizontal = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ flip: FlipType.Horizontal }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec du mode miroir.');
    }
  };

  const applyFlipVertical = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ flip: FlipType.Vertical }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec du retournement.');
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 4.0));
  };

  const zoomOut = () => {
    setScale(prev => {
      const newScale = Math.max(prev - 0.25, 1.0);
      if (newScale === 1.0) {
        setPanOffset({ x: 0, y: 0 });
        panX.setValue(0);
        panY.setValue(0);
      }
      return newScale;
    });
  };

  const resetZoom = () => {
    setScale(1.0);
    setPanOffset({ x: 0, y: 0 });
    panX.setValue(0);
    panY.setValue(0);
  };

  const saveEditedImage = async () => {
    if (!tempEditedUri || editingImageIndex === null) return;
    try {
      Image.getSize(tempEditedUri, async (origWidth, origHeight) => {
        let cropWidth = origWidth / scale;
        let cropHeight = origHeight / scale;

        let originX = (origWidth - cropWidth) / 2 - (panOffset.x * (origWidth / CROP_BOX_SIZE));
        let originY = (origHeight - cropHeight) / 2 - (panOffset.y * (origHeight / CROP_BOX_SIZE));

        originX = Math.max(0, Math.min(originX, origWidth - cropWidth));
        originY = Math.max(0, Math.min(originY, origHeight - cropHeight));

        const result = await manipulateAsync(
          tempEditedUri,
          [{ crop: { originX, originY, width: cropWidth, height: cropHeight } }],
          { compress: 0.8, format: SaveFormat.JPEG }
        );

        setSelectedMedia((prev) => {
          const updated = [...prev];
          updated[editingImageIndex] = { ...updated[editingImageIndex], uri: result.uri };
          return updated;
        });
        closeImageEditor();
      }, () => {
        Alert.alert('Erreur', "Impossible de lire les dimensions de l'image.");
        closeImageEditor();
      });
    } catch (err) {
      Alert.alert('Erreur', 'Échec du rognage.');
      closeImageEditor();
    }
  };

  const closeImageEditor = () => {
    setEditingImageIndex(null);
    setTempEditedUri(null);
  };

  // =========================================================================
  // 📸 CAMÉRA (EXPO-CAMERA)
  // =========================================================================
  const openCamera = async () => {
    let camPerm = cameraPermission;
    let micPerm = micPermission;

    if (!camPerm?.granted) {
      camPerm = await requestCameraPermission();
    }
    if (!micPerm?.granted) {
      micPerm = await requestMicPermission();
    }

    if (camPerm?.granted) {
      setIsCameraActive(true);
    } else {
      Alert.alert('Permission requise', 'Accès à la caméra refusé.');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
        if (photo) {
          setIsCameraActive(false);
          const optimizedUri = await optimizeImage(photo.uri);
          setSelectedMedia((prev) => [...prev, { uri: optimizedUri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const toggleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecordingVideo) {
        cameraRef.current.stopRecording();
        setIsRecordingVideo(false);
        setIsCameraActive(false);
      } else {
        setIsRecordingVideo(true);
        const video = await cameraRef.current.recordAsync();
        if (video) {
          setSelectedMedia((prev) => [...prev, { uri: video.uri, type: 'video' }]);
        }
      }
    }
  };

  // =========================================================================
  // 🖼 GALERIE (EXPO-IMAGE-PICKER)
  // =========================================================================
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLoading(true);
      const processedItems = await Promise.all(
        result.assets.map(async (asset) => {
          if (asset.type === 'video') {
            return { uri: asset.uri, type: 'video' as const };
          } else {
            const optimizedUri = await optimizeImage(asset.uri);
            return { uri: optimizedUri, type: 'image' as const };
          }
        })
      );
      setSelectedMedia((prev) => [...prev, ...processedItems]);
      setLoading(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================================
  // 🎙 AUDIO
  // =========================================================================
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAudio = async () => {
    try {
      setIsRecordingAudio(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = recorder.uri;
      if (uri) {
        setAudioUri(uri);
        if (player) {
          player.replace({ uri });
        }
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  const toggleAudioPreview = async () => {
    if (!audioUri || !player) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playerStatus.playing) {
        player.pause();
      } else {
        player.seekTo(0);
        player.play();
      }
    } catch (err) {
      console.log('Erreur lecture audio:', err);
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) player.pause();
    setAudioUri(null);
  };

  // =========================================================================
  // 🚀 UPLOAD SUPABASE
  // =========================================================================
  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;

    if (type === 'video') {
      try {
        console.log('Compression de la vidéo en cours...');
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) {
        console.log('Erreur de compression vidéo', err);
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

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
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

  // =========================================================================
  // 🖥 RENDU PRINCIPAL
  // =========================================================================
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
     
      <Modal
        visible={isCameraActive}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraActive(false)}
      >
        <SafeAreaView style={styles.cameraContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={{ flex: 1 }} 
              facing={facing} 
              mode={cameraMode}
            />

            <View style={styles.cameraOverlay}>
              <View style={styles.cameraTopControls}>
                <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setCameraMode(prev => prev === 'picture' ? 'video' : 'picture')}
                  style={styles.modeToggleBtn}
                >
                  <Ionicons name={cameraMode === 'picture' ? "camera" : "videocam"} size={20} color="#FFF" />
                  <Text style={styles.modeToggleText}>
                    {cameraMode === 'picture' ? 'Mode Photo' : 'Mode Vidéo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cameraBottomControls}>
                <View style={{ width: 50 }} /> 
                <TouchableOpacity 
                  style={[styles.captureButton, isRecordingVideo && styles.recordingButton]}
                  onPress={cameraMode === 'picture' ? takePicture : toggleRecordVideo}
                />

                <TouchableOpacity 
                  onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} 
                  style={styles.iconButton}
                >
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      
      <Modal
        visible={editingImageIndex !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={closeImageEditor}
      >
        <SafeAreaView style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={closeImageEditor} style={styles.editorHeaderBtn}>
              <Ionicons name="close" size={28} color="#FFF" />
              <Text style={styles.editorHeaderBtnText}>Annuler</Text>
            </TouchableOpacity>

            <Text style={styles.editorTitle}>Recadrer</Text>

            <TouchableOpacity onPress={saveEditedImage} style={[styles.editorHeaderBtn, styles.editorSaveBtn]}>
              <Ionicons name="checkmark" size={24} color="#FFF" />
              <Text style={styles.editorHeaderBtnText}>OK</Text>
            </TouchableOpacity>
          </View>

          
          <View style={styles.editorPreviewContainer} {...panResponder.panHandlers}>
            <View style={styles.cropWindow}>
              {tempEditedUri && (
                <Animated.Image 
                  source={{ uri: tempEditedUri }} 
                  style={[
                    styles.editorPreviewImage,
                    {
                      transform: [
                        { translateX: panX },
                        { translateY: panY },
                        { scale: scale },
                      ],
                    }
                  ]} 
                  resizeMode="contain" 
                />
              )}
              
              <View style={styles.gridOverlay} pointerEvents="none">
                <View style={styles.gridLineHorizontal} />
                <View style={styles.gridLineHorizontal} />
                <View style={styles.gridLineVertical} />
                <View style={styles.gridLineVertical} />
              </View>
            </View>
          </View>

          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.editorToolbar}>
            <TouchableOpacity onPress={zoomIn} style={styles.toolBtn}>
              <Ionicons name="add-circle-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Zoom +</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={zoomOut} style={styles.toolBtn}>
              <Ionicons name="remove-circle-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Zoom -</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={resetZoom} style={styles.toolBtn}>
              <Ionicons name="refresh-circle-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Réinitialiser</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyRotate} style={styles.toolBtn}>
              <Ionicons name="refresh-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Pivoter</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipHorizontal} style={styles.toolBtn}>
              <Ionicons name="swap-horizontal-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Miroir</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipVertical} style={styles.toolBtn}>
              <Ionicons name="swap-vertical-outline" size={24} color="#FFF" />
              <Text style={styles.toolText}>Vertical</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecordingAudio ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} 
          disabled={loading}
        >
          <Ionicons name={isRecordingAudio ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecordingAudio ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                
                {item.type === 'video' ? (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={18} color="#FFF" />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.editBadge} 
                    onPress={() => openImageEditor(index)}
                  >
                    <Ionicons name="pencil" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

    
        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter le vocal"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio} style={styles.btnDeleteAudio}>
              <Ionicons name="trash" size={26} color="#FF3B30" />
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
            <Ionicons name="send" size={30} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 60 },
  previewContainer: { flexDirection: 'row', paddingVertical: 10 },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 110, borderRadius: 14 },
  videoBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnDeleteAudio: { padding: 6 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  
  // --- Styles Caméra Modal ---
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cameraTopControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    alignItems: 'center',
    paddingTop: 40 
  },
  cameraBottomControls: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 30, 
    alignItems: 'center', 
    paddingBottom: 50 
  },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  recordingButton: { backgroundColor: '#FF3B30' },
  modeToggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeToggleText: { color: '#FFF', fontWeight: 'bold' },

  // --- Styles Modal Éditeur de retouche (Grille WhatsApp) ---
  editorContainer: { flex: 1, backgroundColor: '#000' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 0.5, borderColor: '#38383A' },
  editorHeaderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editorHeaderBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  editorTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  editorSaveBtn: { backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editorPreviewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  
  cropWindow: {
    width: CROP_BOX_SIZE,
    height: CROP_BOX_SIZE,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  editorPreviewImage: { width: CROP_BOX_SIZE, height: CROP_BOX_SIZE },
  
  // Grille 3x3 style WhatsApp
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: '33.33%',
    paddingHorizontal: '33.33%',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  gridLineVertical: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33.33%',
  },

  editorToolbar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 10, borderTopWidth: 0.5, borderColor: '#38383A', backgroundColor: '#000', gap: 15 },
  toolBtn: { alignItems: 'center', gap: 4, minWidth: 70 },
  toolText: { color: '#FFF', fontSize: 11, fontWeight: '500', textAlign: 'center' },
});
*/

















/*
// AdminView.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
  PanResponder,
  Animated,
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

// --- Imports Caméra & Retouche ---
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Retouche Photo & Rogne ---
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [tempEditedUri, setTempEditedUri] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  
  // États de Zoom & Pan avec réactivité fluide
  const [scale, setScale] = useState<number>(1);
  const scaleRef = useRef<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const panX = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;

  // Calcul de la distance entre 2 doigts pour le Pinch-to-Zoom
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);

  const getTouchesDistance = (touches: any[]) => {
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length === 2) {
          initialPinchDist.current = getTouchesDistance(touches);
          initialScale.current = scaleRef.current;
        } else if (touches.length === 1) {
          panX.setOffset(panOffsetRef.current.x);
          panY.setOffset(panOffsetRef.current.y);
          panX.setValue(0);
          panY.setValue(0);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;
        
        // GESTE A 2 DOIGTS : ZOOM
        if (touches.length === 2) {
          if (initialPinchDist.current) {
            const currentDist = getTouchesDistance(touches);
            const factor = currentDist / initialPinchDist.current;
            const newScale = Math.min(Math.max(initialScale.current * factor, 1.0), 4.0);
            setScale(newScale);
            scaleRef.current = newScale;
          }
        } 
        // GESTE A 1 DOIGT : DEPLACEMENT (PAN)
        else if (touches.length === 1 && !initialPinchDist.current) {
          panX.setValue(gestureState.dx);
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        initialPinchDist.current = null;
        panX.flattenOffset();
        panY.flattenOffset();
        const newX = panOffsetRef.current.x + gestureState.dx;
        const newY = panOffsetRef.current.y + gestureState.dy;
        setPanOffset({ x: newX, y: newY });
        panOffsetRef.current = { x: newX, y: newY };
      },
    })
  ).current;

  // --- Caméra ---
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  // --- Audio ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : { uri: '' });
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (audioUri && player) {
      player.replace({ uri: audioUri });
    }
  }, [audioUri]);

  // Sync des Refs pour éviter les lags de fermeture de closure
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  // =========================================================================
  // RETOUCHE & CROP LOGIQUE
  // =========================================================================
  const optimizeImage = async (uri: string): Promise<string> => {
    try {
      const result = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], 
        { compress: 0.7, format: SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      return uri;
    }
  };

  const openImageEditor = (index: number) => {
    if (selectedMedia[index]?.type === 'image') {
      const uri = selectedMedia[index].uri;
      Image.getSize(uri, (width, height) => {
        setImgSize({ width, height });
        setEditingImageIndex(index);
        setTempEditedUri(uri);
        resetZoom();
      }, () => {
        Alert.alert("Erreur", "Impossible de charger l'image.");
      });
    }
  };

  const applyRotate = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ rotate: 90 }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
      setImgSize(prev => ({ width: prev.height, height: prev.width }));
      resetZoom();
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la rotation.');
    }
  };

  const applyFlipHorizontal = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ flip: FlipType.Horizontal }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
      resetZoom();
    } catch (err) {
      Alert.alert('Erreur', 'Échec du mode miroir.');
    }
  };

  const applyFlipVertical = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(
        tempEditedUri,
        [{ flip: FlipType.Vertical }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );
      setTempEditedUri(result.uri);
      resetZoom();
    } catch (err) {
      Alert.alert('Erreur', 'Échec du retournement.');
    }
  };

  const resetZoom = () => {
    setScale(1.0);
    scaleRef.current = 1.0;
    setPanOffset({ x: 0, y: 0 });
    panOffsetRef.current = { x: 0, y: 0 };
    panX.setValue(0);
    panY.setValue(0);
  };

  // Dimensions de la fenêtre de recadrage
  const MAX_CROP_W = SCREEN_WIDTH - 24;
  const MAX_CROP_H = SCREEN_HEIGHT * 0.65;
  const imgRatio = imgSize.width / imgSize.height;
  const maxRatio = MAX_CROP_W / MAX_CROP_H;
  
  let cropW = MAX_CROP_W;
  let cropH = MAX_CROP_H;
  
  if (imgRatio > maxRatio) {
    cropW = MAX_CROP_W;
    cropH = MAX_CROP_W / imgRatio;
  } else {
    cropH = MAX_CROP_H;
    cropW = MAX_CROP_H * imgRatio;
  }

  const saveEditedImage = async () => {
    if (!tempEditedUri || editingImageIndex === null) return;
    try {
      const renderScale = cropW / imgSize.width;
      const activeScale = renderScale * scale;

      const viewportW_orig = cropW / activeScale;
      const viewportH_orig = cropH / activeScale;

      const shiftX_orig = panOffset.x / activeScale;
      const shiftY_orig = panOffset.y / activeScale;

      const centerX = imgSize.width / 2;
      const centerY = imgSize.height / 2;

      let originX = centerX - (viewportW_orig / 2) - shiftX_orig;
      let originY = centerY - (viewportH_orig / 2) - shiftY_orig;

      originX = Math.max(0, Math.min(originX, imgSize.width - viewportW_orig));
      originY = Math.max(0, Math.min(originY, imgSize.height - viewportH_orig));

      const result = await manipulateAsync(
        tempEditedUri,
        [{ crop: { originX, originY, width: viewportW_orig, height: viewportH_orig } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      setSelectedMedia((prev) => {
        const updated = [...prev];
        updated[editingImageIndex] = { ...updated[editingImageIndex], uri: result.uri };
        return updated;
      });
      closeImageEditor();
    } catch (err) {
      Alert.alert('Erreur', 'Échec du rognage.');
      closeImageEditor();
    }
  };

  const closeImageEditor = () => {
    setEditingImageIndex(null);
    setTempEditedUri(null);
  };

  // =========================================================================
  // CAMÉRA, AUDIO, GALERIE & SUPABASE
  // =========================================================================
  const openCamera = async () => {
    let camPerm = cameraPermission;
    let micPerm = micPermission;

    if (!camPerm?.granted) camPerm = await requestCameraPermission();
    if (!micPerm?.granted) micPerm = await requestMicPermission();

    if (camPerm?.granted) {
      setIsCameraActive(true);
    } else {
      Alert.alert('Permission requise', 'Accès à la caméra refusé.');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
        if (photo) {
          setIsCameraActive(false);
          const optimizedUri = await optimizeImage(photo.uri);
          setSelectedMedia((prev) => [...prev, { uri: optimizedUri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const toggleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecordingVideo) {
        cameraRef.current.stopRecording();
        setIsRecordingVideo(false);
        setIsCameraActive(false);
      } else {
        setIsRecordingVideo(true);
        const video = await cameraRef.current.recordAsync();
        if (video) {
          setSelectedMedia((prev) => [...prev, { uri: video.uri, type: 'video' }]);
        }
      }
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setLoading(true);
      const processedItems = await Promise.all(
        result.assets.map(async (asset) => {
          if (asset.type === 'video') {
            return { uri: asset.uri, type: 'video' as const };
          } else {
            const optimizedUri = await optimizeImage(asset.uri);
            return { uri: optimizedUri, type: 'image' as const };
          }
        })
      );
      setSelectedMedia((prev) => [...prev, ...processedItems]);
      setLoading(false);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAudio = async () => {
    try {
      setIsRecordingAudio(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = recorder.uri;
      if (uri) {
        setAudioUri(uri);
        if (player) {
          player.replace({ uri });
        }
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  const toggleAudioPreview = async () => {
    if (!audioUri || !player) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playerStatus.playing) {
        player.pause();
      } else {
        player.seekTo(0);
        player.play();
      }
    } catch (err) {
      console.log('Erreur lecture audio:', err);
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) player.pause();
    setAudioUri(null);
  };

  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;

    if (type === 'video') {
      try {
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) {
        console.log('Erreur de compression vidéo', err);
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

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
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

  // =========================================================================
  // RENDU VISUEL
  // =========================================================================
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
     
      <Modal
        visible={isCameraActive}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraActive(false)}
      >
        <SafeAreaView style={styles.cameraContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={{ flex: 1 }} 
              facing={facing} 
              mode={cameraMode}
            />

            <View style={styles.cameraOverlay}>
              <View style={styles.cameraTopControls}>
                <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setCameraMode(prev => prev === 'picture' ? 'video' : 'picture')}
                  style={styles.modeToggleBtn}
                >
                  <Ionicons name={cameraMode === 'picture' ? "camera" : "videocam"} size={20} color="#FFF" />
                  <Text style={styles.modeToggleText}>
                    {cameraMode === 'picture' ? 'Mode Photo' : 'Mode Vidéo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cameraBottomControls}>
                <View style={{ width: 50 }} /> 
                <TouchableOpacity 
                  style={[styles.captureButton, isRecordingVideo && styles.recordingButton]}
                  onPress={cameraMode === 'picture' ? takePicture : toggleRecordVideo}
                />

                <TouchableOpacity 
                  onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} 
                  style={styles.iconButton}
                >
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

        visible={editingImageIndex !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={closeImageEditor}
      >
        <SafeAreaView style={styles.editorContainer}>
          
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={closeImageEditor} style={styles.editorHeaderBtn}>
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.editorTitle}>Recadrer</Text>

            <TouchableOpacity onPress={saveEditedImage} style={styles.editorSaveBtn}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.editorSaveBtnText}>Terminé</Text>
            </TouchableOpacity>
          </View>

       
          <View style={styles.editorPreviewContainer}>
            
          
            <View style={styles.zoomBadgeContainer}>
              <Text style={styles.zoomBadgeText}>{scale.toFixed(1)}x</Text>
            </View>

           
            <View 
              style={[styles.cropWindow, { width: cropW, height: cropH }]}
              {...panResponder.panHandlers}
            >
              {tempEditedUri && (
                <Animated.Image 
                  source={{ uri: tempEditedUri }} 
                  style={[
                    styles.editorPreviewImage,
                    {
                      transform: [
                        { translateX: panX },
                        { translateY: panY },
                        { scale: scale },
                      ],
                    }
                  ]} 
                  resizeMode="contain" 
                />
              )}
          
              <View style={styles.gridOverlay} pointerEvents="none">
                <View style={styles.gridLineHorizontal} />
                <View style={styles.gridLineHorizontal2} />
                <View style={styles.gridLineVertical} />
                <View style={styles.gridLineVertical2} />

                <View style={[styles.cropCorner, styles.cornerTL]} />
                <View style={[styles.cropCorner, styles.cornerTR]} />
                <View style={[styles.cropCorner, styles.cornerBL]} />
                <View style={[styles.cropCorner, styles.cornerBR]} />
              </View>
            </View>
            
            <Text style={styles.pinchHintText}>
              Pincez avec 2 doigts pour zoomer / dézoomer
            </Text>
          </View>

       
          <View style={styles.editorToolbar}>
            <TouchableOpacity onPress={resetZoom} style={styles.toolBtn}>
              <Ionicons name="scan-outline" size={22} color="#FFF" />
              <Text style={styles.toolText}>Réinitialiser</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyRotate} style={styles.toolBtn}>
              <Ionicons name="refresh-outline" size={22} color="#FFF" />
              <Text style={styles.toolText}>Pivoter</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipHorizontal} style={styles.toolBtn}>
              <Ionicons name="swap-horizontal-outline" size={22} color="#FFF" />
              <Text style={styles.toolText}>Miroir</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipVertical} style={styles.toolBtn}>
              <Ionicons name="swap-vertical-outline" size={22} color="#FFF" />
              <Text style={styles.toolText}>Vertical</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

     
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecordingAudio ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} 
          disabled={loading}
        >
          <Ionicons name={isRecordingAudio ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecordingAudio ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

 
      <View style={styles.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                
                {item.type === 'video' ? (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={18} color="#FFF" />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.editBadge} 
                    onPress={() => openImageEditor(index)}
                  >
                    <Ionicons name="pencil" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter le vocal"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio} style={styles.btnDeleteAudio}>
              <Ionicons name="trash" size={26} color="#FF3B30" />
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
            <Ionicons name="send" size={30} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 60 },
  previewContainer: { flexDirection: 'row', paddingVertical: 10 },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 110, borderRadius: 14 },
  videoBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnDeleteAudio: { padding: 6 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 10 },
  cameraTopControls: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', paddingTop: 40 },
  cameraBottomControls: { flexDirection: 'row', justifyContent: 'space-between', padding: 30, alignItems: 'center', paddingBottom: 50 },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  recordingButton: { backgroundColor: '#FF3B30' },
  modeToggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeToggleText: { color: '#FFF', fontWeight: 'bold' },

  // --- STYLES MODAL RETOUCHE / CROP ATTRACTIF ---
  editorContainer: { flex: 1, backgroundColor: '#0B0B0C' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  editorHeaderBtn: { padding: 4 },
  editorTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  editorSaveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 4 },
  editorSaveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  editorPreviewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', position: 'relative' },
  
  zoomBadgeContainer: {
    position: 'absolute',
    top: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 20,
  },
  zoomBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  pinchHintText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 12,
    fontWeight: '500',
  },

  cropWindow: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
  },
  editorPreviewImage: { width: '100%', height: '100%' },
  
  // Grille 3x3 WhatsApp
  gridOverlay: { ...StyleSheet.absoluteFillObject },
  gridLineHorizontal: { width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.35)', position: 'absolute', top: '33.33%' },
  gridLineHorizontal2: { width: '100%', height: 1, backgroundColor: 'rgba(255, 255, 255, 0.35)', position: 'absolute', top: '66.66%' },
  gridLineVertical: { height: '100%', width: 1, backgroundColor: 'rgba(255, 255, 255, 0.35)', position: 'absolute', left: '33.33%' },
  gridLineVertical2: { height: '100%', width: 1, backgroundColor: 'rgba(255, 255, 255, 0.35)', position: 'absolute', left: '66.66%' },

  // Coins L-Shape
  cropCorner: { position: 'absolute', width: 22, height: 22, borderColor: '#FFF' },
  cornerTL: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3 },

  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 18,
    borderTopWidth: 0.5,
    borderColor: '#2C2C2E',
    backgroundColor: '#0B0B0C',
  },
  toolBtn: { alignItems: 'center', gap: 6, minWidth: 70 },
  toolText: { color: '#8E8E93', fontSize: 11, fontWeight: '500' },
});
*/





















/*
// AdminView.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  Dimensions,
  PanResponder,
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

// --- Imports Caméra & Retouche ---
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Dimensions maximales du conteneur d'édition
const CONTAINER_W = SCREEN_WIDTH - 32;
const CONTAINER_H = SCREEN_HEIGHT * 0.58;
const MIN_CROP_SIZE = 50; // Taille minimale du cadre en pixels

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
}

interface AdminViewProps {
  isDark?: boolean;
}

interface CropRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export default function AdminView({ isDark = false }: AdminViewProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Retouche Photo & Rogne ---
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [tempEditedUri, setTempEditedUri] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({ width: 1, height: 1 });
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({ width: CONTAINER_W, height: CONTAINER_H });

  // Cadre de rognage interactif
  const [cropPos, setCropPos] = useState<CropRect>({ left: 0, top: 0, width: CONTAINER_W, height: CONTAINER_H });
  const cropPosRef = useRef<CropRect>(cropPos);
  const initialCropRef = useRef<CropRect>(cropPos);

  // Zoom tactile
  const [zoomScale, setZoomScale] = useState<number>(1);
  const initialPinchDist = useRef<number | null>(null);
  const initialScale = useRef<number>(1);

  // Synchronisation continue des références
  useEffect(() => {
    cropPosRef.current = cropPos;
  }, [cropPos]);

  // --- PAN RESPONDERS POUR LES 4 COINS INTERACTIFS & LE CENTRE ---

  // Top-Left Corner
  const panTL = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { initialCropRef.current = { ...cropPosRef.current }; },
    onPanResponderMove: (_, gestureState) => {
      const init = initialCropRef.current;
      const maxLeft = init.left + init.width - MIN_CROP_SIZE;
      const maxTop = init.top + init.height - MIN_CROP_SIZE;

      const newLeft = Math.max(0, Math.min(init.left + gestureState.dx, maxLeft));
      const newTop = Math.max(0, Math.min(init.top + gestureState.dy, maxTop));
      const newWidth = init.left + init.width - newLeft;
      const newHeight = init.top + init.height - newTop;

      setCropPos({ left: newLeft, top: newTop, width: newWidth, height: newHeight });
    },
  }), []);

  // Top-Right Corner
  const panTR = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { initialCropRef.current = { ...cropPosRef.current }; },
    onPanResponderMove: (_, gestureState) => {
      const init = initialCropRef.current;
      const maxTop = init.top + init.height - MIN_CROP_SIZE;

      const newTop = Math.max(0, Math.min(init.top + gestureState.dy, maxTop));
      const newHeight = init.top + init.height - newTop;
      const newWidth = Math.max(MIN_CROP_SIZE, Math.min(init.width + gestureState.dx, displaySize.width - init.left));

      setCropPos({ left: init.left, top: newTop, width: newWidth, height: newHeight });
    },
  }), [displaySize.width]);

  // Bottom-Left Corner
  const panBL = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { initialCropRef.current = { ...cropPosRef.current }; },
    onPanResponderMove: (_, gestureState) => {
      const init = initialCropRef.current;
      const maxLeft = init.left + init.width - MIN_CROP_SIZE;

      const newLeft = Math.max(0, Math.min(init.left + gestureState.dx, maxLeft));
      const newWidth = init.left + init.width - newLeft;
      const newHeight = Math.max(MIN_CROP_SIZE, Math.min(init.height + gestureState.dy, displaySize.height - init.top));

      setCropPos({ left: newLeft, top: init.top, width: newWidth, height: newHeight });
    },
  }), [displaySize.height]);

  // Bottom-Right Corner
  const panBR = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { initialCropRef.current = { ...cropPosRef.current }; },
    onPanResponderMove: (_, gestureState) => {
      const init = initialCropRef.current;
      const newWidth = Math.max(MIN_CROP_SIZE, Math.min(init.width + gestureState.dx, displaySize.width - init.left));
      const newHeight = Math.max(MIN_CROP_SIZE, Math.min(init.height + gestureState.dy, displaySize.height - init.top));

      setCropPos({ left: init.left, top: init.top, width: newWidth, height: newHeight });
    },
  }), [displaySize.width, displaySize.height]);

  // Centre (Déplacement global du cadre + Pinch-To-Zoom 2 doigts)
  const getTouchesDist = (touches: any[]) => {
    const [t1, t2] = touches;
    return Math.sqrt(Math.pow(t1.pageX - t2.pageX, 2) + Math.pow(t1.pageY - t2.pageY, 2));
  };

  const panCenter = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      initialCropRef.current = { ...cropPosRef.current };
      const touches = evt.nativeEvent.touches;
      if (touches.length === 2) {
        initialPinchDist.current = getTouchesDist(touches);
        initialScale.current = zoomScale;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches;
      
      // Zoom à 2 doigts
      if (touches.length === 2) {
        if (initialPinchDist.current) {
          const currentDist = getTouchesDist(touches);
          const factor = currentDist / initialPinchDist.current;
          const newScale = Math.min(Math.max(initialScale.current * factor, 1.0), 3.0);
          setZoomScale(newScale);
        }
      } 
      // Déplacement à 1 doigt
      else if (touches.length === 1) {
        const init = initialCropRef.current;
        const maxLeft = displaySize.width - init.width;
        const maxTop = displaySize.height - init.height;

        const newLeft = Math.max(0, Math.min(init.left + gestureState.dx, maxLeft));
        const newTop = Math.max(0, Math.min(init.top + gestureState.dy, maxTop));

        setCropPos({ ...init, left: newLeft, top: newTop });
      }
    },
    onPanResponderRelease: () => {
      initialPinchDist.current = null;
    }
  }), [displaySize, zoomScale]);

  // --- CAMÉRA & AUDIO ---
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : { uri: '' });
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (audioUri && player) {
      player.replace({ uri: audioUri });
    }
  }, [audioUri]);

  // =========================================================================
  // RETOUCHE & CROP LOGIQUE
  // =========================================================================
  const openImageEditor = (index: number) => {
    if (selectedMedia[index]?.type === 'image') {
      const uri = selectedMedia[index].uri;
      Image.getSize(uri, (w, h) => {
        setImgSize({ width: w, height: h });

        // Calcule le ratio idéal pour ajuster l'image au conteneur écran
        const imgRatio = w / h;
        const containerRatio = CONTAINER_W / CONTAINER_H;

        let dispW = CONTAINER_W;
        let dispH = CONTAINER_H;

        if (imgRatio > containerRatio) {
          dispW = CONTAINER_W;
          dispH = CONTAINER_W / imgRatio;
        } else {
          dispH = CONTAINER_H;
          dispW = CONTAINER_H * imgRatio;
        }

        setDisplaySize({ width: dispW, height: dispH });
        setCropPos({ left: 0, top: 0, width: dispW, height: dispH });
        setZoomScale(1.0);
        setEditingImageIndex(index);
        setTempEditedUri(uri);
      }, () => {
        Alert.alert("Erreur", "Impossible de charger l'image.");
      });
    }
  };

  const resetCrop = () => {
    setCropPos({ left: 0, top: 0, width: displaySize.width, height: displaySize.height });
    setZoomScale(1.0);
  };

  const applyRotate = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(tempEditedUri, [{ rotate: 90 }], { compress: 0.8, format: SaveFormat.JPEG });
      setTempEditedUri(result.uri);
      
      // Réinverser les dimensions
      Image.getSize(result.uri, (w, h) => {
        setImgSize({ width: w, height: h });
        const imgRatio = w / h;
        const containerRatio = CONTAINER_W / CONTAINER_H;
        let dispW = CONTAINER_W;
        let dispH = CONTAINER_H;
        if (imgRatio > containerRatio) {
          dispW = CONTAINER_W;
          dispH = CONTAINER_W / imgRatio;
        } else {
          dispH = CONTAINER_H;
          dispW = CONTAINER_H * imgRatio;
        }
        setDisplaySize({ width: dispW, height: dispH });
        setCropPos({ left: 0, top: 0, width: dispW, height: dispH });
      });
    } catch (err) {
      Alert.alert('Erreur', 'Échec de la rotation.');
    }
  };

  const applyFlipHorizontal = async () => {
    if (!tempEditedUri) return;
    try {
      const result = await manipulateAsync(tempEditedUri, [{ flip: FlipType.Horizontal }], { compress: 0.8, format: SaveFormat.JPEG });
      setTempEditedUri(result.uri);
    } catch (err) {
      Alert.alert('Erreur', 'Échec du mode miroir.');
    }
  };

  const saveEditedImage = async () => {
    if (!tempEditedUri || editingImageIndex === null) return;
    try {
      // Projection exacte des coordonnées de l'écran vers l'image d'origine
      const scaleX = imgSize.width / displaySize.width;
      const scaleY = imgSize.height / displaySize.height;

      const originX = Math.round(cropPos.left * scaleX);
      const originY = Math.round(cropPos.top * scaleY);
      const width = Math.round(cropPos.width * scaleX);
      const height = Math.round(cropPos.height * scaleY);

      // Sécurité des limites de l'image
      const safeOriginX = Math.max(0, Math.min(originX, imgSize.width - 1));
      const safeOriginY = Math.max(0, Math.min(originY, imgSize.height - 1));
      const safeWidth = Math.min(width, imgSize.width - safeOriginX);
      const safeHeight = Math.min(height, imgSize.height - safeOriginY);

      const result = await manipulateAsync(
        tempEditedUri,
        [{ crop: { originX: safeOriginX, originY: safeOriginY, width: safeWidth, height: safeHeight } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      setSelectedMedia((prev) => {
        const updated = [...prev];
        updated[editingImageIndex] = { ...updated[editingImageIndex], uri: result.uri };
        return updated;
      });
      closeImageEditor();
    } catch (err) {
      Alert.alert('Erreur', 'Échec du rognage de l\'image.');
      closeImageEditor();
    }
  };

  const closeImageEditor = () => {
    setEditingImageIndex(null);
    setTempEditedUri(null);
  };

  // =========================================================================
  // ACTIONS DE GALERIE & SUPABASE
  // =========================================================================
  const openCamera = async () => {
    let camPerm = cameraPermission;
    let micPerm = micPermission;
    if (!camPerm?.granted) camPerm = await requestCameraPermission();
    if (!micPerm?.granted) micPerm = await requestMicPermission();

    if (camPerm?.granted) {
      setIsCameraActive(true);
    } else {
      Alert.alert('Permission requise', 'Accès à la caméra refusé.');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
        if (photo) {
          setIsCameraActive(false);
          setSelectedMedia((prev) => [...prev, { uri: photo.uri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  const toggleRecordVideo = async () => {
    if (cameraRef.current) {
      if (isRecordingVideo) {
        cameraRef.current.stopRecording();
        setIsRecordingVideo(false);
        setIsCameraActive(false);
      } else {
        setIsRecordingVideo(true);
        const video = await cameraRef.current.recordAsync();
        if (video) {
          setSelectedMedia((prev) => [...prev, { uri: video.uri, type: 'video' }]);
        }
      }
    }
  };

  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      const items = result.assets.map(asset => ({
        uri: asset.uri,
        type: (asset.type === 'video' ? 'video' : 'image') as 'image' | 'video'
      }));
      setSelectedMedia((prev) => [...prev, ...items]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        setAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  const startRecordingAudio = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      await recorder.record();
      setIsRecordingAudio(true);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecordingAudio = async () => {
    try {
      setIsRecordingAudio(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (recorder.uri) {
        setAudioUri(recorder.uri);
        if (player) player.replace({ uri: recorder.uri });
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  const toggleAudioPreview = async () => {
    if (!audioUri || !player) return;
    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (playerStatus.playing) {
        player.pause();
      } else {
        player.seekTo(0);
        player.play();
      }
    } catch (err) {
      console.log('Erreur lecture audio:', err);
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) player.pause();
    setAudioUri(null);
  };

  const uploadFileToSupabase = async (uri: string, type: 'image' | 'video' | 'audio'): Promise<string> => {
    let fileUri = uri;
    if (type === 'video') {
      try {
        fileUri = await VideoCompressor.compress(uri, { compressionMethod: 'auto' });
      } catch (err) {
        console.log('Erreur compression vidéo', err);
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

      const uploadedMediaUrls = await Promise.all(
        selectedMedia.map(item => uploadFileToSupabase(item.uri, item.type))
      );
      
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

  // =========================================================================
  // RENDU VISUEL
  // =========================================================================
  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
     
      <Modal
        visible={isCameraActive}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraActive(false)}
      >
        <SafeAreaView style={styles.cameraContainer}>
          <View style={styles.cameraWrapper}>
            <CameraView 
              ref={cameraRef}
              style={{ flex: 1 }} 
              facing={facing} 
              mode={cameraMode}
            />

            <View style={styles.cameraOverlay}>
              <View style={styles.cameraTopControls}>
                <TouchableOpacity onPress={() => setIsCameraActive(false)} style={styles.iconButton}>
                  <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={() => setCameraMode(prev => prev === 'picture' ? 'video' : 'picture')}
                  style={styles.modeToggleBtn}
                >
                  <Ionicons name={cameraMode === 'picture' ? "camera" : "videocam"} size={20} color="#FFF" />
                  <Text style={styles.modeToggleText}>
                    {cameraMode === 'picture' ? 'Mode Photo' : 'Mode Vidéo'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.cameraBottomControls}>
                <View style={{ width: 50 }} /> 
                <TouchableOpacity 
                  style={[styles.captureButton, isRecordingVideo && styles.recordingButton]}
                  onPress={cameraMode === 'picture' ? takePicture : toggleRecordVideo}
                />

                <TouchableOpacity 
                  onPress={() => setFacing(prev => prev === 'back' ? 'front' : 'back')} 
                  style={styles.iconButton}
                >
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      
      <Modal
        visible={editingImageIndex !== null}
        animationType="fade"
        transparent={false}
        onRequestClose={closeImageEditor}
      >
        <SafeAreaView style={styles.editorContainer}>
        
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={closeImageEditor} style={styles.editorHeaderBtn}>
              <Ionicons name="close" size={26} color="#FFF" />
            </TouchableOpacity>

            <Text style={styles.editorTitle}>Recadrer la photo</Text>

            <TouchableOpacity onPress={saveEditedImage} style={styles.editorSaveBtn}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.editorSaveBtnText}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          
          <View style={styles.editorPreviewContainer}>
            <View style={styles.zoomBadgeContainer}>
              <Text style={styles.zoomBadgeText}>{zoomScale.toFixed(1)}x</Text>
            </View>
            <View style={[styles.imageDisplayBox, { width: displaySize.width, height: displaySize.height }]}>
              {tempEditedUri && (
                <Image 
                  source={{ uri: tempEditedUri }} 
                  style={[
                    styles.editorImage, 
                    { transform: [{ scale: zoomScale }] }
                  ]} 
                  resizeMode="contain" 
                />
              )}

              <View style={[styles.maskOverlay, { top: 0, left: 0, right: 0, height: cropPos.top }]} />
              <View style={[styles.maskOverlay, { top: cropPos.top + cropPos.height, left: 0, right: 0, bottom: 0 }]} />
              <View style={[styles.maskOverlay, { top: cropPos.top, left: 0, width: cropPos.left, height: cropPos.height }]} />
              <View style={[styles.maskOverlay, { top: cropPos.top, left: cropPos.left + cropPos.width, right: 0, height: cropPos.height }]} />

        
              <View 
                style={[
                  styles.cropBoxInteractive,
                  {
                    left: cropPos.left,
                    top: cropPos.top,
                    width: cropPos.width,
                    height: cropPos.height,
                  }
                ]}
              >
             
                <View style={styles.cropCenterZone} {...panCenter.panHandlers}>
              
                  <View style={styles.gridLineH1} />
                  <View style={styles.gridLineH2} />
                  <View style={styles.gridLineV1} />
                  <View style={styles.gridLineV2} />
                </View>
                <View style={[styles.touchCorner, styles.touchTL]} {...panTL.panHandlers}>
                  <View style={[styles.cornerShape, styles.shapeTL]} />
                </View
                <View style={[styles.touchCorner, styles.touchTR]} {...panTR.panHandlers}>
                  <View style={[styles.cornerShape, styles.shapeTR]} />
                </View>

                <View style={[styles.touchCorner, styles.touchBL]} {...panBL.panHandlers}>
                  <View style={[styles.cornerShape, styles.shapeBL]} />
                </View>

              
                <View style={[styles.touchCorner, styles.touchBR]} {...panBR.panHandlers}>
                  <View style={[styles.cornerShape, styles.shapeBR]} />
                </View>

              </View>
            </View>

            <Text style={styles.pinchHintText}>
              • Déplacez les 4 coins pour rogner{'\n'}• Glissez le centre pour déplacer | Pincez à 2 doigts pour zoomer
            </Text>
          </View>

        
          <View style={styles.editorToolbar}>
            <TouchableOpacity onPress={resetCrop} style={styles.toolBtn}>
              <Ionicons name="scan-outline" size={22} color="#FFF" />
              <Text style={styles.toolText}>Réinitialiser</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyRotate} style={styles.toolBtn}>
              <Ionicons name="refresh-outline" size={22} color="#FFF" />
              <Text style={styles.toolText}>Pivoter</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={applyFlipHorizontal} style={styles.toolBtn}>
              <Ionicons name="swap-horizontal-outline" size={22} color="#FFF" />
              <Text style={styles.toolText}>Miroir</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Filmer / Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecordingAudio ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecordingAudio ? stopRecordingAudio : startRecordingAudio} 
          disabled={loading}
        >
          <Ionicons name={isRecordingAudio ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecordingAudio ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                
                {item.type === 'video' ? (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={18} color="#FFF" />
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.editBadge} 
                    onPress={() => openImageEditor(index)}
                  >
                    <Ionicons name="pencil" size={16} color="#FFF" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter le vocal"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio} style={styles.btnDeleteAudio}>
              <Ionicons name="trash" size={26} color="#FF3B30" />
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
            <Ionicons name="send" size={30} color="#FFF" />
            <Text style={styles.btnSendHugeText}>ENVOYER</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 60 },
  previewContainer: { flexDirection: 'row', paddingVertical: 10 },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 110, borderRadius: 14 },
  videoBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnDeleteAudio: { padding: 6 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#34C759', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
  
  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraWrapper: { flex: 1, position: 'relative' },
  cameraOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 10 },
  cameraTopControls: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center', paddingTop: 40 },
  cameraBottomControls: { flexDirection: 'row', justifyContent: 'space-between', padding: 30, alignItems: 'center', paddingBottom: 50 },
  iconButton: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  captureButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  recordingButton: { backgroundColor: '#FF3B30' },
  modeToggleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeToggleText: { color: '#FFF', fontWeight: 'bold' },

  // --- STYLES MODAL CROP & RETOUCHE PRO ---
  editorContainer: { flex: 1, backgroundColor: '#0B0B0C' },
  editorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  editorHeaderBtn: { padding: 4 },
  editorTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  editorSaveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 4 },
  editorSaveBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  
  editorPreviewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000', position: 'relative' },
  
  zoomBadgeContainer: {
    position: 'absolute',
    top: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 30,
  },
  zoomBadgeText: { color: '#FFF', fontSize: 13, fontWeight: '600' },

  imageDisplayBox: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorImage: { width: '100%', height: '100%' },

  maskOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    zIndex: 10,
  },

  // CADRE INTERACTIF
  cropBoxInteractive: {
    position: 'absolute',
    borderColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    zIndex: 20,
  },
  cropCenterZone: {
    flex: 1,
    position: 'relative',
  },

  // Lignes de grille
  gridLineH1: { position: 'absolute', top: '33.33%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  gridLineH2: { position: 'absolute', top: '66.66%', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  gridLineV1: { position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  gridLineV2: { position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },

  // ZONES TACTILES DES 4 COINS (Agrandies pour un toucher facile)
  touchCorner: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  touchTL: { top: -22, left: -22 },
  touchTR: { top: -22, right: -22 },
  touchBL: { bottom: -22, left: -22 },
  touchBR: { bottom: -22, right: -22 },

  // FORME L-SHAPE DE CHAQUE COIN
  cornerShape: {
    width: 22,
    height: 22,
    borderColor: '#FFF',
  },
  shapeTL: { borderTopWidth: 3, borderLeftWidth: 3 },
  shapeTR: { borderTopWidth: 3, borderRightWidth: 3 },
  shapeBL: { borderBottomWidth: 3, borderLeftWidth: 3 },
  shapeBR: { borderBottomWidth: 3, borderRightWidth: 3 },

  pinchHintText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    marginTop: 14,
    textAlign: 'center',
    lineHeight: 18,
  },

  editorToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderColor: '#2C2C2E',
    backgroundColor: '#0B0B0C',
  },
  toolBtn: { alignItems: 'center', gap: 6, minWidth: 70 },
  toolText: { color: '#8E8E93', fontSize: 12, fontWeight: '500' },
});
*/














/*
// AdminView.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert,
  Image, ScrollView, SafeAreaView, Modal, Dimensions, PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Video as VideoCompressor } from 'react-native-compressor';
import { supabase } from '../lib/supabase';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SW, height: SH } = Dimensions.get('window');
const CW = SW - 32, CH = SH * 0.58, MIN = 60, TOUCH = 56;
type Rect = { left: number; top: number; width: number; height: number };
type Media = { uri: string; type: 'image' | 'video' };

export default function AdminView({ isDark = false }: { isDark?: boolean }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── CROP STATE ───
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editUri, setEditUri] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });
  const [dispSize, setDispSize] = useState({ width: CW, height: CH });
  const [crop, setCrop] = useState<Rect>({ left: 0, top: 0, width: CW, height: CH });
  const cropRef = useRef(crop), initRef = useRef(crop);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1), pinchDist = useRef<number | null>(null), initScale = useRef(1);

  useEffect(() => { cropRef.current = crop; }, [crop]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // ─── CAMERA STATE ───
  const [camOn, setCamOn] = useState(false);
  const [camMode, setCamMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [vidRec, setVidRec] = useState(false);
  const camRef = useRef<CameraView>(null);
  const [camPerm, reqCam] = useCameraPermissions();
  const [micPerm, reqMic] = useMicrophonePermissions();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : { uri: '' });
  const pStatus = useAudioPlayerStatus(player);
  useEffect(() => { if (audioUri && player) player.replace({ uri: audioUri }); }, [audioUri]);

  // ─── PAN RESPONDER FACTORY ───
  // Chaque coin bouge 1 ou 2 bords. On factorise pour éviter 100 lignes dupliquées.
  const makeCornerPan = (corner: 'TL' | 'TR' | 'BL' | 'BR') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { initRef.current = { ...cropRef.current }; },
      onPanResponderMove: (_, g) => {
        const i = initRef.current;
        let { left, top, width, height } = i;
        if (corner === 'TL' || corner === 'BL') {
          left = Math.max(0, Math.min(i.left + g.dx, i.left + i.width - MIN));
          width = i.left + i.width - left;
        } else {
          width = Math.max(MIN, Math.min(i.width + g.dx, dispSize.width - i.left));
        }
        if (corner === 'TL' || corner === 'TR') {
          top = Math.max(0, Math.min(i.top + g.dy, i.top + i.height - MIN));
          height = i.top + i.height - top;
        } else {
          height = Math.max(MIN, Math.min(i.height + g.dy, dispSize.height - i.top));
        }
        setCrop({ left, top, width, height });
      },
    });

  const panTL = useMemo(() => makeCornerPan('TL'), [dispSize]);
  const panTR = useMemo(() => makeCornerPan('TR'), [dispSize]);
  const panBL = useMemo(() => makeCornerPan('BL'), [dispSize]);
  const panBR = useMemo(() => makeCornerPan('BR'), [dispSize]);

  // Centre : drag (1 doigt) + pinch (2 doigts)
  const panCenter = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (e) => (e.nativeEvent.touches?.length ?? 0) <= 2,
    onPanResponderGrant: (e) => {
      initRef.current = { ...cropRef.current };
      const t = e.nativeEvent.touches || [];
      if (t.length === 2) {
        pinchDist.current = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        initScale.current = zoomRef.current;
      }
    },
    onPanResponderMove: (e, g) => {
      const t = e.nativeEvent.touches || [];
      if (t.length === 2 && pinchDist.current) {
        const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        setZoom(Math.min(3, Math.max(1, initScale.current * (d / pinchDist.current))));
        return;
      }
      if (t.length === 1) {
        const i = initRef.current;
        setCrop({
          ...i,
          left: Math.max(0, Math.min(i.left + g.dx, dispSize.width - i.width)),
          top: Math.max(0, Math.min(i.top + g.dy, dispSize.height - i.height)),
        });
      }
    },
    onPanResponderRelease: () => { pinchDist.current = null; },
    onPanResponderTerminate: () => { pinchDist.current = null; },
  }), [dispSize]);

  // ─── CROP ACTIONS ───
  const openEditor = (idx: number) => {
    if (media[idx]?.type !== 'image') return;
    const uri = media[idx].uri;
    Image.getSize(uri, (w, h) => {
      setImgSize({ width: w, height: h });
      const r = w / h, cr = CW / CH;
      const dW = r > cr ? CW : CH * r, dH = r > cr ? CW / r : CH;
      setDispSize({ width: dW, height: dH });
      setCrop({ left: 0, top: 0, width: dW, height: dH });
      setZoom(1); zoomRef.current = 1;
      setEditIdx(idx); setEditUri(uri);
    }, () => Alert.alert('Erreur', "Impossible de charger l'image."));
  };

  const resetCrop = () => {
    setCrop({ left: 0, top: 0, width: dispSize.width, height: dispSize.height });
    setZoom(1); zoomRef.current = 1;
  };

  const rotate = async () => {
    if (!editUri) return;
    const r = await manipulateAsync(editUri, [{ rotate: 90 }], { compress: 0.8, format: SaveFormat.JPEG });
    setEditUri(r.uri);
    Image.getSize(r.uri, (w, h) => {
      setImgSize({ width: w, height: h });
      const ratio = w / h, cr = CW / CH;
      const dW = ratio > cr ? CW : CH * ratio, dH = ratio > cr ? CW / ratio : CH;
      setDispSize({ width: dW, height: dH });
      setCrop({ left: 0, top: 0, width: dW, height: dH });
      setZoom(1); zoomRef.current = 1;
    });
  };

  const flip = async () => {
    if (!editUri) return;
    const r = await manipulateAsync(editUri, [{ flip: FlipType.Horizontal }], { compress: 0.8, format: SaveFormat.JPEG });
    setEditUri(r.uri);
  };

  const applyCrop = async () => {
    if (!editUri || editIdx === null) return;
    try {
      const { width: cw, height: ch } = dispSize, s = zoom, cx = cw / 2, cy = ch / 2;
      // Projection inverse : crop screen → coords image non-zoomée → pixels originaux
      const ux1 = cx + (crop.left - cx) / s, uy1 = cy + (crop.top - cy) / s;
      const ux2 = cx + (crop.left + crop.width - cx) / s, uy2 = cy + (crop.top + crop.height - cy) / s;
      const sx = imgSize.width / cw, sy = imgSize.height / ch;
      const originX = Math.max(0, Math.round(ux1 * sx));
      const originY = Math.max(0, Math.round(uy1 * sy));
      const w = Math.min(imgSize.width - originX, Math.round((ux2 - ux1) * sx));
      const h = Math.min(imgSize.height - originY, Math.round((uy2 - uy1) * sy));
      if (w <= 1 || h <= 1) return Alert.alert('Erreur', 'Zone invalide.');
      const r = await manipulateAsync(editUri, [{ crop: { originX, originY, width: w, height: h } }], { compress: 0.8, format: SaveFormat.JPEG });
      setMedia(p => { const u = [...p]; u[editIdx] = { ...u[editIdx], uri: r.uri }; return u; });
      closeEditor();
    } catch { Alert.alert('Erreur', "Échec du rognage."); closeEditor(); }
  };

  const closeEditor = () => { setEditIdx(null); setEditUri(null); };

  // ─── CAMERA ───
  const openCamera = async () => {
    let cp = camPerm, mp = micPerm;
    if (!cp?.granted) cp = await reqCam();
    if (!mp?.granted) mp = await reqMic();
    if (cp?.granted) setCamOn(true);
    else Alert.alert('Permission', 'Caméra refusée.');
  };

  const shoot = async () => {
    if (!camRef.current) return;
    try {
      const p = await camRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (p) { setCamOn(false); setMedia(x => [...x, { uri: p.uri, type: 'image' }]); }
    } catch { Alert.alert('Erreur', 'Photo impossible.'); }
  };

  const toggleVid = async () => {
    if (!camRef.current) return;
    if (vidRec) { camRef.current.stopRecording(); setVidRec(false); setCamOn(false); }
    else {
      setVidRec(true);
      const v = await camRef.current.recordAsync();
      if (v) setMedia(x => [...x, { uri: v.uri, type: 'video' }]);
    }
  };

  // ─── GALERIE / AUDIO ───
  const pickMedia = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) return Alert.alert('Permission', 'Galerie refusée.');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, quality: 1 });
    if (!r.canceled) {
      const items = r.assets.map(a => ({ uri: a.uri, type: (a.type === 'video' ? 'video' : 'image') as 'image' | 'video' }));
      setMedia(x => [...x, ...items]);
    }
  };

  const removeMedia = (i: number) => setMedia(p => p.filter((_, k) => k !== i));

  const pickAudio = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!r.canceled) {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setAudioUri(r.assets[0].uri);
    }
  };

  const startRec = async () => {
    const p = await AudioModule.requestRecordingPermissionsAsync();
    if (!p.granted) return Alert.alert('Permission', 'Micro refusé.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    await recorder.record();
    setRecording(true);
  };

  const stopRec = async () => {
    setRecording(false);
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (recorder.uri) { setAudioUri(recorder.uri); player?.replace({ uri: recorder.uri }); }
  };

  const togglePlay = async () => {
    if (!audioUri || !player) return;
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (pStatus.playing) player.pause();
    else { player.seekTo(0); player.play(); }
  };

  const delAudio = () => { if (player && pStatus.playing) player.pause(); setAudioUri(null); };

  // ─── UPLOAD ───
  const upload = async (uri: string, type: 'image' | 'video' | 'audio') => {
    let u = uri;
    if (type === 'video') { try { u = await VideoCompressor.compress(uri, { compressionMethod: 'auto' }); } catch {} }
    const b64 = await FileSystem.readAsStringAsync(u, { encoding: FileSystem.EncodingType.Base64 });
    const buf = decode(b64);
    const ext = u.split('.').pop()?.split('?')[0] || (type === 'video' ? 'mp4' : 'bin');
    const mime = type === 'video' ? 'video/mp4' : type === 'image' ? 'image/jpeg' : 'audio/m4a';
    const folder = type === 'audio' ? 'audios' : 'medias';
    const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(7)}.${ext}`;
    const { error } = await supabase.storage.from('ganbanaaxu-media').upload(name, buf, { contentType: mime, upsert: false });
    if (error) throw new Error(`Storage: ${error.message}`);
    return supabase.storage.from('ganbanaaxu-media').getPublicUrl(name).data.publicUrl;
  };

  const publish = async () => {
    if (!media.length && !audioUri) return Alert.alert('Rien à envoyer', 'Ajoutez un média.');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Connectez-vous.');
      const urls = await Promise.all(media.map(m => upload(m.uri, m.type)));
      const audioUrl = audioUri ? await upload(audioUri, 'audio') : null;
      const { error } = await supabase.from('posts').insert([{ user_id: user.id, media_urls: urls, audio_url: audioUrl }]);
      if (error) throw error;
      Alert.alert('Succès !', 'Publication envoyée.');
      setMedia([]); delAudio();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  };

  // ─── RENDER ───
  const cornerStyle = (c: 'TL' | 'TR' | 'BL' | 'BR') => {
    const base = { position: 'absolute', width: TOUCH, height: TOUCH, justifyContent: 'center', alignItems: 'center', zIndex: 25 } as const;
    const pos = {
      TL: { top: -TOUCH / 2, left: -TOUCH / 2 },
      TR: { top: -TOUCH / 2, right: -TOUCH / 2 },
      BL: { bottom: -TOUCH / 2, left: -TOUCH / 2 },
      BR: { bottom: -TOUCH / 2, right: -TOUCH / 2 },
    }[c];
    return [base, pos];
  };
  const shapeStyle = (c: 'TL' | 'TR' | 'BL' | 'BR') => ({
    width: 24, height: 24, borderColor: '#FFF',
    ...(c === 'TL' ? { borderTopWidth: 3, borderLeftWidth: 3 } : {}),
    ...(c === 'TR' ? { borderTopWidth: 3, borderRightWidth: 3 } : {}),
    ...(c === 'BL' ? { borderBottomWidth: 3, borderLeftWidth: 3 } : {}),
    ...(c === 'BR' ? { borderBottomWidth: 3, borderRightWidth: 3 } : {}),
  });

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
  
      <Modal visible={camOn} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCamOn(false)}>
        <SafeAreaView style={s.camContainer}>
          <View style={{ flex: 1 }}>
            <CameraView ref={camRef} style={{ flex: 1 }} facing={facing} mode={camMode} />
            <View style={s.camOverlay}>
              <View style={s.camTop}>
                <TouchableOpacity onPress={() => setCamOn(false)} style={s.iconBtn}><Ionicons name="close" size={32} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setCamMode(p => p === 'picture' ? 'video' : 'picture')} style={s.modeBtn}>
                  <Ionicons name={camMode === 'picture' ? 'camera' : 'videocam'} size={20} color="#FFF" />
                  <Text style={s.modeTxt}>{camMode === 'picture' ? 'Photo' : 'Vidéo'}</Text>
                </TouchableOpacity>
              </View>
              <View style={s.camBottom}>
                <View style={{ width: 50 }} />
                <TouchableOpacity style={[s.shutter, vidRec && { backgroundColor: '#FF3B30' }]} onPress={camMode === 'picture' ? shoot : toggleVid} />
                <TouchableOpacity onPress={() => setFacing(p => p === 'back' ? 'front' : 'back')} style={s.iconBtn}>
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

    
      <Modal visible={editIdx !== null} animationType="fade" onRequestClose={closeEditor}>
        <SafeAreaView style={s.editor}>
          <View style={s.editorHead}>
            <TouchableOpacity onPress={closeEditor}><Ionicons name="close" size={26} color="#FFF" /></TouchableOpacity>
            <Text style={s.editorTitle}>Recadrer</Text>
            <TouchableOpacity onPress={applyCrop} style={s.saveBtn}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={s.saveTxt}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          <View style={s.previewZone}>
            <View style={s.zoomBadge}><Text style={s.zoomTxt}>{zoom.toFixed(1)}x</Text></View>

         
            <View style={[s.imgBox, { width: dispSize.width, height: dispSize.height }]}>
          
              <View style={s.clipLayer}>
                {editUri && <Image source={{ uri: editUri }} style={[s.editorImg, { transform: [{ scale: zoom }] }]} resizeMode="contain" />}
                <View style={[s.mask, { top: 0, left: 0, right: 0, height: crop.top }]} pointerEvents="none" />
                <View style={[s.mask, { top: crop.top + crop.height, left: 0, right: 0, bottom: 0 }]} pointerEvents="none" />
                <View style={[s.mask, { top: crop.top, left: 0, width: crop.left, height: crop.height }]} pointerEvents="none" />
                <View style={[s.mask, { top: crop.top, left: crop.left + crop.width, right: 0, height: crop.height }]} pointerEvents="none" />
              </View>

              
              <View style={[s.cropBox, { left: crop.left, top: crop.top, width: crop.width, height: crop.height }]} pointerEvents="box-none">
                <View style={{ flex: 1 }} {...panCenter.panHandlers}>
                  <View style={[s.gridH, { top: '33.33%' }]} pointerEvents="none" />
                  <View style={[s.gridH, { top: '66.66%' }]} pointerEvents="none" />
                  <View style={[s.gridV, { left: '33.33%' }]} pointerEvents="none" />
                  <View style={[s.gridV, { left: '66.66%' }]} pointerEvents="none" />
                </View>
                {(['TL', 'TR', 'BL', 'BR'] as const).map(c => (
                  <View key={c} style={cornerStyle(c)} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }} {...({ TL: panTL, TR: panTR, BL: panBL, BR: panBR }[c]).panHandlers}>
                    <View style={shapeStyle(c)} pointerEvents="none" />
                  </View>
                ))}
              </View>
            </View>

            <Text style={s.hint}>• Coins pour rogner{'\n'}• Centre pour déplacer | 2 doigts pour zoomer</Text>
          </View>

          <View style={s.toolbar}>
            {[
              { icon: 'scan-outline', label: 'Reset', fn: resetCrop },
              { icon: 'refresh-outline', label: 'Pivoter', fn: rotate },
              { icon: 'swap-horizontal-outline', label: 'Miroir', fn: flip },
            ].map(t => (
              <TouchableOpacity key={t.label} onPress={t.fn} style={s.tool}>
                <Ionicons name={t.icon as any} size={22} color="#FFF" />
                <Text style={s.toolTxt}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

     
      <View style={s.grid}>
        {[
          { bg: '#FF9500', icon: 'camera', label: 'Filmer / Photo', fn: openCamera },
          { bg: '#007AFF', icon: 'images', label: 'Galerie', fn: pickMedia },
          { bg: recording ? '#000' : '#FF3B30', icon: recording ? 'stop-circle' : 'mic', label: recording ? 'Arrêter' : 'Parler', fn: recording ? stopRec : startRec },
          { bg: '#AF52DE', icon: 'musical-notes', label: 'Audio', fn: pickAudio },
        ].map((b, i) => (
          <TouchableOpacity key={i} style={[s.bigBtn, { backgroundColor: b.bg }]} onPress={b.fn} disabled={loading}>
            <Ionicons name={b.icon as any} size={40} color="#FFF" />
            <Text style={s.bigTxt}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

     
      <View style={s.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        {media.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 10 }}>
            {media.map((m, i) => (
              <View key={i} style={s.thumbWrap}>
                <Image source={{ uri: m.uri }} style={s.thumb} />
                {m.type === 'video'
                  ? <View style={s.vidBadge}><Ionicons name="videocam" size={18} color="#FFF" /></View>
                  : <TouchableOpacity style={s.editBadge} onPress={() => openEditor(i)}><Ionicons name="pencil" size={16} color="#FFF" /></TouchableOpacity>}
                <TouchableOpacity style={s.rmBadge} onPress={() => removeMedia(i)}><Ionicons name="close-circle" size={26} color="#FF3B30" /></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        {audioUri && (
          <View style={s.audioRow}>
            <TouchableOpacity style={s.playBtn} onPress={togglePlay}>
              <Ionicons name={pStatus.playing ? 'pause' : 'play'} size={28} color="#FFF" />
              <Text style={s.playTxt}>{pStatus.playing ? 'Pause' : 'Écouter'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={delAudio}><Ionicons name="trash" size={26} color="#FF3B30" /></TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={[s.sendBtn, loading && { opacity: 0.5 }]} onPress={publish} disabled={loading}>
        {loading ? <ActivityIndicator size="large" color="#fff" /> : (
          <><Ionicons name="send" size={30} color="#FFF" /><Text style={s.sendTxt}>ENVOYER</Text></>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigBtn: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  previewSection: { marginBottom: 20, minHeight: 60 },
  thumbWrap: { marginRight: 15, position: 'relative' },
  thumb: { width: 110, height: 110, borderRadius: 14 },
  vidBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  rmBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },
  audioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  playTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  sendBtn: { flexDirection: 'row', backgroundColor: '#34C759', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  sendTxt: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },

  // Camera
  camContainer: { flex: 1, backgroundColor: '#000' },
  camOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 10 },
  camTop: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 40, alignItems: 'center' },
  camBottom: { flexDirection: 'row', justifyContent: 'space-between', padding: 30, paddingBottom: 50, alignItems: 'center' },
  iconBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  shutter: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  modeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeTxt: { color: '#FFF', fontWeight: 'bold' },

  // Editor
  editor: { flex: 1, backgroundColor: '#0B0B0C' },
  editorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  editorTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 4 },
  saveTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  previewZone: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  zoomBadge: { position: 'absolute', top: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', zIndex: 30 },
  zoomTxt: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  imgBox: { position: 'relative', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  clipLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  editorImg: { width: '100%', height: '100%' },
  mask: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10 },
  cropBox: { position: 'absolute', borderColor: 'rgba(255,255,255,0.9)', borderWidth: 1, zIndex: 20 },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 14, textAlign: 'center', lineHeight: 18 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 0.5, borderColor: '#2C2C2E', backgroundColor: '#0B0B0C' },
  tool: { alignItems: 'center', gap: 6, minWidth: 70 },
  toolTxt: { color: '#8E8E93', fontSize: 12, fontWeight: '500' },
});
*/













// AdminView.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert,
  Image, ScrollView, SafeAreaView, Modal, Dimensions, PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioPlayer, useAudioPlayerStatus, useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Video as VideoCompressor } from 'react-native-compressor';
import { supabase } from '../lib/supabase';
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SW, height: SH } = Dimensions.get('window');
const CW = SW - 32, CH = SH * 0.58, MIN = 60, TOUCH = 56;
type Rect = { left: number; top: number; width: number; height: number };
type Media = { uri: string; type: 'image' | 'video' };

export default function AdminView({ isDark = false }: { isDark?: boolean }) {
  const [media, setMedia] = useState<Media[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─── CROP STATE ───
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editUri, setEditUri] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 1, height: 1 });
  const [dispSize, setDispSize] = useState({ width: CW, height: CH });
  const [crop, setCrop] = useState<Rect>({ left: 0, top: 0, width: CW, height: CH });
  const cropRef = useRef(crop), initRef = useRef(crop);
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1), pinchDist = useRef<number | null>(null), initScale = useRef(1);

  useEffect(() => { cropRef.current = crop; }, [crop]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // ─── CAMERA STATE ───
  const [camOn, setCamOn] = useState(false);
  const [camMode, setCamMode] = useState<'picture' | 'video'>('picture');
  const [facing, setFacing] = useState<CameraType>('back');
  const [vidRec, setVidRec] = useState(false);
  const camRef = useRef<CameraView>(null);
  const [camPerm, reqCam] = useCameraPermissions();
  const [micPerm, reqMic] = useMicrophonePermissions();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(audioUri ? { uri: audioUri } : { uri: '' });
  const pStatus = useAudioPlayerStatus(player);
  useEffect(() => { if (audioUri && player) player.replace({ uri: audioUri }); }, [audioUri]);

  // ─── PAN RESPONDER FACTORY ───
  const makeCornerPan = (corner: 'TL' | 'TR' | 'BL' | 'BR') =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { initRef.current = { ...cropRef.current }; },
      onPanResponderMove: (_, g) => {
        const i = initRef.current;
        let { left, top, width, height } = i;
        if (corner === 'TL' || corner === 'BL') {
          left = Math.max(0, Math.min(i.left + g.dx, i.left + i.width - MIN));
          width = i.left + i.width - left;
        } else {
          width = Math.max(MIN, Math.min(i.width + g.dx, dispSize.width - i.left));
        }
        if (corner === 'TL' || corner === 'TR') {
          top = Math.max(0, Math.min(i.top + g.dy, i.top + i.height - MIN));
          height = i.top + i.height - top;
        } else {
          height = Math.max(MIN, Math.min(i.height + g.dy, dispSize.height - i.top));
        }
        setCrop({ left, top, width, height });
      },
    });

  const panTL = useMemo(() => makeCornerPan('TL'), [dispSize]);
  const panTR = useMemo(() => makeCornerPan('TR'), [dispSize]);
  const panBL = useMemo(() => makeCornerPan('BL'), [dispSize]);
  const panBR = useMemo(() => makeCornerPan('BR'), [dispSize]);

  const panCenter = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (e) => (e.nativeEvent.touches?.length ?? 0) <= 2,
    onPanResponderGrant: (e) => {
      initRef.current = { ...cropRef.current };
      const t = e.nativeEvent.touches || [];
      if (t.length === 2) {
        pinchDist.current = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        initScale.current = zoomRef.current;
      }
    },
    onPanResponderMove: (e, g) => {
      const t = e.nativeEvent.touches || [];
      if (t.length === 2 && pinchDist.current) {
        const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        setZoom(Math.min(3, Math.max(1, initScale.current * (d / pinchDist.current))));
        return;
      }
      if (t.length === 1) {
        const i = initRef.current;
        setCrop({
          ...i,
          left: Math.max(0, Math.min(i.left + g.dx, dispSize.width - i.width)),
          top: Math.max(0, Math.min(i.top + g.dy, dispSize.height - i.height)),
        });
      }
    },
    onPanResponderRelease: () => { pinchDist.current = null; },
    onPanResponderTerminate: () => { pinchDist.current = null; },
  }), [dispSize]);

  // ─── CROP ACTIONS ───
  const openEditor = (idx: number) => {
    if (media[idx]?.type !== 'image') return;
    const uri = media[idx].uri;
    Image.getSize(uri, (w, h) => {
      if (!w || !h) return Alert.alert('Erreur', "Dimensions de l'image invalides.");
      setImgSize({ width: w, height: h });
      const r = w / h, cr = CW / CH;
      const dW = r > cr ? CW : CH * r, dH = r > cr ? CW / r : CH;
      setDispSize({ width: dW, height: dH });
      setCrop({ left: 0, top: 0, width: dW, height: dH });
      setZoom(1); zoomRef.current = 1;
      setEditIdx(idx); setEditUri(uri);
    }, () => Alert.alert('Erreur', "Impossible de charger l'image."));
  };

  const resetCrop = () => {
    setCrop({ left: 0, top: 0, width: dispSize.width, height: dispSize.height });
    setZoom(1); zoomRef.current = 1;
  };

  const rotate = async () => {
    if (!editUri) return;
    const r = await manipulateAsync(editUri, [{ rotate: 90 }], { compress: 0.8, format: SaveFormat.JPEG });
    setEditUri(r.uri);
    Image.getSize(r.uri, (w, h) => {
      if (!w || !h) return;
      setImgSize({ width: w, height: h });
      const ratio = w / h, cr = CW / CH;
      const dW = ratio > cr ? CW : CH * ratio, dH = ratio > cr ? CW / ratio : CH;
      setDispSize({ width: dW, height: dH });
      setCrop({ left: 0, top: 0, width: dW, height: dH });
      setZoom(1); zoomRef.current = 1;
    });
  };

  const flip = async () => {
    if (!editUri) return;
    const r = await manipulateAsync(editUri, [{ flip: FlipType.Horizontal }], { compress: 0.8, format: SaveFormat.JPEG });
    setEditUri(r.uri);
  };

  const applyCrop = async () => {
    if (!editUri || editIdx === null) return;
    try {
      const { width: cw, height: ch } = dispSize, s = zoom, cx = cw / 2, cy = ch / 2;
      const ux1 = cx + (crop.left - cx) / s, uy1 = cy + (crop.top - cy) / s;
      const ux2 = cx + (crop.left + crop.width - cx) / s, uy2 = cy + (crop.top + crop.height - cy) / s;
      const sx = imgSize.width / cw, sy = imgSize.height / ch;
      const originX = Math.max(0, Math.round(ux1 * sx));
      const originY = Math.max(0, Math.round(uy1 * sy));
      const w = Math.min(imgSize.width - originX, Math.round((ux2 - ux1) * sx));
      const h = Math.min(imgSize.height - originY, Math.round((uy2 - uy1) * sy));
      
      if (w <= 1 || h <= 1) return Alert.alert('Erreur', 'Zone invalide.');
      const r = await manipulateAsync(editUri, [{ crop: { originX, originY, width: w, height: h } }], { compress: 0.8, format: SaveFormat.JPEG });
      setMedia(p => { const u = [...p]; u[editIdx] = { ...u[editIdx], uri: r.uri }; return u; });
      closeEditor();
    } catch { Alert.alert('Erreur', "Échec du rognage."); closeEditor(); }
  };

  const closeEditor = () => { setEditIdx(null); setEditUri(null); };

  // ─── CAMERA ───
  const openCamera = async () => {
    let cp = camPerm, mp = micPerm;
    if (!cp?.granted) cp = await reqCam();
    if (!mp?.granted) mp = await reqMic();
    if (cp?.granted) setCamOn(true);
    else Alert.alert('Permission', 'Caméra refusée.');
  };

  const shoot = async () => {
    if (!camRef.current) return;
    try {
      const p = await camRef.current.takePictureAsync({ quality: 0.7, skipProcessing: true });
      if (p) { setCamOn(false); setMedia(x => [...x, { uri: p.uri, type: 'image' }]); }
    } catch { Alert.alert('Erreur', 'Photo impossible.'); }
  };

  const toggleVid = async () => {
    if (!camRef.current) return;
    if (vidRec) { camRef.current.stopRecording(); setVidRec(false); setCamOn(false); }
    else {
      setVidRec(true);
      const v = await camRef.current.recordAsync();
      if (v) setMedia(x => [...x, { uri: v.uri, type: 'video' }]);
    }
  };

  // ─── GALERIE / AUDIO ───
  const pickMedia = async () => {
    const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!p.granted) return Alert.alert('Permission', 'Galerie refusée.');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsMultipleSelection: true, quality: 1 });
    if (!r.canceled) {
      const items = r.assets.map(a => ({ uri: a.uri, type: (a.type === 'video' ? 'video' : 'image') as 'image' | 'video' }));
      setMedia(x => [...x, ...items]);
    }
  };

  const removeMedia = (i: number) => setMedia(p => p.filter((_, k) => k !== i));

  const pickAudio = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!r.canceled) {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      setAudioUri(r.assets[0].uri);
    }
  };

  const startRec = async () => {
    const p = await AudioModule.requestRecordingPermissionsAsync();
    if (!p.granted) return Alert.alert('Permission', 'Micro refusé.');
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    await recorder.record();
    setRecording(true);
  };

  const stopRec = async () => {
    setRecording(false);
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (recorder.uri) { setAudioUri(recorder.uri); player?.replace({ uri: recorder.uri }); }
  };

  const togglePlay = async () => {
    if (!audioUri || !player) return;
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (pStatus.playing) player.pause();
    else { player.seekTo(0); player.play(); }
  };

  const delAudio = () => { if (player && pStatus.playing) player.pause(); setAudioUri(null); };

  // ─── UPLOAD ───
  const upload = async (uri: string, type: 'image' | 'video' | 'audio') => {
    let u = uri;
    if (type === 'video') { try { u = await VideoCompressor.compress(uri, { compressionMethod: 'auto' }); } catch {} }
    const b64 = await FileSystem.readAsStringAsync(u, { encoding: FileSystem.EncodingType.Base64 });
    const buf = decode(b64);
    const ext = u.split('.').pop()?.split('?')[0] || (type === 'video' ? 'mp4' : 'bin');
    const mime = type === 'video' ? 'video/mp4' : type === 'image' ? 'image/jpeg' : 'audio/m4a';
    const folder = type === 'audio' ? 'audios' : 'medias';
    const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(7)}.${ext}`;
    const { error } = await supabase.storage.from('ganbanaaxu-media').upload(name, buf, { contentType: mime, upsert: false });
    if (error) throw new Error(`Storage: ${error.message}`);
    return supabase.storage.from('ganbanaaxu-media').getPublicUrl(name).data.publicUrl;
  };

  const publish = async () => {
    if (!media.length && !audioUri) return Alert.alert('Rien à envoyer', 'Ajoutez un média.');
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Connectez-vous.');
      const urls = await Promise.all(media.map(m => upload(m.uri, m.type)));
      const audioUrl = audioUri ? await upload(audioUri, 'audio') : null;
      const { error } = await supabase.from('posts').insert([{ user_id: user.id, media_urls: urls, audio_url: audioUrl }]);
      if (error) throw error;
      Alert.alert('Succès !', 'Publication envoyée.');
      setMedia([]); delAudio();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
    finally { setLoading(false); }
  };

  // ─── RENDER ───
  const cornerStyle = (c: 'TL' | 'TR' | 'BL' | 'BR') => {
    const base = { position: 'absolute', width: TOUCH, height: TOUCH, justifyContent: 'center', alignItems: 'center', zIndex: 25 } as const;
    const pos = {
      TL: { top: -TOUCH / 2, left: -TOUCH / 2 },
      TR: { top: -TOUCH / 2, right: -TOUCH / 2 },
      BL: { bottom: -TOUCH / 2, left: -TOUCH / 2 },
      BR: { bottom: -TOUCH / 2, right: -TOUCH / 2 },
    }[c];
    return [base, pos];
  };
  const shapeStyle = (c: 'TL' | 'TR' | 'BL' | 'BR') => ({
    width: 24, height: 24, borderColor: '#FFF',
    ...(c === 'TL' ? { borderTopWidth: 3, borderLeftWidth: 3 } : {}),
    ...(c === 'TR' ? { borderTopWidth: 3, borderRightWidth: 3 } : {}),
    ...(c === 'BL' ? { borderBottomWidth: 3, borderLeftWidth: 3 } : {}),
    ...(c === 'BR' ? { borderBottomWidth: 3, borderRightWidth: 3 } : {}),
  });

  return (
    <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
      {/* ══ CAMÉRA ══ */}
      <Modal visible={camOn} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCamOn(false)}>
        <SafeAreaView style={s.camContainer}>
          <View style={{ flex: 1 }}>
            <CameraView ref={camRef} style={{ flex: 1 }} facing={facing} mode={camMode} />
            <View style={s.camOverlay}>
              <View style={s.camTop}>
                <TouchableOpacity onPress={() => setCamOn(false)} style={s.iconBtn}><Ionicons name="close" size={32} color="#FFF" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setCamMode(p => p === 'picture' ? 'video' : 'picture')} style={s.modeBtn}>
                  <Ionicons name={camMode === 'picture' ? 'camera' : 'videocam'} size={20} color="#FFF" />
                  <Text style={s.modeTxt}>{camMode === 'picture' ? 'Photo' : 'Vidéo'}</Text>
                </TouchableOpacity>
              </View>
              <View style={s.camBottom}>
                <View style={{ width: 50 }} />
                <TouchableOpacity style={[s.shutter, vidRec && { backgroundColor: '#FF3B30' }]} onPress={camMode === 'picture' ? shoot : toggleVid} />
                <TouchableOpacity onPress={() => setFacing(p => p === 'back' ? 'front' : 'back')} style={s.iconBtn}>
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══ CROP EDITOR ══ */}
      <Modal visible={editIdx !== null} animationType="fade" onRequestClose={closeEditor}>
        <SafeAreaView style={s.editor}>
          <View style={s.editorHead}>
            <TouchableOpacity onPress={closeEditor}><Ionicons name="close" size={26} color="#FFF" /></TouchableOpacity>
            <Text style={s.editorTitle}>Recadrer</Text>
            <TouchableOpacity onPress={applyCrop} style={s.saveBtn}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={s.saveTxt}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          <View style={s.previewZone}>
            <View style={s.zoomBadge}><Text style={s.zoomTxt}>{zoom.toFixed(1)}x</Text></View>

            <View style={[s.imgBox, { width: dispSize.width, height: dispSize.height }]}>
              {/* Couche interne CLIPPÉE : image + masques */}
              <View style={[s.clipLayer, { width: dispSize.width, height: dispSize.height }]}>
                {editUri && (
                  <Image 
                    key={editUri} // Force le re-montage quand l'image pivote
                    source={{ uri: editUri }} 
                    style={[s.editorImg, { width: dispSize.width, height: dispSize.height, transform: [{ scale: zoom }] }]} 
                    resizeMode="contain" 
                  />
                )}
                
                {/* Masques avec largeurs et hauteurs explicites pour éviter le bug d'écran noir Android */}
                <View style={[s.mask, { top: 0, left: 0, width: dispSize.width, height: crop.top }]} pointerEvents="none" />
                <View style={[s.mask, { top: crop.top + crop.height, left: 0, width: dispSize.width, height: dispSize.height - (crop.top + crop.height) }]} pointerEvents="none" />
                <View style={[s.mask, { top: crop.top, left: 0, width: crop.left, height: crop.height }]} pointerEvents="none" />
                <View style={[s.mask, { top: crop.top, left: crop.left + crop.width, width: dispSize.width - (crop.left + crop.width), height: crop.height }]} pointerEvents="none" />
              </View>

              {/* Cadre interactif */}
              <View style={[s.cropBox, { left: crop.left, top: crop.top, width: crop.width, height: crop.height }]} pointerEvents="box-none">
                <View style={{ flex: 1 }} {...panCenter.panHandlers}>
                  <View style={[s.gridH, { top: '33.33%' }]} pointerEvents="none" />
                  <View style={[s.gridH, { top: '66.66%' }]} pointerEvents="none" />
                  <View style={[s.gridV, { left: '33.33%' }]} pointerEvents="none" />
                  <View style={[s.gridV, { left: '66.66%' }]} pointerEvents="none" />
                </View>
                {(['TL', 'TR', 'BL', 'BR'] as const).map(c => (
                  <View key={c} style={cornerStyle(c)} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }} {...({ TL: panTL, TR: panTR, BL: panBL, BR: panBR }[c]).panHandlers}>
                    <View style={shapeStyle(c)} pointerEvents="none" />
                  </View>
                ))}
              </View>
            </View>

            <Text style={s.hint}>• Coins pour rogner{'\n'}• Centre pour déplacer | 2 doigts pour zoomer</Text>
          </View>

          <View style={s.toolbar}>
            {[
              { icon: 'scan-outline', label: 'Reset', fn: resetCrop },
              { icon: 'refresh-outline', label: 'Pivoter', fn: rotate },
              { icon: 'swap-horizontal-outline', label: 'Miroir', fn: flip },
            ].map(t => (
              <TouchableOpacity key={t.label} onPress={t.fn} style={s.tool}>
                <Ionicons name={t.icon as any} size={22} color="#FFF" />
                <Text style={s.toolTxt}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══ BOUTONS ══ */}
      <View style={s.grid}>
        {[
          { bg: '#FF9500', icon: 'camera', label: 'Filmer / Photo', fn: openCamera },
          { bg: '#007AFF', icon: 'images', label: 'Galerie', fn: pickMedia },
          { bg: recording ? '#000' : '#FF3B30', icon: recording ? 'stop-circle' : 'mic', label: recording ? 'Arrêter' : 'Parler', fn: recording ? stopRec : startRec },
          { bg: '#AF52DE', icon: 'musical-notes', label: 'Audio', fn: pickAudio },
        ].map((b, i) => (
          <TouchableOpacity key={i} style={[s.bigBtn, { backgroundColor: b.bg }]} onPress={b.fn} disabled={loading}>
            <Ionicons name={b.icon as any} size={40} color="#FFF" />
            <Text style={s.bigTxt}>{b.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ══ APERÇU ══ */}
      <View style={s.previewSection}>
        {loading && <ActivityIndicator size="small" color="#007AFF" style={{ marginBottom: 10 }} />}
        {media.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 10 }}>
            {media.map((m, i) => (
              <View key={i} style={s.thumbWrap}>
                <Image source={{ uri: m.uri }} style={s.thumb} />
                {m.type === 'video'
                  ? <View style={s.vidBadge}><Ionicons name="videocam" size={18} color="#FFF" /></View>
                  : <TouchableOpacity style={s.editBadge} onPress={() => openEditor(i)}><Ionicons name="pencil" size={16} color="#FFF" /></TouchableOpacity>}
                <TouchableOpacity style={s.rmBadge} onPress={() => removeMedia(i)}><Ionicons name="close-circle" size={26} color="#FF3B30" /></TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        {audioUri && (
          <View style={s.audioRow}>
            <TouchableOpacity style={s.playBtn} onPress={togglePlay}>
              <Ionicons name={pStatus.playing ? 'pause' : 'play'} size={28} color="#FFF" />
              <Text style={s.playTxt}>{pStatus.playing ? 'Pause' : 'Écouter'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={delAudio}><Ionicons name="trash" size={26} color="#FF3B30" /></TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={[s.sendBtn, loading && { opacity: 0.5 }]} onPress={publish} disabled={loading}>
        {loading ? <ActivityIndicator size="large" color="#fff" /> : (
          <><Ionicons name="send" size={30} color="#FFF" /><Text style={s.sendTxt}>ENVOYER</Text></>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigBtn: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigTxt: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  previewSection: { marginBottom: 20, minHeight: 60 },
  thumbWrap: { marginRight: 15, position: 'relative' },
  thumb: { width: 110, height: 110, borderRadius: 14 },
  vidBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4, borderRadius: 6 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  rmBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },
  audioRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  playBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  playTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  sendBtn: { flexDirection: 'row', backgroundColor: '#34C759', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  sendTxt: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },

  // Camera
  camContainer: { flex: 1, backgroundColor: '#000' },
  camOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 10 },
  camTop: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 40, alignItems: 'center' },
  camBottom: { flexDirection: 'row', justifyContent: 'space-between', padding: 30, paddingBottom: 50, alignItems: 'center' },
  iconBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  shutter: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },
  modeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, gap: 5 },
  modeTxt: { color: '#FFF', fontWeight: 'bold' },

  // Editor
  editor: { flex: 1, backgroundColor: '#0B0B0C' },
  editorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  editorTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 4 },
  saveTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  previewZone: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  zoomBadge: { position: 'absolute', top: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', zIndex: 30 },
  zoomTxt: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  imgBox: { position: 'relative', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  clipLayer: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' }, // Position exacte évitant absoluteFillObject
  editorImg: { position: 'absolute' }, // Libéré de 100% car on donne une largeur et hauteur précises
  mask: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10 },
  cropBox: { position: 'absolute', borderColor: 'rgba(255,255,255,0.9)', borderWidth: 1, zIndex: 20 },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 14, textAlign: 'center', lineHeight: 18 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 0.5, borderColor: '#2C2C2E', backgroundColor: '#0B0B0C' },
  tool: { alignItems: 'center', gap: 6, minWidth: 70 },
  toolTxt: { color: '#8E8E93', fontSize: 12, fontWeight: '500' },
});






































