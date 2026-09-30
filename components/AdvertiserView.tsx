
/*
// AdvertiserView.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface AdvertiserViewProps {
  isDark: boolean;
  selectedMedia: any[];
  recordedAudioUri: string | null;
  isRecording: boolean;
  isPlayingAudio: boolean;
  loading: boolean;
  pickMedia: () => void;
  pickAudio: () => void;
  setSelectedMedia: React.Dispatch<React.SetStateAction<any[]>>;
  setRecordedAudioUri: (uri: string | null) => void;
  setIsPlayingAudio: (play: boolean) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleAudioPreview: () => void;
  handlePublishProcess: () => void;
}

export default function AdvertiserView({
  isDark,
  selectedMedia,
  recordedAudioUri,
  isRecording,
  isPlayingAudio,
  loading,
  pickMedia,
  pickAudio,
  setSelectedMedia,
  setRecordedAudioUri,
  setIsPlayingAudio,
  startRecording,
  stopRecording,
  toggleAudioPreview,
  handlePublishProcess,
}: AdvertiserViewProps) {
  return (
    <View>
      
      <View style={[styles.card, styles.cardAdInfo]}>
        <MaterialIcons name="payment" size={22} color="#BF5AF2" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, isDark ? styles.textDark : styles.textLight]}>
            Tarification Annonces Publicitaires
          </Text>
          <Text style={styles.infoSubtitle}>
            La diffusion d'annonces dans cette section requiert un paiement forfaitaire de validation.
          </Text>
        </View>
      </View>

      
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
          Fichiers de votre publicité
        </Text>
        <View style={styles.buttonGroupRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={pickMedia}>
            <MaterialIcons name="photo-library" size={20} color="#FFF" />
            <Text style={styles.btnText}>Galerie ({selectedMedia.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={pickAudio}>
            <MaterialIcons name="library-music" size={20} color="#FFF" />
            <Text style={styles.btnText}>Audio</Text>
          </TouchableOpacity>
        </View>

        {selectedMedia.map((item, idx) => (
          <View key={idx} style={styles.fileRow}>
            <Ionicons name={item.type === 'video' ? "videocam" : "image"} size={18} color="#888" />
            <Text style={styles.fileRowText} numberOfLines={1}>{item.uri.split('/').pop()}</Text>
            <TouchableOpacity onPress={() => setSelectedMedia(prev => prev.filter((_, i) => i !== idx))}>
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
          Enregistreur Vocal (Spot Publicitaire)
        </Text>
        <TouchableOpacity 
          style={[styles.btnAudio, isRecording ? styles.btnAudioActive : null]} 
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={22} color="#FFF" />
          <Text style={styles.btnText}>{isRecording ? "Arrêter l'enregistrement" : "Démarrer le micro"}</Text>
        </TouchableOpacity>

        {recordedAudioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={isPlayingAudio ? "pause" : "play"} size={20} color="#FFF" />
              <Text style={styles.btnText}>Écouter la note</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setRecordedAudioUri(null); setIsPlayingAudio(false); }}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

  
      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#34C759' }]} onPress={handlePublishProcess} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name="payment" size={20} color="#FFF" />
            <Text style={styles.btnText}>Payer et publier l'annonce</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// Les styles partagés ou locaux (simplifiés ici, voir styles globaux en bas)
const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardDark: { backgroundColor: '#1E1E1E' },
  cardLight: { backgroundColor: '#FFFFFF' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 14 },
  cardAdInfo: { borderLeftWidth: 4, borderLeftColor: '#BF5AF2', flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(191,90,242,0.05)' },
  textDark: { color: '#FFFFFF' },
  textLight: { color: '#1C1E21' },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2, lineHeight: 16 },
  buttonGroupRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btnPrimary: { flexDirection: 'row', padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnSecondary: { flex: 1, flexDirection: 'row', backgroundColor: '#48484A', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnAudio: { flexDirection: 'row', backgroundColor: '#5856D6', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnAudioActive: { backgroundColor: '#FF3B30' },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(150,150,150,0.2)' },
  fileRowText: { flex: 1, marginLeft: 8, fontSize: 14, color: '#8E8E93' },
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, backgroundColor: 'rgba(150,150,150,0.1)', padding: 10, borderRadius: 8 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2C2C2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }
});
*/


















/*

// AdvertiserView.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface AdvertiserViewProps {
  isDark?: boolean;
  selectedMedia?: any[];
  recordedAudioUri?: string | null;
  isRecording?: boolean;
  isPlayingAudio?: boolean;
  loading?: boolean;
  pickMedia?: () => void;
  pickAudio?: () => void;
  setSelectedMedia?: React.Dispatch<React.SetStateAction<any[]>>;
  setRecordedAudioUri?: (uri: string | null) => void;
  setIsPlayingAudio?: (play: boolean) => void;
  startRecording?: () => void;
  stopRecording?: () => void;
  toggleAudioPreview?: () => void;
  handlePublishProcess?: () => void;
}

export default function AdvertiserView({
  isDark = false,
  selectedMedia = [], // <-- Valeur par défaut pour éviter le undefined
  recordedAudioUri = null,
  isRecording = false,
  isPlayingAudio = false,
  loading = false,
  pickMedia = () => {},
  pickAudio = () => {},
  setSelectedMedia = () => {},
  setRecordedAudioUri = () => {},
  setIsPlayingAudio = () => {},
  startRecording = () => {},
  stopRecording = () => {},
  toggleAudioPreview = () => {},
  handlePublishProcess = () => {},
}: AdvertiserViewProps) {
  return (
    <View>
      // Tarification 
      <View style={[styles.card, styles.cardAdInfo]}>
        <MaterialIcons name="payment" size={22} color="#BF5AF2" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, isDark ? styles.textDark : styles.textLight]}>
            Tarification Annonces Publicitaires
          </Text>
          <Text style={styles.infoSubtitle}>
            La diffusion d'annonces dans cette section requiert un paiement forfaitaire de validation.
          </Text>
        </View>
      </View>

      // Sélection de médias 
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
          Fichiers de votre publicité
        </Text>
        <View style={styles.buttonGroupRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={pickMedia}>
            <MaterialIcons name="photo-library" size={20} color="#FFF" />
            // Utilisation de ?. pour être 100% sécurisé 
            <Text style={styles.btnText}>Galerie ({selectedMedia?.length ?? 0})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={pickAudio}>
            <MaterialIcons name="library-music" size={20} color="#FFF" />
            <Text style={styles.btnText}>Audio</Text>
          </TouchableOpacity>
        </View>

        {selectedMedia?.map((item, idx) => (
          <View key={idx} style={styles.fileRow}>
            <Ionicons name={item.type === 'video' ? "videocam" : "image"} size={18} color="#888" />
            <Text style={styles.fileRowText} numberOfLines={1}>{item.uri?.split('/')?.pop()}</Text>
            <TouchableOpacity onPress={() => setSelectedMedia(prev => prev.filter((_, i) => i !== idx))}>
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      // Dictaphone 
      <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
        <Text style={[styles.cardTitle, isDark ? styles.textDark : styles.textLight]}>
          Enregistreur Vocal (Spot Publicitaire)
        </Text>
        <TouchableOpacity 
          style={[styles.btnAudio, isRecording ? styles.btnAudioActive : null]} 
          onPress={isRecording ? stopRecording : startRecording}
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={22} color="#FFF" />
          <Text style={styles.btnText}>{isRecording ? "Arrêter l'enregistrement" : "Démarrer le micro"}</Text>
        </TouchableOpacity>

        {recordedAudioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={isPlayingAudio ? "pause" : "play"} size={20} color="#FFF" />
              <Text style={styles.btnText}>Écouter la note</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setRecordedAudioUri(null); setIsPlayingAudio(false); }}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      // Bouton de validation de l'annonce 
      <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#34C759' }]} onPress={handlePublishProcess} disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name="payment" size={20} color="#FFF" />
            <Text style={styles.btnText}>Payer et publier l'annonce</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardDark: { backgroundColor: '#1E1E1E' },
  cardLight: { backgroundColor: '#FFFFFF' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 14 },
  cardAdInfo: { borderLeftWidth: 4, borderLeftColor: '#BF5AF2', flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(191,90,242,0.05)' },
  textDark: { color: '#FFFFFF' },
  textLight: { color: '#1C1E21' },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2, lineHeight: 16 },
  buttonGroupRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btnPrimary: { flexDirection: 'row', padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnSecondary: { flex: 1, flexDirection: 'row', backgroundColor: '#48484A', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnAudio: { flexDirection: 'row', backgroundColor: '#5856D6', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnAudioActive: { backgroundColor: '#FF3B30' },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(150,150,150,0.2)' },
  fileRowText: { flex: 1, marginLeft: 8, fontSize: 14, color: '#8E8E93' },
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, backgroundColor: 'rgba(150,150,150,0.1)', padding: 10, borderRadius: 8 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2C2C2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }
});

*/






















