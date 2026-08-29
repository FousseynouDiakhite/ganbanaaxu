



/*
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ========== TYPES ==========
interface MediaItem {
  uri: string;
  type: 'image' | 'video' | 'audio';
  name?: string;
}

interface AdminViewProps {
  isDark: boolean;
  selectedMedia: MediaItem[];
  recordedAudioUri: string | null;
  isRecording: boolean;
  isPlayingAudio: boolean;
  loading: boolean;
  pickMedia: () => void;
  pickAudio: () => void;
  setSelectedMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  setRecordedAudioUri: (uri: string | null) => void;
  setIsPlayingAudio: (play: boolean) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleAudioPreview: () => void;
  handlePublishProcess: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ========== THEME COLORS ==========
const getColors = (isDark: boolean) => ({
  background: isDark ? '#121212' : '#F8F9FA',
  card: isDark ? '#1E1E1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#1C1E21',
  textSecondary: isDark ? '#A0A0A0' : '#6C757D',
  textTertiary: isDark ? '#8E8E93' : '#9E9E9E',
  primary: isDark ? '#BB86FC' : '#6A5ACD',
  primaryLight: isDark ? '#D0BCFF' : '#9E7DFF',
  success: '#34C759',
  successLight: 'rgba(52, 199, 89, 0.1)',
  error: '#FF3B30',
  warning: '#FF9500',
  border: isDark ? '#333333' : '#E0E0E0',
  surface: isDark ? '#2D2D2D' : '#F0F2F5',
});

// ========== MAIN COMPONENT ==========
export default function AdminView({
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
}: AdminViewProps) {
  const colors = getColors(isDark);

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeAudio = () => {
    setRecordedAudioUri(null);
    setIsPlayingAudio(false);
  };

  const getFileName = (uri: string) => {
    return uri.split('/').pop()?.split('?')[0] || 'Fichier';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'audio': return 'musical-notes';
      default: return 'image';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      
      <View style={[styles.card, styles.adminCard, { backgroundColor: colors.successLight }]}>
        <View style={[styles.adminBadge, { backgroundColor: colors.success }]}>
          <MaterialIcons name="verified-user" size={18} color="#FFFFFF" />
        </View>
        <View style={styles.adminInfo}>
          <Text style={[styles.adminTitle, { color: colors.text }]}>
            Mode Administration
          </Text>
          <Text style={[styles.adminSubtitle, { color: colors.textSecondary }]}>
            Vos publications sont approuvées automatiquement sans frais.
          </Text>
        </View>
      </View>

      
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="photo-library" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Médias à publier
          </Text>
          {selectedMedia.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{selectedMedia.length}</Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={pickMedia}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add-photo-alternate" size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Ajouter des images/vidéos</Text>
          </TouchableOpacity>
        </View>

        {selectedMedia.length > 0 && (
          <View style={styles.mediaList}>
            {selectedMedia.map((item, index) => (
              <View
                key={`${item.uri}-${index}`}
                style={[styles.mediaItem, { borderBottomColor: colors.border }]}
              >
                <Ionicons
                  name={getFileIcon(item.type)}
                  size={20}
                  color={colors.primary}
                />
                <Text
                  style={[styles.mediaItemText, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getFileName(item.uri)}
                </Text>
                <TouchableOpacity
                  onPress={() => removeMedia(index)}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <Ionicons name="close-circle" size={22} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="mic" size={20} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Enregistreur vocal
          </Text>
          {recordedAudioUri && (
            <View style={[styles.badge, { backgroundColor: colors.warning }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.recordButton,
            {
              backgroundColor: isRecording ? colors.error : colors.primary,
              borderColor: isRecording ? colors.error : colors.primary,
            }
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.8}
        >
          {isRecording ? (
            <>
              <Ionicons name="stop" size={24} color="#FFFFFF" />
              <Text style={styles.recordButtonText}>Arrêter</Text>
            </>
          ) : (
            <>
              <Ionicons name="mic" size={24} color="#FFFFFF" />
              <Text style={styles.recordButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>

        {recordedAudioUri && (
          <View style={[styles.audioPreview, { backgroundColor: colors.surface }]}>
            <View style={styles.audioInfo}>
              <Ionicons name="musical-notes" size={18} color={colors.primary} />
              <Text style={[styles.audioText, { color: colors.text }]}>
                Enregistrement disponible
              </Text>
            </View>
            <View style={styles.audioActions}>
              <TouchableOpacity
                style={[styles.audioActionButton, { backgroundColor: colors.primary }]}
                onPress={toggleAudioPreview}
              >
                <Ionicons
                  name={isPlayingAudio ? "pause" : "play"}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.audioActionText}>
                  {isPlayingAudio ? 'Pause' : 'Écouter'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={removeAudio}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="trash" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      
      <TouchableOpacity
        style={[
          styles.publishButton,
          {
            backgroundColor: selectedMedia.length > 0 || recordedAudioUri
              ? colors.primary
              : colors.border,
          }
        ]}
        onPress={handlePublishProcess}
        disabled={loading || (selectedMedia.length === 0 && !recordedAudioUri)}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons name="cloud-upload" size={20} color="#FFFFFF" />
            <Text style={styles.publishButtonText}>
              Publier maintenant
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  adminBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminInfo: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  adminSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionButtons: {
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  mediaList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: 8,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  mediaItemText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  audioText: {
    fontSize: 14,
  },
  audioActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  audioActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
*/














