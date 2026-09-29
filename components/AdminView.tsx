




















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
          {/* Boutons supérieurs (Fermer & Switch Photo/Video) */}
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

          {/* Boutons inférieurs (Capture & Flip) */}
          <View style={styles.cameraBottomControls}>
            <View style={{ width: 50 }} /> {/* Espaceur */}
            
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