/*
// AdvertiserView.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | string;
}

interface AdvertiserViewProps {
  isDark?: boolean;
  selectedMedia?: MediaItem[];
  recordedAudioUri?: string | null;
  isRecording?: boolean;
  isPlayingAudio?: boolean;
  loading?: boolean;
  pickMedia?: () => void;
  pickAudio?: () => void;
  setSelectedMedia?: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  setRecordedAudioUri?: (uri: string | null) => void;
  setIsPlayingAudio?: (play: boolean) => void;
  startRecording?: () => void;
  stopRecording?: () => void;
  toggleAudioPreview?: () => void;
  handlePublishProcess?: () => void;
}

export default function AdvertiserView({
  isDark = false,
  selectedMedia = [],
  recordedAudioUri = null,
  isRecording = false,
  isPlayingAudio = false,
  loading = false,
  pickMedia = () => {},
  pickAudio = () => {},
  setSelectedMedia = () => {},
  setRecordedAudioUri = () => {},
  setIsPlayingAudio = () => {},
  startRecording = () => {},
  stopRecording = () => {},
  toggleAudioPreview = () => {},
  handlePublishProcess = () => {},
}: AdvertiserViewProps) {
  const themeCard = isDark ? styles.cardDark : styles.cardLight;
  const themeText = isDark ? styles.textDark : styles.textLight;

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      // Tarification Annonceur 
      <View style={[styles.card, styles.cardAdInfo]}>
        <MaterialIcons name="payment" size={22} color="#BF5AF2" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, themeText]}>
            Tarification Annonces Publicitaires
          </Text>
          <Text style={styles.infoSubtitle}>
            La diffusion d'annonces dans cette section requiert un paiement forfaitaire de validation.
          </Text>
        </View>
      </View>

      // Sélection de médias 
      <View style={[styles.card, themeCard]}>
        <Text style={[styles.cardTitle, themeText]}>
          Fichiers de votre publicité
        </Text>
        <View style={styles.buttonGroupRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={pickMedia} disabled={loading}>
            <MaterialIcons name="photo-library" size={20} color="#FFF" />
            <Text style={styles.btnText}>Galerie ({selectedMedia.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={pickAudio} disabled={loading}>
            <MaterialIcons name="library-music" size={20} color="#FFF" />
            <Text style={styles.btnText}>Audio</Text>
          </TouchableOpacity>
        </View>

        {selectedMedia.map((item, idx) => (
          <View key={idx} style={styles.fileRow}>
            <Ionicons name={item.type === 'video' ? "videocam" : "image"} size={18} color="#888" />
            <Text style={styles.fileRowText} numberOfLines={1}>
              {item.uri?.split('/')?.pop()}
            </Text>
            <TouchableOpacity onPress={() => setSelectedMedia((prev) => prev.filter((_, i) => i !== idx))}>
              <Ionicons name="close-circle" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      // Dictaphone 
      <View style={[styles.card, themeCard]}>
        <Text style={[styles.cardTitle, themeText]}>
          Enregistreur Vocal (Spot Publicitaire)
        </Text>
        <TouchableOpacity 
          style={[styles.btnAudio, isRecording ? styles.btnAudioActive : null]} 
          onPress={isRecording ? stopRecording : startRecording}
          disabled={loading}
        >
          <Ionicons name={isRecording ? "stop" : "mic"} size={22} color="#FFF" />
          <Text style={styles.btnText}>
            {isRecording ? "Arrêter l'enregistrement" : "Démarrer le micro"}
          </Text>
        </TouchableOpacity>

        {recordedAudioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={isPlayingAudio ? "pause" : "play"} size={20} color="#FFF" />
              <Text style={styles.btnText}>Écouter la note</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setRecordedAudioUri(null); setIsPlayingAudio(false); }}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      // Bouton de paiement & publication 
      <TouchableOpacity 
        style={[styles.btnPrimary, loading ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name="payment" size={20} color="#FFF" />
            <Text style={styles.btnText}>Payer et publier l'annonce</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  cardDark: { backgroundColor: '#1E1E1E' },
  cardLight: { backgroundColor: '#FFFFFF' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 14 },
  cardAdInfo: { borderLeftWidth: 4, borderLeftColor: '#BF5AF2', flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(191,90,242,0.05)' },
  textDark: { color: '#FFFFFF' },
  textLight: { color: '#1C1E21' },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2, lineHeight: 16 },
  buttonGroupRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btnPrimary: { flexDirection: 'row', backgroundColor: '#34C759', padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 },
  btnSecondary: { flex: 1, flexDirection: 'row', backgroundColor: '#48484A', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnAudio: { flexDirection: 'row', backgroundColor: '#5856D6', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnAudioActive: { backgroundColor: '#FF3B30' },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  fileRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: 'rgba(150,150,150,0.2)' },
  fileRowText: { flex: 1, marginLeft: 8, fontSize: 14, color: '#8E8E93' },
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, backgroundColor: 'rgba(150,150,150,0.1)', padding: 10, borderRadius: 8 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2C2C2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  disabledBtn: { opacity: 0.6 },
});
*/



















/*
// AdvertiserView.tsx
import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | string;
}

interface AdvertiserViewProps {
  isDark?: boolean;
  selectedMedia?: MediaItem[];
  recordedAudioUri?: string | null;
  isRecording?: boolean;
  isPlayingAudio?: boolean;
  loading?: boolean;
  pickMedia?: () => void;
  takeMedia?: () => void; // NOUVEAU: Pour la caméra
  pickAudio?: () => void; // NOUVEAU: Pour le fichier audio
  startRecording?: () => void;
  stopRecording?: () => void;
  toggleAudioPreview?: () => void;
  handlePublishProcess?: () => void;
  setSelectedMedia?: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  setRecordedAudioUri?: (uri: string | null) => void;
  setIsPlayingAudio?: (play: boolean) => void;
}

export default function AdvertiserView({
  isDark = false,
  selectedMedia = [],
  recordedAudioUri = null,
  isRecording = false,
  isPlayingAudio = false,
  loading = false,
  pickMedia = () => {},
  takeMedia = () => {},
  pickAudio = () => {},
  startRecording = () => {},
  stopRecording = () => {},
  toggleAudioPreview = () => {},
  handlePublishProcess = () => {},
  setSelectedMedia = () => {},
  setRecordedAudioUri = () => {},
  setIsPlayingAudio = () => {},
}: AdvertiserViewProps) {
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

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudio} disabled={loading}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.previewSection}>
        {selectedMedia.map((item, idx) => (
          <View key={idx} style={styles.fileRow}>
            <Ionicons name={item.type === 'video' ? "videocam" : "image"} size={24} color="#007AFF" />
            <Text style={styles.fileRowText} numberOfLines={1}>Fichier joint</Text>
            <TouchableOpacity onPress={() => setSelectedMedia((prev) => prev.filter((_, i) => i !== idx))}>
              <Ionicons name="close-circle" size={30} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        ))}

        {recordedAudioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={isPlayingAudio ? "pause" : "play"} size={30} color="#FFF" />
              <Text style={styles.btnPlayText}>Écouter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setRecordedAudioUri(null); setIsPlayingAudio(false); }}>
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
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name="payment" size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>PAYER & ENVOYER</Text>
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
  
  previewSection: { marginBottom: 20 },
  fileRow: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#E5E5EA', borderRadius: 12, marginBottom: 10 },
  fileRowText: { flex: 1, marginLeft: 10, fontSize: 16, fontWeight: '600', color: '#1C1E21' },
  
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
});

*/