/*
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

// ========== TYPES ==========
interface MediaItem {
  uri: string;
  type: 'image' | 'video' | 'audio';
  name?: string;
}

interface AdminViewProps {
  isDark: boolean;
  selectedMedia: MediaItem[];
  recordedAudioUri: string | null;
  isRecording: boolean;
  isPlayingAudio: boolean;
  loading: boolean;
  pickMedia: () => void;
  pickAudio: () => void;
  setSelectedMedia: React.Dispatch<React.SetStateAction<MediaItem[]>>;
  setRecordedAudioUri: (uri: string | null) => void;
  setIsPlayingAudio: (play: boolean) => void;
  startRecording: () => void;
  stopRecording: () => void;
  toggleAudioPreview: () => void;
  handlePublishProcess: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ========== THEME COLORS (Modernisé) ==========
const getColors = (isDark: boolean) => ({
  background: isDark ? '#000000' : '#FFFFFF',
  card: isDark ? '#1C1C1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#000000',
  textSecondary: isDark ? '#AEAEB2' : '#8E8E93',
  textTertiary: isDark ? '#8E8E93' : '#AEAEB2',
  primary: isDark ? '#007AFF' : '#007AFF', // Bleu iOS moderne
  primaryLight: isDark ? '#0056CC' : '#0056CC',
  success: '#34C759',
  successLight: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
  error: '#FF3B30',
  warning: '#FF9500',
  border: isDark ? '#38383A' : '#E5E5EA',
  surface: isDark ? '#2C2C2E' : '#F2F2F7',
  elevation: isDark ? '#1C1C1E' : '#FFFFFF',
});

// ========== MAIN COMPONENT ==========
export default function AdminView({
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
}: AdminViewProps) {
  const colors = getColors(isDark);

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeAudio = () => {
    setRecordedAudioUri(null);
    setIsPlayingAudio(false);
  };

  const getFileName = (uri: string) => {
    return uri.split('/').pop()?.split('?')[0] || 'Fichier';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-notes-outline';
      default: return 'image-outline';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
    
      <View style={[styles.adminCard, {
        backgroundColor: colors.surface,
        borderColor: colors.primary,
        shadowColor: colors.primary,
      }]}>
        <View style={[styles.adminIconContainer, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="admin-panel-settings" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.adminTextContainer}>
          <Text style={[styles.adminTitle, { color: colors.text }]}>
            Mode Administrateur
          </Text>
          <Text style={[styles.adminSubtitle, { color: colors.textSecondary }]}>
            Publiez sans validation • Accès complet
          </Text>
        </View>
      </View>

  
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="images-outline" size={22} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Médias à publier
          </Text>
          {selectedMedia.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{selectedMedia.length}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={pickMedia}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>
            Ajouter des images/vidéos
          </Text>
        </TouchableOpacity>

        {selectedMedia.length > 0 && (
          <View style={[styles.mediaContainer, { borderTopColor: colors.border }]}>
            {selectedMedia.map((item, index) => (
              <View
                key={`${item.uri}-${index}`}
                style={[styles.mediaItem, {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                }]}
              >
                <Ionicons
                  name={getFileIcon(item.type) as any}
                  size={22}
                  color={colors.primary}
                />
                <Text
                  style={[styles.mediaText, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {getFileName(item.uri)}
                </Text>
                <TouchableOpacity
                  onPress={() => removeMedia(index)}
                  hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

    
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="mic-circle-outline" size={22} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Enregistreur vocal
          </Text>
          {recordedAudioUri && (
            <View style={[styles.badge, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.recordButton,
            {
              backgroundColor: isRecording ? colors.error : colors.primary,
              shadowColor: isRecording ? colors.error : colors.primary,
            }
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.85}
        >
          {isRecording ? (
            <Ionicons name="stop-circle" size={32} color="#FFFFFF" />
          ) : (
            <Ionicons name="mic" size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        {recordedAudioUri && (
          <View style={[styles.audioPreview, { backgroundColor: colors.surface }]}>
            <View style={styles.audioInfo}>
              <Ionicons name="waveform" size={20} color={colors.primary} />
              <Text style={[styles.audioText, { color: colors.text }]}>
                Enregistrement prêt
              </Text>
            </View>
            <View style={styles.audioActions}>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: colors.primary }]}
                onPress={toggleAudioPreview}
              >
                <Ionicons
                  name={isPlayingAudio ? "pause" : "play"}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={removeAudio}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

   
      <TouchableOpacity
        style={[
          styles.publishButton,
          {
            backgroundColor: (selectedMedia.length > 0 || recordedAudioUri)
              ? colors.primary
              : colors.border,
            shadowColor: colors.primary,
          }
        ]}
        onPress={handlePublishProcess}
        disabled={loading || (selectedMedia.length === 0 && !recordedAudioUri)}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
            <Text style={styles.publishButtonText}>
              Publier maintenant
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ========== STYLES (Repensés) ==========
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Admin Card
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  adminIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  adminTextContainer: {
    flex: 1,
  },
  adminTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  adminSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  // Generic Card
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // Add Button
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Media
  mediaContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
  },
  mediaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  mediaText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
  deleteButton: {
    padding: 4,
  },
  // Record Button
  recordButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    marginBottom: 16,
    alignSelf: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  // Audio Preview
  audioPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  audioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  audioText: {
    fontSize: 14,
    fontWeight: '500',
  },
  audioActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Publish Button
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  publishButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
*/












