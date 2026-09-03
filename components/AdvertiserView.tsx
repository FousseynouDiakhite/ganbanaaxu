
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

      {/* ZONE DE VISUALISATION */}
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