/*
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase'; // Vérifiez que le chemin est correct
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | string;
}

export default function AdvertiserView({ isDark = false }) {
  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  
  // Audio Record & Play
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Publication et Limites
  const [loading, setLoading] = useState(false);
  const [postsThisMonth, setPostsThisMonth] = useState(0); 
  const MAX_POSTS_PER_MONTH = 5;
  const canPublish = postsThisMonth < MAX_POSTS_PER_MONTH;

  // --- NETTOYAGE AUDIO ---
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // --- CAMÉRA (UNIQUEMENT PHOTO) ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // BLOQUÉ SUR IMAGES
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia(prev => [...prev, { uri: asset.uri, type: 'image' }]);
    }
  };

  // --- SÉLECTION GALERIE (UNIQUEMENT PHOTO) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // BLOQUÉ SUR IMAGES
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({ uri: asset.uri, type: 'image' }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SÉLECTION FICHIER AUDIO ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- ENREGISTREMENT VOCAL (MICRO) ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
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
    if (uri) setRecordedAudioUri(uri);
  };

  const toggleAudioPreview = async () => {
    if (!recordedAudioUri) return;
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
          { uri: recordedAudioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlayingAudio(true);
        newSound.setOnPlaybackStatusUpdate((status: any) => {
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
    setRecordedAudioUri(null);
    setIsPlayingAudio(false);
  };

  // --- FONCTION D'UPLOAD UNIFIÉE ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    
    // Annonceur = Uniquement image ou audio
    let mimeType = folder === 'medias' ? 'image/jpeg' : 'audio/m4a'; 
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media') // LE MÊME BUCKET QUE ADMINVIEW
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- PROCESSUS DE PUBLICATION ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert("Rien à envoyer", "Ajoutez une photo ou un vocal.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté.");

      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = recordedAudioUri ? await uploadFileToSupabase(recordedAudioUri, 'audios') : null;

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          media_urls: uploadedMediaUrls,
          audio_url: uploadedAudioUrl,
          caption: "Annonce sponsorisée",
        }
      ]);

      if (error) throw error;

      Alert.alert("Succès !", "Votre annonce a été envoyée avec succès.");
      
      setSelectedMedia([]);
      await deleteAudio();
      setPostsThisMonth(prev => prev + 1);

    } catch (error: any) {
      Alert.alert("Erreur de publication", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
    
      <View style={[styles.limitContainer, !canPublish && styles.limitContainerError]}>
        <Ionicons name={canPublish ? "information-circle" : "warning"} size={24} color={canPublish ? "#007AFF" : "#FF3B30"} />
        <Text style={[styles.limitText, !canPublish && styles.limitTextError]}>
          Annonces publiées ce mois-ci : {postsThisMonth} / {MAX_POSTS_PER_MONTH}
          {!canPublish && "\nVous avez atteint votre limite mensuelle."}
        </Text>
      </View>

    
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading || !canPublish}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading || !canPublish}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, recording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={recording ? stopRecording : startRecording} 
          disabled={loading || !canPublish}
        >
          <Ionicons name={recording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{recording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading || !canPublish}>
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
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {recordedAudioUri && (
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
        style={[styles.btnSendHuge, (loading || !canPublish) ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading || !canPublish}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name={canPublish ? "payment" : "block"} size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>
              {canPublish ? "PAYER & ENVOYER" : "LIMITE ATTEINTE"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  limitContainerError: { backgroundColor: '#FFE5E5' },
  limitText: { color: '#007AFF', fontSize: 15, fontWeight: '600', flex: 1 },
  limitTextError: { color: '#FF3B30' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 50 },
  previewContainer: { flexDirection: 'row' },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 100, height: 100, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 15 },
  
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
});
*/


























/*
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase'; // Vérifiez que ce chemin correspond à votre configuration
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | string;
}

export default function AdvertiserView({ isDark = false }) {
  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  
  // Audio Record & Play
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Publication et Limites
  const [loading, setLoading] = useState(false);
  const [postsThisMonth, setPostsThisMonth] = useState(0); 
  const MAX_POSTS_PER_MONTH = 5;
  const canPublish = postsThisMonth < MAX_POSTS_PER_MONTH;

  // --- RÉCUPÉRATION DU NOMBRE DE POSTS DU MOIS DEPUIS SUPABASE ---
  useEffect(() => {
    const fetchMonthlyPostCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calculer les dates du début et de fin du mois actuel
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        // Demander à Supabase de compter les posts de cet utilisateur pour ce mois-ci
        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (error) {
          console.error("Erreur lors du comptage des posts:", error.message);
        } else {
          setPostsThisMonth(count || 0);
        }
      } catch (err) {
        console.log("Erreur inattendue lors de la récupération des posts:", err);
      }
    };

    fetchMonthlyPostCount();
  }, []);

  // --- NETTOYAGE AUDIO ---
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // --- CAMÉRA (UNIQUEMENT PHOTO) ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // BLOQUÉ SUR IMAGES
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia(prev => [...prev, { uri: asset.uri, type: 'image' }]);
    }
  };

  // --- SÉLECTION GALERIE (UNIQUEMENT PHOTO) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // BLOQUÉ SUR IMAGES
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({ uri: asset.uri, type: 'image' }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SÉLECTION FICHIER AUDIO ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- ENREGISTREMENT VOCAL (MICRO) ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
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
    if (uri) setRecordedAudioUri(uri);
  };

  const toggleAudioPreview = async () => {
    if (!recordedAudioUri) return;
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
          { uri: recordedAudioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlayingAudio(true);
        newSound.setOnPlaybackStatusUpdate((status: any) => {
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
    setRecordedAudioUri(null);
    setIsPlayingAudio(false);
  };

  // --- FONCTION D'UPLOAD UNIFIÉE ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    
    // Annonceur = Uniquement image ou audio
    let mimeType = folder === 'medias' ? 'image/jpeg' : 'audio/m4a'; 
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media') // LE MÊME BUCKET QUE ADMINVIEW
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- PROCESSUS DE PUBLICATION ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert("Rien à envoyer", "Ajoutez une photo ou un vocal.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté.");

      // Upload de l'image et de l'audio dans le bucket
      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = recordedAudioUri ? await uploadFileToSupabase(recordedAudioUri, 'audios') : null;

      // Insertion dans la base de données
      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          media_urls: uploadedMediaUrls,
          audio_url: uploadedAudioUrl,
          caption: "Annonce sponsorisée", // Modifiez ceci si vous avez changé le nom de la colonne
        }
      ]);

      if (error) throw error;

      Alert.alert("Succès !", "Votre annonce a été envoyée avec succès.");
      
      // Nettoyage de l'interface et incrémentation manuelle du compteur
      setSelectedMedia([]);
      await deleteAudio();
      setPostsThisMonth(prev => prev + 1);

    } catch (error: any) {
      Alert.alert("Erreur de publication", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      
      <View style={[styles.limitContainer, !canPublish && styles.limitContainerError]}>
        <Ionicons name={canPublish ? "information-circle" : "warning"} size={24} color={canPublish ? "#007AFF" : "#FF3B30"} />
        <Text style={[styles.limitText, !canPublish && styles.limitTextError]}>
          Annonces publiées ce mois-ci : {postsThisMonth} / {MAX_POSTS_PER_MONTH}
          {!canPublish && "\nVous avez atteint votre limite mensuelle."}
        </Text>
      </View>

    
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading || !canPublish}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading || !canPublish}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, recording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={recording ? stopRecording : startRecording} 
          disabled={loading || !canPublish}
        >
          <Ionicons name={recording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{recording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading || !canPublish}>
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
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {recordedAudioUri && (
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
        style={[styles.btnSendHuge, (loading || !canPublish) ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading || !canPublish}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name={canPublish ? "payment" : "block"} size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>
              {canPublish ? "PAYER & ENVOYER" : "LIMITE ATTEINTE"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  limitContainerError: { backgroundColor: '#FFE5E5' },
  limitText: { color: '#007AFF', fontSize: 15, fontWeight: '600', flex: 1 },
  limitTextError: { color: '#FF3B30' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 50 },
  previewContainer: { flexDirection: 'row' },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 100, height: 100, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -10, right: -10, backgroundColor: '#FFF', borderRadius: 15 },
  
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
});
*/
