/*

import React, { useState, useEffect, ComponentProps } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';

// 👇 Importez votre client Supabase configuré (Ajustez le chemin si nécessaire)
import { supabase } from '../lib/supabase'; 

// ========== TYPES ==========
type IoniconsName = ComponentProps<typeof Ionicons>['name'];

interface MediaItem {
  uri: string;
  type: 'image' | 'video' | 'audio';
  name?: string;
  mimeType?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ========== THEME COLORS ==========
const getColors = (isDark: boolean) => ({
  background: isDark ? '#000000' : '#FFFFFF',
  card: isDark ? '#1C1C1E' : '#FFFFFF',
  text: isDark ? '#FFFFFF' : '#000000',
  textSecondary: isDark ? '#AEAEB2' : '#8E8E93',
  textTertiary: isDark ? '#8E8E93' : '#AEAEB2',
  primary: isDark ? '#007AFF' : '#007AFF',
  primaryLight: isDark ? '#0056CC' : '#0056CC',
  success: '#34C759',
  successLight: isDark ? 'rgba(52, 199, 89, 0.15)' : 'rgba(52, 199, 89, 0.1)',
  error: '#FF3B30',
  warning: '#FF9500',
  border: isDark ? '#38383A' : '#E5E5EA',
  surface: isDark ? '#2C2C2E' : '#F2F2F7',
  elevation: isDark ? '#1C1C1E' : '#FFFFFF',
});

// ========== COMPOSANT PRINCIPAL ==========
export default function AdminView({ isDark = false }: { isDark?: boolean }) {
  const colors = getColors(isDark);

  // --- ÉTATS ---
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [recordedAudioUri, setRecordedAudioUri] = useState<string | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  
  const [loading, setLoading] = useState(false);

  // Nettoyage audio au démontage
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // --- HANDLERS ---

  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };

  const removeAudio = async () => {
    setRecordedAudioUri(null);
    setIsPlayingAudio(false);
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const getFileName = (uri: string) => {
    return uri.split('/').pop()?.split('?')[0] || 'Fichier';
  };

  const getFileIcon = (type: string): IoniconsName => {
    switch (type) {
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-notes-outline';
      default: return 'image-outline';
    }
  };

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Accès aux photos nécessaire.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newMedia = result.assets.map((asset) => ({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
        name: asset.fileName || getFileName(asset.uri),
        mimeType: asset.mimeType,
      })) as MediaItem[];
      setSelectedMedia((prev) => [...prev, ...newMedia]);
    }
  };

  const pickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        setRecordedAudioUri(result.assets[0].uri);
        if (sound) {
          await sound.unloadAsync();
          setSound(null);
        }
      }
    } catch (error) {
      console.error('Erreur sélection audio:', error);
    }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return;

      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Erreur enregistrement:', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

      setRecordedAudioUri(recording.getURI());
      setRecording(null);
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
    } catch (error) {
      console.error('Erreur arrêt enregistrement:', error);
    }
  };

  const toggleAudioPreview = async () => {
    if (!recordedAudioUri) return;
    try {
      if (isPlayingAudio && sound) {
        await sound.pauseAsync();
        setIsPlayingAudio(false);
        return;
      }
      if (sound) {
        await sound.playAsync();
        setIsPlayingAudio(true);
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: recordedAudioUri },
          { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlayingAudio(true);
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingAudio(false);
          }
        });
      }
    } catch (error) {
      console.error('Erreur lecture audio', error);
    }
  };

  // 🚀 LOGIQUE D'UPLOAD SUPABASE
  const uploadFileToSupabase = async (uri: string, folder: string) => {
    try {
      // 1. Convertir l'URI local en Blob pour l'upload
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // 2. Créer un nom de fichier unique
      const fileExt = uri.split('.').pop() || 'bin';
      const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      // 3. Upload dans le bucket 'publications' (⚠️ Assurez-vous que ce bucket existe)
      const { data, error } = await supabase.storage
        .from('ganbanaaxu-media') 
        .upload(fileName, blob, {
          contentType: blob.type,
        });

      if (error) throw error;

      // 4. Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('ganbanaaxu-media')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Erreur d'upload :", error);
      throw error;
    }
  };

  const handlePublishProcess = async () => {
    setLoading(true);
    try {
      const uploadedMediaUrls = [];
      let uploadedAudioUrl = null;

      // 1. Upload des images/vidéos
      for (const media of selectedMedia) {
        const url = await uploadFileToSupabase(media.uri, 'medias');
        uploadedMediaUrls.push(url);
      }

      // 2. Upload de l'audio (si existant)
      if (recordedAudioUri) {
        uploadedAudioUrl = await uploadFileToSupabase(recordedAudioUri, 'audios');
      }

      // 3. Enregistrement dans la base de données (Table 'posts' par exemple)
      // À adapter selon la structure de votre base de données Supabase
      const { error: dbError } = await supabase
        .from('posts')
        .insert([
          {
            media_urls: uploadedMediaUrls, // Colonne type array ou JSONB
            audio_url: uploadedAudioUrl,
            created_at: new Date(),
            // author_id: user.id // Si vous gérez l'authentification
          }
        ]);

      if (dbError) throw dbError;

      Alert.alert('Succès', 'Le contenu a été publié avec succès !');
      
      // 4. Réinitialisation du formulaire
      setSelectedMedia([]);
      removeAudio();

    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Échec de la publication.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- RENDU UI ---
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
     
      <View style={[styles.adminCard, { backgroundColor: colors.surface, borderColor: colors.primary, shadowColor: colors.primary }]}>
        <View style={[styles.adminIconContainer, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="admin-panel-settings" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.adminTextContainer}>
          <Text style={[styles.adminTitle, { color: colors.text }]}>Mode Administrateur</Text>
          <Text style={[styles.adminSubtitle, { color: colors.textSecondary }]}>Publiez sans validation • Accès complet</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="images-outline" size={22} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Médias à publier</Text>
          {selectedMedia.length > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{selectedMedia.length}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={pickMedia}
          activeOpacity={0.7}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
          <Text style={[styles.addButtonText, { color: colors.primary }]}>Ajouter des images/vidéos</Text>
        </TouchableOpacity>

        {selectedMedia.length > 0 && (
          <View style={[styles.mediaContainer, { borderTopColor: colors.border }]}>
            {selectedMedia.map((item, index) => (
              <View key={`${item.uri}-${index}`} style={[styles.mediaItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name={getFileIcon(item.type)} size={22} color={colors.primary} />
                <Text style={[styles.mediaText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                  {getFileName(item.uri)}
                </Text>
                <TouchableOpacity onPress={() => removeMedia(index)} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="mic-circle-outline" size={22} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>Enregistreur vocal</Text>
          {recordedAudioUri && (
            <View style={[styles.badge, { backgroundColor: colors.success }]}>
              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: isRecording ? colors.error : colors.primary, shadowColor: isRecording ? colors.error : colors.primary }]}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.85}
        >
          {isRecording ? <Ionicons name="stop-circle" size={32} color="#FFFFFF" /> : <Ionicons name="mic" size={32} color="#FFFFFF" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={pickAudio}
          activeOpacity={0.7}
        >
          <Ionicons name="document-attach-outline" size={18} color={colors.primary} />
          <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Importer un fichier audio</Text>
        </TouchableOpacity>

        {recordedAudioUri && (
          <View style={[styles.audioPreview, { backgroundColor: colors.surface }]}>
            <View style={styles.audioInfo}>
              <Ionicons name="pulse" size={20} color={colors.primary} />
              <Text style={[styles.audioText, { color: colors.text }]}>Enregistrement prêt</Text>
            </View>
            <View style={styles.audioActions}>
              <TouchableOpacity style={[styles.playButton, { backgroundColor: colors.primary }]} onPress={toggleAudioPreview}>
                <Ionicons name={isPlayingAudio ? 'pause' : 'play'} size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={removeAudio} hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      
      <TouchableOpacity
        style={[
          styles.publishButton,
          { backgroundColor: selectedMedia.length > 0 || recordedAudioUri ? colors.primary : colors.border, shadowColor: colors.primary }
        ]}
        onPress={handlePublishProcess}
        disabled={loading || (selectedMedia.length === 0 && !recordedAudioUri)}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
            <Text style={styles.publishButtonText}>Publier maintenant</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ========== STYLES ==========
const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 8 },
  adminCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  adminIconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  adminTextContainer: { flex: 1 },
  adminTitle: { fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
  adminSubtitle: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { flex: 1, fontSize: 17, fontWeight: '600', marginLeft: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  addButtonText: { fontSize: 16, fontWeight: '600' },
  secondaryButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, alignSelf: 'center', marginBottom: 12 },
  secondaryButtonText: { fontSize: 14, fontWeight: '600' },
  mediaContainer: { borderTopWidth: 1, paddingTop: 12 },
  mediaItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1 },
  mediaText: { flex: 1, marginLeft: 12, fontSize: 15 },
  deleteButton: { padding: 4 },
  recordButton: { alignItems: 'center', justifyContent: 'center', width: 70, height: 70, borderRadius: 35, marginBottom: 12, alignSelf: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  audioPreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 12, marginTop: 4 },
  audioInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  audioText: { fontSize: 14, fontWeight: '500' },
  audioActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  publishButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  publishButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
});
*/