/*
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { supabase } from '../lib/supabase'; // Vérifiez que le chemin correspond à votre configuration
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | string;
}

export default function Index({ isDark = false }) {
  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  
  // Audio Record & Play
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  
  // Publication et Limites
  const [loading, setLoading] = useState(false);
  const [postsThisMonth, setPostsThisMonth] = useState(0); 
  const MAX_POSTS_PER_MONTH = 5;
  const canPublish = postsThisMonth < MAX_POSTS_PER_MONTH;

  // --- RÉCUPÉRATION DU NOMBRE DE POSTS DU MOIS DEPUIS SUPABASE ---
  useEffect(() => {
    const fetchMonthlyPostCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Calculer les dates du début et de fin du mois actuel
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        // Demander à Supabase de compter les posts de cet utilisateur pour ce mois-ci
        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (error) {
          console.error("Erreur lors du comptage des posts:", error.message);
        } else {
          setPostsThisMonth(count || 0);
        }
      } catch (err) {
        console.log("Erreur inattendue lors de la récupération des posts:", err);
      }
    };

    fetchMonthlyPostCount();
  }, []);

  // --- NETTOYAGE AUDIO ---
  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  // --- CAMÉRA (UNIQUEMENT PHOTO) ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // BLOQUÉ SUR IMAGES
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia(prev => [...prev, { uri: asset.uri, type: 'image' }]);
    }
  };

  // --- SÉLECTION GALERIE (UNIQUEMENT PHOTO) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // BLOQUÉ SUR IMAGES
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({ uri: asset.uri, type: 'image' }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SÉLECTION FICHIER AUDIO ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- ENREGISTREMENT VOCAL (MICRO) ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
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
    if (uri) setRecordedAudioUri(uri);
  };

  const toggleAudioPreview = async () => {
    if (!recordedAudioUri) return;
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
          { uri: recordedAudioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlayingAudio(true);
        newSound.setOnPlaybackStatusUpdate((status: any) => {
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
    setRecordedAudioUri(null);
    setIsPlayingAudio(false);
  };

  // --- FONCTION D'UPLOAD UNIFIÉE ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    
    let mimeType = folder === 'medias' ? 'image/jpeg' : 'audio/m4a'; 
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media') 
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- PROCESSUS DE PUBLICATION ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert("Rien à envoyer", "Ajoutez une photo ou un vocal.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté.");

      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = recordedAudioUri ? await uploadFileToSupabase(recordedAudioUri, 'audios') : null;

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          media_urls: uploadedMediaUrls,
          audio_url: uploadedAudioUrl,
          caption: "Annonce sponsorisée", 
        }
      ]);

      if (error) throw error;

      Alert.alert("Succès !", "Votre annonce a été envoyée avec succès.");
      
      setSelectedMedia([]);
      await deleteAudio();
      setPostsThisMonth(prev => prev + 1);

    } catch (error: any) {
      Alert.alert("Erreur de publication", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
    
      <View style={[styles.limitContainer, !canPublish && styles.limitContainerError]}>
        <Ionicons name={canPublish ? "information-circle" : "warning"} size={24} color={canPublish ? "#007AFF" : "#FF3B30"} />
        <Text style={[styles.limitText, !canPublish && styles.limitTextError]}>
          Annonces publiées ce mois-ci : {postsThisMonth} / {MAX_POSTS_PER_MONTH}
          {!canPublish && "\nVous avez atteint votre limite mensuelle."}
        </Text>
      </View>

    
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading || !canPublish}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading || !canPublish}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, recording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={recording ? stopRecording : startRecording} 
          disabled={loading || !canPublish}
        >
          <Ionicons name={recording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{recording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading || !canPublish}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

   
      <View style={styles.previewSection}>
        {selectedMedia.length > 0 && (
          <View style={styles.previewContainer}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {recordedAudioUri && (
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
        style={[styles.btnSendHuge, (loading || !canPublish) ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading || !canPublish}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name={canPublish ? "payment" : "block"} size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>
              {canPublish ? "PAYER & ENVOYER" : "LIMITE ATTEINTE"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  limitContainerError: { backgroundColor: '#FFE5E5' },
  limitText: { color: '#007AFF', fontSize: 15, fontWeight: '600', flex: 1 },
  limitTextError: { color: '#FF3B30' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 50 },
  
 
  previewContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', // Permet aux images de passer à la ligne naturellement
    gap: 15,
    marginTop: 10
  },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { width: 80, height: 80, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 15 },
 

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
});
*/
















/*
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// Nouveaux imports du SDK Expo
import { useAudioRecorder, useAudioPlayer, AudioModule } from 'expo-audio';
import { supabase } from '../lib/supabase'; // Vérifiez que le chemin correspond à votre configuration
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | string;
}

export default function Index({ isDark = false }) {
  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  
  // --- NOUVELLE GESTION AUDIO (expo-audio) ---
  const recorder = useAudioRecorder();
  // Le player se mettra à jour automatiquement dès que recordedAudioUri change
  const player = useAudioPlayer(recordedAudioUri); 
  
  // Publication et Limites
  const [loading, setLoading] = useState(false);
  const [postsThisMonth, setPostsThisMonth] = useState(0); 
  const MAX_POSTS_PER_MONTH = 5;
  const canPublish = postsThisMonth < MAX_POSTS_PER_MONTH;

  // --- RÉCUPÉRATION DU NOMBRE DE POSTS DU MOIS DEPUIS SUPABASE ---
  useEffect(() => {
    const fetchMonthlyPostCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (error) {
          console.error("Erreur lors du comptage des posts:", error.message);
        } else {
          setPostsThisMonth(count || 0);
        }
      } catch (err) {
        console.log("Erreur inattendue lors de la récupération des posts:", err);
      }
    };

    fetchMonthlyPostCount();
  }, []);

  // --- CAMÉRA (UNIQUEMENT PHOTO) ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia(prev => [...prev, { uri: asset.uri, type: 'image' }]);
    }
  };

  // --- SÉLECTION GALERIE (UNIQUEMENT PHOTO) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({ uri: asset.uri, type: 'image' }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SÉLECTION FICHIER AUDIO ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- ENREGISTREMENT VOCAL (NOUVELLE API EXPO-AUDIO) ---
  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      
      await recorder.recordAsync();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
    }
  };

  const stopRecording = async () => {
    if (!recorder.isRecording) return;
    
    await recorder.stopAsync();
    if (recorder.uri) {
      setRecordedAudioUri(recorder.uri);
    }
  };

  // --- LECTURE VOCAL (NOUVELLE API EXPO-AUDIO) ---
  const toggleAudioPreview = () => {
    if (!player) return;
    
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const deleteAudio = () => {
    if (player) {
      player.pause();
    }
    setRecordedAudioUri(null);
  };

  // --- FONCTION D'UPLOAD UNIFIÉE ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    
    let mimeType = folder === 'medias' ? 'image/jpeg' : 'audio/m4a'; 
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media') 
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- PROCESSUS DE PUBLICATION ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert("Rien à envoyer", "Ajoutez une photo ou un vocal.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté.");

      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = recordedAudioUri ? await uploadFileToSupabase(recordedAudioUri, 'audios') : null;

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          media_urls: uploadedMediaUrls,
          audio_url: uploadedAudioUrl,
          caption: "Annonce sponsorisée", 
        }
      ]);

      if (error) throw error;

      Alert.alert("Succès !", "Votre annonce a été envoyée avec succès.");
      
      setSelectedMedia([]);
      deleteAudio();
      setPostsThisMonth(prev => prev + 1);

    } catch (error: any) {
      Alert.alert("Erreur de publication", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      <View style={[styles.limitContainer, !canPublish && styles.limitContainerError]}>
        <Ionicons name={canPublish ? "information-circle" : "warning"} size={24} color={canPublish ? "#007AFF" : "#FF3B30"} />
        <Text style={[styles.limitText, !canPublish && styles.limitTextError]}>
          Annonces publiées ce mois-ci : {postsThisMonth} / {MAX_POSTS_PER_MONTH}
          {!canPublish && "\nVous avez atteint votre limite mensuelle."}
        </Text>
      </View>

     
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading || !canPublish}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading || !canPublish}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, recorder.isRecording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={recorder.isRecording ? stopRecording : startRecording} 
          disabled={loading || !canPublish}
        >
          <Ionicons name={recorder.isRecording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{recorder.isRecording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading || !canPublish}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.previewSection}>
        {selectedMedia.length > 0 && (
          <View style={styles.previewContainer}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {recordedAudioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={player?.playing ? "pause" : "play"} size={30} color="#FFF" />
              <Text style={styles.btnPlayText}>Écouter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio}>
              <Ionicons name="trash" size={30} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      
      <TouchableOpacity 
        style={[styles.btnSendHuge, (loading || !canPublish) ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading || !canPublish}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name={canPublish ? "payment" : "block"} size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>
              {canPublish ? "PAYER & ENVOYER" : "LIMITE ATTEINTE"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  limitContainerError: { backgroundColor: '#FFE5E5' },
  limitText: { color: '#007AFF', fontSize: 15, fontWeight: '600', flex: 1 },
  limitTextError: { color: '#FF3B30' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 50 },
  
  previewContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15,
    marginTop: 10
  },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { width: 80, height: 80, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 15 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
});

*/


















/*
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAudioRecorder, useAudioPlayer, AudioModule } from 'expo-audio';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | string;
}

export default function Index({ isDark = false }) {
  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  
  // --- GESTION AUDIO (expo-audio) ---
  const recorder = useAudioRecorder();
  const player = useAudioPlayer(recordedAudioUri); 
  
  // Publication et Limites
  const [loading, setLoading] = useState(false);
  const [postsThisMonth, setPostsThisMonth] = useState(0); 
  const MAX_POSTS_PER_MONTH = 5;
  const canPublish = postsThisMonth < MAX_POSTS_PER_MONTH;

  // --- RÉCUPÉRATION DU NOMBRE DE POSTS DU MOIS DEPUIS SUPABASE ---
  useEffect(() => {
    const fetchMonthlyPostCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (error) {
          console.error("Erreur lors du comptage des posts:", error.message);
        } else {
          setPostsThisMonth(count || 0);
        }
      } catch (err) {
        console.log("Erreur inattendue lors de la récupération des posts:", err);
      }
    };

    fetchMonthlyPostCount();
  }, []);

  // --- CAMÉRA (UNIQUEMENT PHOTO) ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], // ✅ CORRECTION : 'images' au pluriel
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia(prev => [...prev, { uri: asset.uri, type: 'image' }]);
    }
  };

  // --- SÉLECTION GALERIE (UNIQUEMENT PHOTO) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // ✅ CORRECTION : 'images' au pluriel
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({ uri: asset.uri, type: 'image' }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SÉLECTION FICHIER AUDIO ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- ENREGISTREMENT VOCAL (EXPO-AUDIO) ---
  const startRecording = async () => {
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission', 'Accès au micro refusé.');
        return;
      }
      
      await recorder.recordAsync();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
    }
  };

  const stopRecording = async () => {
    if (!recorder.isRecording) return;
    
    await recorder.stopAsync();
    if (recorder.uri) {
      setRecordedAudioUri(recorder.uri);
    }
  };

  // --- LECTURE VOCAL (EXPO-AUDIO) ---
  const toggleAudioPreview = () => {
    if (!player) return;
    
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const deleteAudio = () => {
    if (player) {
      player.pause();
    }
    setRecordedAudioUri(null);
  };

  // --- FONCTION D'UPLOAD UNIFIÉE ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    
    let mimeType = folder === 'medias' ? 'image/jpeg' : 'audio/m4a'; 
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media') 
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- PROCESSUS DE PUBLICATION ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert("Rien à envoyer", "Ajoutez une photo ou un vocal.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté.");

      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = recordedAudioUri ? await uploadFileToSupabase(recordedAudioUri, 'audios') : null;

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          media_urls: uploadedMediaUrls,
          audio_url: uploadedAudioUrl,
          caption: "Annonce sponsorisée", 
        }
      ]);

      if (error) throw error;

      Alert.alert("Succès !", "Votre annonce a été envoyée avec succès.");
      
      setSelectedMedia([]);
      deleteAudio();
      setPostsThisMonth(prev => prev + 1);

    } catch (error: any) {
      Alert.alert("Erreur de publication", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
    
      <View style={[styles.limitContainer, !canPublish && styles.limitContainerError]}>
        <Ionicons name={canPublish ? "information-circle" : "warning"} size={24} color={canPublish ? "#007AFF" : "#FF3B30"} />
        <Text style={[styles.limitText, !canPublish && styles.limitTextError]}>
          Annonces publiées ce mois-ci : {postsThisMonth} / {MAX_POSTS_PER_MONTH}
          {!canPublish && "\nVous avez atteint votre limite mensuelle."}
        </Text>
      </View>

      
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading || !canPublish}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading || !canPublish}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, recorder.isRecording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={recorder.isRecording ? stopRecording : startRecording} 
          disabled={loading || !canPublish}
        >
          <Ionicons name={recorder.isRecording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{recorder.isRecording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading || !canPublish}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.previewSection}>
        {selectedMedia.length > 0 && (
          <View style={styles.previewContainer}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {recordedAudioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={player?.playing ? "pause" : "play"} size={30} color="#FFF" />
              <Text style={styles.btnPlayText}>Écouter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio}>
              <Ionicons name="trash" size={30} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

    
      <TouchableOpacity 
        style={[styles.btnSendHuge, (loading || !canPublish) ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading || !canPublish}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name={canPublish ? "payment" : "block"} size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>
              {canPublish ? "PAYER & ENVOYER" : "LIMITE ATTEINTE"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  limitContainerError: { backgroundColor: '#FFE5E5' },
  limitText: { color: '#007AFF', fontSize: 15, fontWeight: '600', flex: 1 },
  limitTextError: { color: '#FF3B30' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 50 },
  
  previewContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15,
    marginTop: 10
  },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { width: 80, height: 80, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 15 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
});
*/





















/*
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, ScrollView, Alert, Image } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// ✅ Imports audio alignés sur votre AdminView
import { 
  useAudioPlayer, 
  useAudioPlayerStatus, 
  useAudioRecorder, 
  AudioModule, 
  RecordingPresets, 
  setAudioModeAsync 
} from 'expo-audio';
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

export interface MediaItem {
  uri: string;
  type?: 'image' | 'video' | string;
}

export default function AdvertiserView({ isDark = false }) {
  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  // --- GESTION AUDIO (Identique à AdminView) ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordedAudioUri ? { uri: recordedAudioUri } : null);
  const playerStatus = useAudioPlayerStatus(player);
  
  // Publication et Limites (Spécificité Advertiser)
  const [loading, setLoading] = useState(false);
  const [postsThisMonth, setPostsThisMonth] = useState(0); 
  const MAX_POSTS_PER_MONTH = 5;
  const canPublish = postsThisMonth < MAX_POSTS_PER_MONTH;

  // --- RÉCUPÉRATION DU NOMBRE DE POSTS DU MOIS DEPUIS SUPABASE ---
  useEffect(() => {
    const fetchMonthlyPostCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (error) {
          console.error("Erreur lors du comptage des posts:", error.message);
        } else {
          setPostsThisMonth(count || 0);
        }
      } catch (err) {
        console.log("Erreur inattendue lors de la récupération des posts:", err);
      }
    };

    fetchMonthlyPostCount();
  }, []);

  // --- CAMÉRA (UNIQUEMENT PHOTO) ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], 
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia(prev => [...prev, { uri: asset.uri, type: 'image' }]);
    }
  };

  // --- SÉLECTION GALERIE (UNIQUEMENT PHOTO) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({ uri: asset.uri, type: 'image' }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SÉLECTION FICHIER AUDIO ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- ENREGISTREMENT VOCAL (Logique AdminView appliquée ici) ---
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
      console.error("Erreur lors de l'enregistrement:", err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      
      const uri = recorder.uri;
      if (uri) {
        setRecordedAudioUri(uri);
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  // --- LECTURE VOCAL (Logique AdminView appliquée ici) ---
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
    setRecordedAudioUri(null);
  };

  // --- FONCTION D'UPLOAD UNIFIÉE ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    
    let mimeType = folder === 'medias' ? 'image/jpeg' : 'audio/m4a'; 
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media') 
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- PROCESSUS DE PUBLICATION ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert("Rien à envoyer", "Ajoutez une photo ou un vocal.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté.");

      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = recordedAudioUri ? await uploadFileToSupabase(recordedAudioUri, 'audios') : null;

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          media_urls: uploadedMediaUrls,
          audio_url: uploadedAudioUrl,
          caption: "Annonce sponsorisée", 
        }
      ]);

      if (error) throw error;

      Alert.alert("Succès !", "Votre annonce a été envoyée avec succès.");
      
      setSelectedMedia([]);
      deleteAudio();
      setPostsThisMonth(prev => prev + 1);

    } catch (error: any) {
      Alert.alert("Erreur de publication", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
    
      <View style={[styles.limitContainer, !canPublish && styles.limitContainerError]}>
        <Ionicons name={canPublish ? "information-circle" : "warning"} size={24} color={canPublish ? "#007AFF" : "#FF3B30"} />
        <Text style={[styles.limitText, !canPublish && styles.limitTextError]}>
          Annonces publiées ce mois-ci : {postsThisMonth} / {MAX_POSTS_PER_MONTH}
          {!canPublish && "\nVous avez atteint votre limite mensuelle."}
        </Text>
      </View>

 
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading || !canPublish}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading || !canPublish}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecording ? stopRecording : startRecording} 
          disabled={loading || !canPublish}
        >
          <Ionicons name={isRecording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading || !canPublish}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

    
      <View style={styles.previewSection}>
        {selectedMedia.length > 0 && (
          <View style={styles.previewContainer}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={30} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {recordedAudioUri && (
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
        style={[styles.btnSendHuge, (loading || !canPublish) ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading || !canPublish}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name={canPublish ? "payment" : "block"} size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>
              {canPublish ? "ENVOYER" : "LIMITE ATTEINTE"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 10, paddingTop: 20 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  limitContainerError: { backgroundColor: '#FFE5E5' },
  limitText: { color: '#007AFF', fontSize: 15, fontWeight: '600', flex: 1 },
  limitTextError: { color: '#FF3B30' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 50 },
  
  previewContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 15,
    marginTop: 10
  },
  thumbnailWrapper: { position: 'relative' },
  thumbnail: { width: 80, height: 80, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 15 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 15, borderRadius: 15, marginTop: 10 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 18 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 20, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 10, elevation: 5 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 20, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },
});
*/



