/*
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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase'; // Ajustez le chemin vers votre client Supabase

interface AdminViewProps {
  isDark?: boolean;
}

export default function AdminView({ isDark = false }: AdminViewProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- 1. Sélection des images / vidéos ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...uris]);
    }
  };

  // --- 2. Enregistrement Audio ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', "Accès au micro refusé.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Erreur au lancement du micro :', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (uri) {
      setAudioUri(uri);
    }
  };

  // --- 3. Upload vers Supabase Storage (Robuste sur React Native) ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    // Lecture du fichier local en base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Conversion en ArrayBuffer
    const arrayBuffer = decode(base64);

    // Extension et type MIME
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    let mimeType = 'application/octet-stream';

    if (folder === 'medias') {
      mimeType = fileExt === 'mp4' || fileExt === 'mov' ? 'video/mp4' : 'image/jpeg';
    } else if (folder === 'audios') {
      mimeType = 'audio/m4a';
    }

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload dans le bucket 'ganbanaaxu-media'
    const { data, error } = await supabase.storage
      .from('ganbanaaxu-media')
      .upload(fileName, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erreur Storage: ${error.message}`);
    }

    // Obtenir l'URL publique
    const { data: publicUrlData } = supabase.storage
      .from('ganbanaaxu-media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  // --- 4. Processus de publication complet ---
  const handlePublishProcess = async () => {
    if (selectedImages.length === 0 && !audioUri) {
      Alert.alert('Attention', 'Veuillez ajouter au moins une image ou un enregistrement audio.');
      return;
    }

    setLoading(true);

    try {
      // Upload des images / vidéos
      const uploadedMediaUrls: string[] = [];
      for (const uri of selectedImages) {
        const url = await uploadFileToSupabase(uri, 'medias');
        uploadedMediaUrls.push(url);
      }

      // Upload de l'audio si présent
      let uploadedAudioUrl: string | null = null;
      if (audioUri) {
        uploadedAudioUrl = await uploadFileToSupabase(audioUri, 'audios');
      }

      // Insertion dans la base de données (Table 'posts')
      const { error: dbError } = await supabase
        .from('posts')
        .insert([
          {
            media_urls: uploadedMediaUrls,
            audio_url: uploadedAudioUrl,
          },
        ]);

      if (dbError) throw dbError;

      Alert.alert('Succès', 'Publication publiée avec succès !');

      // Réinitialisation de l'état
      setSelectedImages([]);
      setAudioUri(null);
    } catch (error: any) {
      console.error('Erreur de publication :', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la publication.');
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = isDark ? styles.darkTheme : styles.lightTheme;
  const textTheme = isDark ? styles.darkText : styles.lightText;

  return (
    <ScrollView contentContainerStyle={[styles.container, themeStyles]}>
      <Text style={[styles.title, textTheme]}>Administration - Publier</Text>

      
      <TouchableOpacity style={styles.button} onPress={pickMedia} disabled={loading}>
        <Text style={styles.buttonText}>Ajouter des images / vidéos</Text>
      </TouchableOpacity>

    
      <ScrollView horizontal style={styles.previewContainer}>
        {selectedImages.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.thumbnail} />
        ))}
      </ScrollView>

      
      <TouchableOpacity
        style={[styles.button, recording ? styles.recordingBtn : null]}
        onPress={recording ? stopRecording : startRecording}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {recording ? "Arrêter l'enregistrement" : "Enregistrer un vocal"}
        </Text>
      </TouchableOpacity>

      {audioUri && <Text style={[styles.infoText, textTheme]}>Audio enregistré ✓</Text>}

    
      <TouchableOpacity
        style={[styles.publishButton, loading ? styles.disabledBtn : null]}
        onPress={handlePublishProcess}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.publishButtonText}>Publier</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  lightTheme: { backgroundColor: '#ffffff' },
  darkTheme: { backgroundColor: '#121212' },
  lightText: { color: '#000000' },
  darkText: { color: '#ffffff' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  recordingBtn: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  previewContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  infoText: {
    marginVertical: 5,
    fontStyle: 'italic',
  },
  publishButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
*/



