/*
// AdvertiserView.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert,
  Image, ScrollView, SafeAreaView, Modal, Dimensions, PanResponder,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SW, height: SH } = Dimensions.get('window');
const CW = SW - 32, CH = SH * 0.58, MIN = 60, TOUCH = 56;
type Rect = { left: number; top: number; width: number; height: number };

export interface MediaItem {
  uri: string;
  type?: 'image' | string;
}

export default function AdvertiserView({ isDark = false }: { isDark?: boolean }) {
  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [postsThisMonth, setPostsThisMonth] = useState(0); 
  const MAX_POSTS_PER_MONTH = 5;
  const canPublish = postsThisMonth < MAX_POSTS_PER_MONTH;

  // --- CROP & EDIT STATE ---
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

  // --- GESTION AUDIO ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordedAudioUri ? { uri: recordedAudioUri } : { uri: '' });
  const playerStatus = useAudioPlayerStatus(player);
  useEffect(() => { if (recordedAudioUri && player) player.replace({ uri: recordedAudioUri }); }, [recordedAudioUri]);

  // --- RÉCUPÉRATION DU NOMBRE DE POSTS DU MOIS DEPUIS SUPABASE ---
  useEffect(() => {
    const fetchMonthlyPostCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (error) {
          console.error("Erreur lors du comptage des posts:", error.message);
        } else {
          setPostsThisMonth(count || 0);
        }
      } catch (err) {
        console.log("Erreur inattendue lors de la récupération des posts:", err);
      }
    };

    fetchMonthlyPostCount();
  }, []);

  // --- PAN RESPONDER FACTORY (CROPPER) ---
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

  // --- CROP ACTIONS ---
  const openEditor = (idx: number) => {
    const uri = selectedMedia[idx].uri;
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
      setSelectedMedia(p => { const u = [...p]; u[editIdx] = { ...u[editIdx], uri: r.uri }; return u; });
      closeEditor();
    } catch { Alert.alert('Erreur', "Échec du rognage."); closeEditor(); }
  };

  const closeEditor = () => { setEditIdx(null); setEditUri(null); };

  // --- CAMÉRA (UNIQUEMENT PHOTO) ---
  const takeMedia = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], 
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedMedia(prev => [...prev, { uri: asset.uri, type: 'image' }]);
    }
  };

  // --- SÉLECTION GALERIE (UNIQUEMENT PHOTO) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({ uri: asset.uri, type: 'image' }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SÉLECTION FICHIER AUDIO ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- ENREGISTREMENT VOCAL ---
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
      console.error("Erreur lors de l'enregistrement:", err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = recorder.uri;
      if (uri) {
        setRecordedAudioUri(uri);
        player?.replace({ uri });
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  // --- LECTURE VOCAL ---
  const toggleAudioPreview = async () => {
    if (!player) return;
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) {
      player.pause();
    }
    setRecordedAudioUri(null);
  };

  // --- FONCTION D'UPLOAD UNIFIÉE ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    
    let mimeType = folder === 'medias' ? 'image/jpeg' : 'audio/m4a'; 
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media') 
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- PROCESSUS DE PUBLICATION ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert("Rien à envoyer", "Ajoutez une photo ou un vocal.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté.");

      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = recordedAudioUri ? await uploadFileToSupabase(recordedAudioUri, 'audios') : null;

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          media_urls: uploadedMediaUrls,
          audio_url: uploadedAudioUrl,
          caption: "Annonce sponsorisée", 
        }
      ]);

      if (error) throw error;

      Alert.alert("Succès !", "Votre annonce a été envoyée avec succès.");
      
      setSelectedMedia([]);
      deleteAudio();
      setPostsThisMonth(prev => prev + 1);

    } catch (error: any) {
      Alert.alert("Erreur de publication", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Styles utilitaires pour le crop
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
     
      <Modal visible={editIdx !== null} animationType="fade" onRequestClose={closeEditor}>
        <SafeAreaView style={styles.editor}>
          <View style={styles.editorHead}>
            <TouchableOpacity onPress={closeEditor}><Ionicons name="close" size={26} color="#FFF" /></TouchableOpacity>
            <Text style={styles.editorTitle}>Recadrer l'annonce</Text>
            <TouchableOpacity onPress={applyCrop} style={styles.saveBtn}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.saveTxt}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewZone}>
            <View style={styles.zoomBadge}><Text style={styles.zoomTxt}>{zoom.toFixed(1)}x</Text></View>

            <View style={[styles.imgBox, { width: dispSize.width, height: dispSize.height }]}>
              <View style={[styles.clipLayer, { width: dispSize.width, height: dispSize.height }]}>
                {editUri && (
                  <Image 
                    key={editUri} 
                    source={{ uri: editUri }} 
                    style={[styles.editorImg, { width: dispSize.width, height: dispSize.height, transform: [{ scale: zoom }] }]} 
                    resizeMode="contain" 
                  />
                )}
                
                <View style={[styles.mask, { top: 0, left: 0, width: dispSize.width, height: crop.top }]} pointerEvents="none" />
                <View style={[styles.mask, { top: crop.top + crop.height, left: 0, width: dispSize.width, height: dispSize.height - (crop.top + crop.height) }]} pointerEvents="none" />
                <View style={[styles.mask, { top: crop.top, left: 0, width: crop.left, height: crop.height }]} pointerEvents="none" />
                <View style={[styles.mask, { top: crop.top, left: crop.left + crop.width, width: dispSize.width - (crop.left + crop.width), height: crop.height }]} pointerEvents="none" />
              </View>

              <View style={[styles.cropBox, { left: crop.left, top: crop.top, width: crop.width, height: crop.height }]} pointerEvents="box-none">
                <View style={{ flex: 1 }} {...panCenter.panHandlers}>
                  <View style={[styles.gridH, { top: '33.33%' }]} pointerEvents="none" />
                  <View style={[styles.gridH, { top: '66.66%' }]} pointerEvents="none" />
                  <View style={[styles.gridV, { left: '33.33%' }]} pointerEvents="none" />
                  <View style={[styles.gridV, { left: '66.66%' }]} pointerEvents="none" />
                </View>
                {(['TL', 'TR', 'BL', 'BR'] as const).map(c => (
                  <View key={c} style={cornerStyle(c)} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }} {...({ TL: panTL, TR: panTR, BL: panBL, BR: panBR }[c]).panHandlers}>
                    <View style={shapeStyle(c)} pointerEvents="none" />
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.hint}>• Glissez les coins pour rogner{'\n'}• Centre pour déplacer | 2 doigts pour zoomer</Text>
          </View>

          <View style={styles.toolbar}>
            {[
              { icon: 'scan-outline', label: 'Reset', fn: resetCrop },
              { icon: 'refresh-outline', label: 'Pivoter', fn: rotate },
              { icon: 'swap-horizontal-outline', label: 'Miroir', fn: flip },
            ].map(t => (
              <TouchableOpacity key={t.label} onPress={t.fn} style={styles.tool}>
                <Ionicons name={t.icon as any} size={22} color="#FFF" />
                <Text style={styles.toolTxt}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

    
      <View style={[styles.limitContainer, !canPublish && styles.limitContainerError]}>
        <Ionicons name={canPublish ? "information-circle" : "warning"} size={24} color={canPublish ? "#007AFF" : "#FF3B30"} />
        <Text style={[styles.limitText, !canPublish && styles.limitTextError]}>
          Annonces publiées ce mois-ci : {postsThisMonth} / {MAX_POSTS_PER_MONTH}
          {!canPublish && "\nVous avez atteint votre limite mensuelle."}
        </Text>
      </View>

      
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={takeMedia} disabled={loading || !canPublish}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading || !canPublish}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecording ? stopRecording : startRecording} 
          disabled={loading || !canPublish}
        >
          <Ionicons name={isRecording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading || !canPublish}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

    
      <View style={styles.previewSection}>
        {selectedMedia.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 5 }}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.editBadge} onPress={() => openEditor(index)}>
                  <Ionicons name="pencil" size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {recordedAudioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio}>
              <Ionicons name="trash" size={26} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

  
      <TouchableOpacity 
        style={[styles.btnSendHuge, (loading || !canPublish) ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading || !canPublish}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name={canPublish ? "payment" : "block"} size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>
              {canPublish ? "ENVOYER" : "LIMITE ATTEINTE"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  limitContainerError: { backgroundColor: '#FFE5E5' },
  limitText: { color: '#007AFF', fontSize: 15, fontWeight: '600', flex: 1 },
  limitTextError: { color: '#FF3B30' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 60 },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 110, borderRadius: 14 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },

  // Editor Modal Styles
  editor: { flex: 1, backgroundColor: '#0B0B0C' },
  editorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  editorTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 4 },
  saveTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  previewZone: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  zoomBadge: { position: 'absolute', top: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', zIndex: 30 },
  zoomTxt: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  imgBox: { position: 'relative', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  clipLayer: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  editorImg: { position: 'absolute' },
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













// AdvertiserView.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert,
  Image, ScrollView, SafeAreaView, Modal, Dimensions, PanResponder,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat, FlipType } from 'expo-image-manipulator';

const { width: SW, height: SH } = Dimensions.get('window');
const CW = SW - 32, CH = SH * 0.58, MIN = 60, TOUCH = 56;
type Rect = { left: number; top: number; width: number; height: number };

export interface MediaItem {
  uri: string;
  type?: 'image' | string;
}

export default function AdvertiserView({ isDark = false }: { isDark?: boolean }) {
  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [postsThisMonth, setPostsThisMonth] = useState(0); 
  const MAX_POSTS_PER_MONTH = 5;
  const canPublish = postsThisMonth < MAX_POSTS_PER_MONTH;

  // --- CROP & EDIT STATE ---
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

  // --- CAMERA STATE (Intégrée - Photo Uniquement) ---
  const [camOn, setCamOn] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const camRef = useRef<CameraView>(null);
  const [camPerm, reqCam] = useCameraPermissions();

  // --- GESTION AUDIO ---
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordedAudioUri ? { uri: recordedAudioUri } : { uri: '' });
  const playerStatus = useAudioPlayerStatus(player);
  useEffect(() => { if (recordedAudioUri && player) player.replace({ uri: recordedAudioUri }); }, [recordedAudioUri]);

  // --- RÉCUPÉRATION DU NOMBRE DE POSTS DU MOIS DEPUIS SUPABASE ---
  useEffect(() => {
    const fetchMonthlyPostCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        const { count, error } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', startOfMonth)
          .lte('created_at', endOfMonth);

        if (!error) {
          setPostsThisMonth(count || 0);
        }
      } catch (err) {
        console.log("Erreur récupération posts:", err);
      }
    };
    fetchMonthlyPostCount();
  }, []);

  // --- PAN RESPONDER FACTORY (CROPPER) ---
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

  // --- CROP ACTIONS ---
  const openEditor = (idx: number) => {
    const uri = selectedMedia[idx].uri;
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
      setSelectedMedia(p => { const u = [...p]; u[editIdx] = { ...u[editIdx], uri: r.uri }; return u; });
      closeEditor();
    } catch { Alert.alert('Erreur', "Échec du rognage."); closeEditor(); }
  };

  const closeEditor = () => { setEditIdx(null); setEditUri(null); };

  // --- CAMÉRA INTÉGRÉE (PHOTO) ---
  const openCamera = async () => {
    let cp = camPerm;
    if (!cp?.granted) cp = await reqCam();
    if (cp?.granted) {
      setCamOn(true);
    } else {
      Alert.alert('Permission', 'Accès à la caméra refusé.');
    }
  };

  const takePicture = async () => {
    if (camRef.current) {
      try {
        const photo = await camRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
        if (photo) {
          setCamOn(false);
          setSelectedMedia(prev => [...prev, { uri: photo.uri, type: 'image' }]);
        }
      } catch (error) {
        Alert.alert('Erreur', 'Impossible de prendre la photo.');
      }
    }
  };

  // --- SÉLECTION GALERIE (PHOTOS) ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map(asset => ({ uri: asset.uri, type: 'image' }));
      setSelectedMedia(prev => [...prev, ...newMedia]);
    }
  };

  const removeMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // --- SÉLECTION FICHIER AUDIO ---
  const pickAudioFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
      if (!result.canceled && result.assets.length > 0) {
        await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
        setRecordedAudioUri(result.assets[0].uri);
      }
    } catch (err) {
      console.log('Erreur sélection audio', err);
    }
  };

  // --- ENREGISTREMENT VOCAL ---
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
      console.error("Erreur enregistrement:", err);
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      
      const uri = recorder.uri;
      if (uri) {
        setRecordedAudioUri(uri);
        player?.replace({ uri });
      }
    } catch (err) {
      console.error('Erreur arrêt enregistrement', err);
    }
  };

  // --- LECTURE VOCAL ---
  const toggleAudioPreview = async () => {
    if (!player) return;
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  const deleteAudio = () => {
    if (player && playerStatus.playing) {
      player.pause();
    }
    setRecordedAudioUri(null);
  };

  // --- UPLOAD SUPABASE ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    
    let mimeType = folder === 'medias' ? 'image/jpeg' : 'audio/m4a'; 
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media') 
      .upload(fileName, arrayBuffer, { contentType: mimeType, upsert: false });
    
    if (error) throw new Error(`Erreur Storage: ${error.message}`);
    
    const { data } = supabase.storage.from('ganbanaaxu-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  // --- PROCESSUS DE PUBLICATION ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !recordedAudioUri) {
      Alert.alert("Rien à envoyer", "Ajoutez une photo ou un vocal.");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Vous devez être connecté.");

      const uploadedMediaUrls = await Promise.all(selectedMedia.map(item => uploadFileToSupabase(item.uri, 'medias')));
      let uploadedAudioUrl = recordedAudioUri ? await uploadFileToSupabase(recordedAudioUri, 'audios') : null;

      const { error } = await supabase.from('posts').insert([
        {
          user_id: user.id,
          media_urls: uploadedMediaUrls,
          audio_url: uploadedAudioUrl,
          caption: "Annonce sponsorisée", 
        }
      ]);

      if (error) throw error;

      Alert.alert("Succès !", "Votre annonce a été envoyée avec succès.");
      
      setSelectedMedia([]);
      deleteAudio();
      setPostsThisMonth(prev => prev + 1);

    } catch (error: any) {
      Alert.alert("Erreur de publication", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Styles utilitaires pour le crop
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
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      
      {/* ══ CAMÉRA INTÉGRÉE (PHOTO) ══ */}
      <Modal visible={camOn} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setCamOn(false)}>
        <SafeAreaView style={styles.camContainer}>
          <View style={{ flex: 1, position: 'relative' }}>
            <CameraView ref={camRef} style={{ flex: 1 }} facing={facing} mode="picture" />
            <View style={styles.camOverlay}>
              <View style={styles.camTop}>
                <TouchableOpacity onPress={() => setCamOn(false)} style={styles.iconBtn}>
                  <Ionicons name="close" size={32} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.camTitle}>Prendre une photo</Text>
                <View style={{ width: 32 }} />
              </View>
              <View style={styles.camBottom}>
                <View style={{ width: 50 }} />
                <TouchableOpacity style={styles.shutter} onPress={takePicture} />
                <TouchableOpacity onPress={() => setFacing(p => p === 'back' ? 'front' : 'back')} style={styles.iconBtn}>
                  <Ionicons name="camera-reverse" size={32} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ══ CROP EDITOR MODAL ══ */}
      <Modal visible={editIdx !== null} animationType="fade" onRequestClose={closeEditor}>
        <SafeAreaView style={styles.editor}>
          <View style={styles.editorHead}>
            <TouchableOpacity onPress={closeEditor}><Ionicons name="close" size={26} color="#FFF" /></TouchableOpacity>
            <Text style={styles.editorTitle}>Recadrer l'annonce</Text>
            <TouchableOpacity onPress={applyCrop} style={styles.saveBtn}>
              <Ionicons name="checkmark" size={20} color="#FFF" />
              <Text style={styles.saveTxt}>Appliquer</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewZone}>
            <View style={styles.zoomBadge}><Text style={styles.zoomTxt}>{zoom.toFixed(1)}x</Text></View>

            <View style={[styles.imgBox, { width: dispSize.width, height: dispSize.height }]}>
              <View style={[styles.clipLayer, { width: dispSize.width, height: dispSize.height }]}>
                {editUri && (
                  <Image 
                    key={editUri} 
                    source={{ uri: editUri }} 
                    style={[styles.editorImg, { width: dispSize.width, height: dispSize.height, transform: [{ scale: zoom }] }]} 
                    resizeMode="contain" 
                  />
                )}
                
                <View style={[styles.mask, { top: 0, left: 0, width: dispSize.width, height: crop.top }]} pointerEvents="none" />
                <View style={[styles.mask, { top: crop.top + crop.height, left: 0, width: dispSize.width, height: dispSize.height - (crop.top + crop.height) }]} pointerEvents="none" />
                <View style={[styles.mask, { top: crop.top, left: 0, width: crop.left, height: crop.height }]} pointerEvents="none" />
                <View style={[styles.mask, { top: crop.top, left: crop.left + crop.width, width: dispSize.width - (crop.left + crop.width), height: crop.height }]} pointerEvents="none" />
              </View>

              <View style={[styles.cropBox, { left: crop.left, top: crop.top, width: crop.width, height: crop.height }]} pointerEvents="box-none">
                <View style={{ flex: 1 }} {...panCenter.panHandlers}>
                  <View style={[styles.gridH, { top: '33.33%' }]} pointerEvents="none" />
                  <View style={[styles.gridH, { top: '66.66%' }]} pointerEvents="none" />
                  <View style={[styles.gridV, { left: '33.33%' }]} pointerEvents="none" />
                  <View style={[styles.gridV, { left: '66.66%' }]} pointerEvents="none" />
                </View>
                {(['TL', 'TR', 'BL', 'BR'] as const).map(c => (
                  <View key={c} style={cornerStyle(c)} hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }} {...({ TL: panTL, TR: panTR, BL: panBL, BR: panBR }[c]).panHandlers}>
                    <View style={shapeStyle(c)} pointerEvents="none" />
                  </View>
                ))}
              </View>
            </View>

            <Text style={styles.hint}>• Glissez les coins pour rogner{'\n'}• Centre pour déplacer | 2 doigts pour zoomer</Text>
          </View>

          <View style={styles.toolbar}>
            {[
              { icon: 'scan-outline', label: 'Reset', fn: resetCrop },
              { icon: 'refresh-outline', label: 'Pivoter', fn: rotate },
              { icon: 'swap-horizontal-outline', label: 'Miroir', fn: flip },
            ].map(t => (
              <TouchableOpacity key={t.label} onPress={t.fn} style={styles.tool}>
                <Ionicons name={t.icon as any} size={22} color="#FFF" />
                <Text style={styles.toolTxt}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>

      {/* BANNIÈRE DE LIMITE */}
      <View style={[styles.limitContainer, !canPublish && styles.limitContainerError]}>
        <Ionicons name={canPublish ? "information-circle" : "warning"} size={24} color={canPublish ? "#007AFF" : "#FF3B30"} />
        <Text style={[styles.limitText, !canPublish && styles.limitTextError]}>
          Annonces publiées ce mois-ci : {postsThisMonth} / {MAX_POSTS_PER_MONTH}
          {!canPublish && "\nVous avez atteint votre limite mensuelle."}
        </Text>
      </View>

      {/* BOUTONS */}
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#FF9500' }]} onPress={openCamera} disabled={loading || !canPublish}>
          <Ionicons name="camera" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#007AFF' }]} onPress={pickMedia} disabled={loading || !canPublish}>
          <Ionicons name="images" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Galerie</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.bigButton, isRecording ? { backgroundColor: '#000' } : { backgroundColor: '#FF3B30' }]} 
          onPress={isRecording ? stopRecording : startRecording} 
          disabled={loading || !canPublish}
        >
          <Ionicons name={isRecording ? "stop-circle" : "mic"} size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>{isRecording ? "Arrêter" : "Parler"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.bigButton, { backgroundColor: '#AF52DE' }]} onPress={pickAudioFile} disabled={loading || !canPublish}>
          <Ionicons name="musical-notes" size={40} color="#FFF" />
          <Text style={styles.bigButtonText}>Audio</Text>
        </TouchableOpacity>
      </View>

      {/* ZONE DE VISUALISATION */}
      <View style={styles.previewSection}>
        {selectedMedia.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 5 }}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.editBadge} onPress={() => openEditor(index)}>
                  <Ionicons name="pencil" size={16} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={26} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {recordedAudioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={playerStatus.playing ? "pause" : "play"} size={28} color="#FFF" />
              <Text style={styles.btnPlayText}>{playerStatus.playing ? "Pause" : "Écouter"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio}>
              <Ionicons name="trash" size={26} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* BOUTON ENVOYER */}
      <TouchableOpacity 
        style={[styles.btnSendHuge, (loading || !canPublish) ? styles.disabledBtn : null]} 
        onPress={handlePublishProcess} 
        disabled={loading || !canPublish}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name={canPublish ? "payment" : "block"} size={32} color="#FFF" />
            <Text style={styles.btnSendHugeText}>
              {canPublish ? "ENVOYER" : "LIMITE ATTEINTE"}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 30, paddingHorizontal: 12, paddingTop: 20 },
  limitContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5F1FF', padding: 15, borderRadius: 12, marginBottom: 20, gap: 10 },
  limitContainerError: { backgroundColor: '#FFE5E5' },
  limitText: { color: '#007AFF', fontSize: 15, fontWeight: '600', flex: 1 },
  limitTextError: { color: '#FF3B30' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10, marginBottom: 20 },
  bigButton: { width: '48%', aspectRatio: 1, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 3, padding: 10 },
  bigButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  
  previewSection: { marginBottom: 20, minHeight: 60 },
  thumbnailWrapper: { marginRight: 15, position: 'relative' },
  thumbnail: { width: 110, height: 110, borderRadius: 14 },
  editBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: '#007AFF', padding: 6, borderRadius: 12 },
  removeBadge: { position: 'absolute', top: -8, right: -8, backgroundColor: '#FFF', borderRadius: 14 },

  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E5E5EA', padding: 14, borderRadius: 16, marginTop: 12 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#34C759', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  btnPlayText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  
  btnSendHuge: { flexDirection: 'row', backgroundColor: '#BF5AF2', padding: 18, borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12, elevation: 4 },
  btnSendHugeText: { color: '#FFF', fontWeight: '900', fontSize: 22, letterSpacing: 1 },
  disabledBtn: { opacity: 0.5 },

  // Camera Styles
  camContainer: { flex: 1, backgroundColor: '#000' },
  camOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', zIndex: 10, padding: 20 },
  camTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 30 },
  camTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  camBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 30 },
  iconBtn: { padding: 10, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 30 },
  shutter: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 5, borderColor: 'rgba(255,255,255,0.5)' },

  // Editor Modal Styles
  editor: { flex: 1, backgroundColor: '#0B0B0C' },
  editorHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderColor: '#2C2C2E' },
  editorTitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#34C759', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, gap: 4 },
  saveTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  previewZone: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  zoomBadge: { position: 'absolute', top: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', zIndex: 30 },
  zoomTxt: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  imgBox: { position: 'relative', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  clipLayer: { position: 'absolute', top: 0, left: 0, overflow: 'hidden' },
  editorImg: { position: 'absolute' },
  mask: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.65)', zIndex: 10 },
  cropBox: { position: 'absolute', borderColor: 'rgba(255,255,255,0.9)', borderWidth: 1, zIndex: 20 },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  hint: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 14, textAlign: 'center', lineHeight: 18 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 0.5, borderColor: '#2C2C2E', backgroundColor: '#0B0B0C' },
  tool: { alignItems: 'center', gap: 6, minWidth: 70 },
  toolTxt: { color: '#8E8E93', fontSize: 12, fontWeight: '500' },
});