/*

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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

interface AdminViewProps {
  isDark?: boolean;
}

export default function AdminView({ isDark = false }: AdminViewProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- 1. Sélection des images / vidéos ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...uris]);
    }
  };

  // --- 2. Enregistrement Audio ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', "Accès au micro refusé.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Erreur au lancement du micro :', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (uri) {
      setAudioUri(uri);
    }
  };

  // --- 3. Upload vers Supabase Storage ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64);

    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    let mimeType = 'application/octet-stream';

    if (folder === 'medias') {
      mimeType = fileExt === 'mp4' || fileExt === 'mov' ? 'video/mp4' : 'image/jpeg';
    } else if (folder === 'audios') {
      mimeType = 'audio/m4a';
    }

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media')
      .upload(fileName, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erreur Storage: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('ganbanaaxu-media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  // --- 4. Processus de publication complet ---
  const handlePublishProcess = async () => {
    if (selectedImages.length === 0 && !audioUri) {
      Alert.alert('Attention', 'Veuillez ajouter au moins une image ou un enregistrement audio.');
      return;
    }

    setLoading(true);

    try {
      // 1. RÉCUPÉRATION DE L'UTILISATEUR CONNECTÉ
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Vous devez être connecté pour publier.');
      }

      // 2. Upload des images / vidéos
      const uploadedMediaUrls: string[] = [];
      for (const uri of selectedImages) {
        const url = await uploadFileToSupabase(uri, 'medias');
        uploadedMediaUrls.push(url);
      }

      // 3. Upload de l'audio si présent
      let uploadedAudioUrl: string | null = null;
      if (audioUri) {
        uploadedAudioUrl = await uploadFileToSupabase(audioUri, 'audios');
      }

      // 4. Insertion dans la table 'posts' AVEC LE USER_ID
      const { error: dbError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id, // <-- AJOUT CRUCIAL DU USER_ID
            media_urls: uploadedMediaUrls,
            audio_url: uploadedAudioUrl,
          },
        ]);

      if (dbError) throw dbError;

      Alert.alert('Succès', 'Publication publiée avec succès !');

      // Réinitialisation de l'état
      setSelectedImages([]);
      setAudioUri(null);
    } catch (error: any) {
      console.error('Erreur de publication :', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la publication.');
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = isDark ? styles.darkTheme : styles.lightTheme;
  const textTheme = isDark ? styles.darkText : styles.lightText;

  return (
    <ScrollView contentContainerStyle={[styles.container, themeStyles]}>
      <Text style={[styles.title, textTheme]}>Administration - Publier</Text>

      // Sélection Média 
      <TouchableOpacity style={styles.button} onPress={pickMedia} disabled={loading}>
        <Text style={styles.buttonText}>Ajouter des images / vidéos</Text>
      </TouchableOpacity>

      // Galerie de prévisualisation 
      <ScrollView horizontal style={styles.previewContainer}>
        {selectedImages.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.thumbnail} />
        ))}
      </ScrollView>

      // Enregistrement Audio 
      <TouchableOpacity
        style={[styles.button, recording ? styles.recordingBtn : null]}
        onPress={recording ? stopRecording : startRecording}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {recording ? "Arrêter l'enregistrement" : "Enregistrer un vocal"}
        </Text>
      </TouchableOpacity>

      {audioUri && <Text style={[styles.infoText, textTheme]}>Audio enregistré ✓</Text>}

      // Bouton Publier 
      <TouchableOpacity
        style={[styles.publishButton, loading ? styles.disabledBtn : null]}
        onPress={handlePublishProcess}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.publishButtonText}>Publier</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  lightTheme: { backgroundColor: '#ffffff' },
  darkTheme: { backgroundColor: '#121212' },
  lightText: { color: '#000000' },
  darkText: { color: '#ffffff' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  recordingBtn: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  previewContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  infoText: {
    marginVertical: 5,
    fontStyle: 'italic',
  },
  publishButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
*/






















/*
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
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

interface AdminViewProps {
  isDark?: boolean;
}

export default function AdminView({ isDark = false }: AdminViewProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // --- 1. Sélection des images / vidéos ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Accès à la galerie refusé.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prev) => [...prev, ...uris]);
    }
  };

  // --- 2. Enregistrement Audio ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', "Accès au micro refusé.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Erreur au lancement du micro :', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (uri) {
      setAudioUri(uri);
    }
  };

  // --- 3. Upload vers Supabase Storage ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64);

    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    let mimeType = 'application/octet-stream';

    if (folder === 'medias') {
      mimeType = fileExt === 'mp4' || fileExt === 'mov' ? 'video/mp4' : 'image/jpeg';
    } else if (folder === 'audios') {
      mimeType = 'audio/m4a';
    }

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media')
      .upload(fileName, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erreur Storage: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('ganbanaaxu-media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  // --- 4. Processus de publication complet ---
  const handlePublishProcess = async () => {
    if (selectedImages.length === 0 && !audioUri) {
      Alert.alert('Attention', 'Veuillez ajouter au moins une image ou un enregistrement audio.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Vous devez être connecté pour publier.');
      }

      const uploadedMediaUrls: string[] = [];
      for (const uri of selectedImages) {
        const url = await uploadFileToSupabase(uri, 'medias');
        uploadedMediaUrls.push(url);
      }

      let uploadedAudioUrl: string | null = null;
      if (audioUri) {
        uploadedAudioUrl = await uploadFileToSupabase(audioUri, 'audios');
      }

      const { error: dbError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            media_urls: uploadedMediaUrls,
            audio_url: uploadedAudioUrl,
          },
        ]);

      if (dbError) throw dbError;

      Alert.alert('Succès', 'Publication publiée avec succès !');

      setSelectedImages([]);
      setAudioUri(null);
    } catch (error: any) {
      console.error('Erreur de publication :', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la publication.');
    } finally {
      setLoading(false);
    }
  };

  const themeStyles = isDark ? styles.darkTheme : styles.lightTheme;
  const textTheme = isDark ? styles.darkText : styles.lightText;

  return (
    <ScrollView contentContainerStyle={[styles.container, themeStyles]}>
      <Text style={[styles.title, textTheme]}>Administration - Publier</Text>

      // Sélection Média 
      <TouchableOpacity style={styles.button} onPress={pickMedia} disabled={loading}>
        <Text style={styles.buttonText}>Ajouter des images / vidéos</Text>
      </TouchableOpacity>

      // Galerie de prévisualisation 
      {selectedImages.length > 0 && (
        <ScrollView horizontal style={styles.previewContainer}>
          {selectedImages.map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.thumbnail} />
          ))}
        </ScrollView>
      )}

      // Enregistrement Audio 
      <TouchableOpacity
        style={[styles.button, recording ? styles.recordingBtn : null]}
        onPress={recording ? stopRecording : startRecording}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {recording ? "Arrêter l'enregistrement" : "Enregistrer un vocal"}
        </Text>
      </TouchableOpacity>

      {audioUri && <Text style={[styles.infoText, textTheme]}>Audio enregistré ✓</Text>}

      // Bouton Publier 
      <TouchableOpacity
        style={[styles.publishButton, loading ? styles.disabledBtn : null]}
        onPress={handlePublishProcess}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.publishButtonText}>Publier</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  lightTheme: { backgroundColor: '#ffffff' },
  darkTheme: { backgroundColor: '#121212' },
  lightText: { color: '#000000' },
  darkText: { color: '#ffffff' },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  recordingBtn: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  previewContainer: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  infoText: {
    marginVertical: 5,
    fontStyle: 'italic',
  },
  publishButton: {
    backgroundColor: '#34C759',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  publishButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
*/


















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

  // Nettoyage du son lors du démontage du composant
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // --- 1. Sélection des images / vidéos ---
  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', 'Accès à la galerie refusé.');
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

  // --- 2. Enregistrement & Ecoute Audio ---
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission requise', 'Accès au micro refusé.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (err) {
      console.error('Erreur au lancement du micro :', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recording.getURI();
    if (uri) {
      setAudioUri(uri);
    }
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
          if (status.isLoaded && status.didJustFinish) {
            setIsPlayingAudio(false);
          }
        });
      }
    } catch (error) {
      console.error("Erreur lecture audio :", error);
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

  // --- 3. Upload vers Supabase Storage ---
  const uploadFileToSupabase = async (uri: string, folder: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const arrayBuffer = decode(base64);
    const fileExt = uri.split('.').pop()?.split('?')[0] || 'bin';
    let mimeType = 'application/octet-stream';

    if (folder === 'medias') {
      mimeType = fileExt === 'mp4' || fileExt === 'mov' ? 'video/mp4' : 'image/jpeg';
    } else if (folder === 'audios') {
      mimeType = 'audio/m4a';
    }

    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from('ganbanaaxu-media')
      .upload(fileName, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Erreur Storage: ${error.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from('ganbanaaxu-media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  };

  // --- 4. Publication finale ---
  const handlePublishProcess = async () => {
    if (selectedMedia.length === 0 && !audioUri) {
      Alert.alert('Attention', 'Veuillez ajouter au moins un média ou un vocal.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Vous devez être connecté pour publier.');
      }

      const uploadedMediaUrls: string[] = [];
      for (const item of selectedMedia) {
        const url = await uploadFileToSupabase(item.uri, 'medias');
        uploadedMediaUrls.push(url);
      }

      let uploadedAudioUrl: string | null = null;
      if (audioUri) {
        uploadedAudioUrl = await uploadFileToSupabase(audioUri, 'audios');
      }

      const { error: dbError } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user.id,
            media_urls: uploadedMediaUrls,
            audio_url: uploadedAudioUrl,
          },
        ]);

      if (dbError) throw dbError;

      Alert.alert('Succès', 'Publication publiée avec succès !');

      setSelectedMedia([]);
      await deleteAudio();
    } catch (error: any) {
      console.error('Erreur de publication :', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la publication.');
    } finally {
      setLoading(false);
    }
  };

  const themeCard = isDark ? styles.cardDark : styles.cardLight;
  const themeText = isDark ? styles.textDark : styles.textLight;

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      // Carte d'en-tête 
      <View style={[styles.card, styles.cardAdminInfo]}>
        <MaterialIcons name="admin-panel-settings" size={24} color="#007AFF" />
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoTitle, themeText]}>Espace Administration</Text>
          <Text style={styles.infoSubtitle}>
            Publiez directement des contenus officiels sans restriction de paiement.
          </Text>
        </View>
      </View>

      // Galerie de sélection Média 
      <View style={[styles.card, themeCard]}>
        <Text style={[styles.cardTitle, themeText]}>Médias (Images / Vidéos)</Text>
        
        <TouchableOpacity style={styles.btnSecondary} onPress={pickMedia} disabled={loading}>
          <MaterialIcons name="photo-library" size={20} color="#FFF" />
          <Text style={styles.btnText}>Ajouter des fichiers ({selectedMedia.length})</Text>
        </TouchableOpacity>

        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.previewContainer} showsHorizontalScrollIndicator={false}>
            {selectedMedia.map((item, index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                {item.type === 'video' && (
                  <View style={styles.videoBadge}>
                    <Ionicons name="videocam" size={14} color="#FFF" />
                  </View>
                )}
                <TouchableOpacity style={styles.removeBadge} onPress={() => removeMedia(index)}>
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      // Module Audio 
      <View style={[styles.card, themeCard]}>
        <Text style={[styles.cardTitle, themeText]}>Enregistrement Vocal</Text>
        
        <TouchableOpacity
          style={[styles.btnAudio, recording ? styles.btnAudioActive : null]}
          onPress={recording ? stopRecording : startRecording}
          disabled={loading}
        >
          <Ionicons name={recording ? "stop" : "mic"} size={22} color="#FFF" />
          <Text style={styles.btnText}>
            {recording ? "Arrêter l'enregistrement" : "Enregistrer un vocal"}
          </Text>
        </TouchableOpacity>

        {audioUri && (
          <View style={styles.audioPreviewRow}>
            <TouchableOpacity style={styles.btnPlayAudio} onPress={toggleAudioPreview}>
              <Ionicons name={isPlayingAudio ? "pause" : "play"} size={20} color="#FFF" />
              <Text style={styles.btnText}>Écouter la note</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={deleteAudio}>
              <Ionicons name="trash" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      // Bouton Publier 
      <TouchableOpacity
        style={[styles.btnPrimary, loading ? styles.disabledBtn : null]}
        onPress={handlePublishProcess}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="send" size={18} color="#FFF" />
            <Text style={styles.btnText}>Publier la note</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 20 },
  card: { borderRadius: 14, padding: 16, marginBottom: 16, elevation: 2 },
  cardDark: { backgroundColor: '#1E1E1E' },
  cardLight: { backgroundColor: '#FFFFFF' },
  cardAdminInfo: { borderLeftWidth: 4, borderLeftColor: '#007AFF', flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: 'rgba(0,122,255,0.05)' },
  cardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  textDark: { color: '#FFFFFF' },
  textLight: { color: '#1C1E21' },
  infoTitle: { fontSize: 14, fontWeight: '700' },
  infoSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2, lineHeight: 16 },
  btnPrimary: { flexDirection: 'row', backgroundColor: '#34C759', padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10 },
  btnSecondary: { flexDirection: 'row', backgroundColor: '#48484A', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 6 },
  btnAudio: { flexDirection: 'row', backgroundColor: '#5856D6', padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', gap: 8 },
  btnAudioActive: { backgroundColor: '#FF3B30' },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  previewContainer: { flexDirection: 'row', marginTop: 14 },
  thumbnailWrapper: { position: 'relative', marginRight: 10 },
  thumbnail: { width: 80, height: 80, borderRadius: 8 },
  videoBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', padding: 2, borderRadius: 4 },
  removeBadge: { position: 'absolute', top: -6, right: -6, backgroundColor: '#FFF', borderRadius: 10 },
  audioPreviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, backgroundColor: 'rgba(150,150,150,0.1)', padding: 10, borderRadius: 8 },
  btnPlayAudio: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#2C2C2E', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  disabledBtn: { opacity: 0.6 },
});
*/

























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