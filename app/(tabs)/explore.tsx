


/*
import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  BackHandler,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';

// Types
interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  shadow: string;
}

interface PageContentProps {
  title?: string;
  onGoBack: () => void;
  children: React.ReactNode;
  theme: Theme;
}

interface ScreenProps {
  onGoBack: () => void;
  theme: Theme;
}

const ICONS: { [key: string]: string } = {
  events: "✨",
  videos: "🎬",
  articles: "📰",
  boutique: "🛒",
  community: "🤝",
};

const EXPLORE_CATEGORIES = [
  { id: "events", title: "Événements", iconName: "events" },
  //{ id: "videos", title: "Vidéos", iconName: "videos" },
  //{ id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

const PageContent: React.FC<PageContentProps> = ({ title, onGoBack, children, theme }) => (
  <View style={[styles.pageContainer, { backgroundColor: theme.background }]}>
    <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={28} color="indigo" />
    </TouchableOpacity>

    <ScrollView style={styles.pageScroll}>{children}</ScrollView>
  </View>
);

const EventsScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Événements" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color:theme.textSecondary }]}>
      Découvrez les événements à venir, les ateliers et les rencontres près de
      chez vous.
    </Text>
  </PageContent>
);

const VideosScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Regardez nos vidéos éducatives et tutoriels.
    </Text>
  </PageContent>
);

const ArticlesScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Articles et Guides" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Apprenez de nouvelles compétences avec nos guides détaillés et articles de
      fond.
    </Text>
  </PageContent>
);

const BoutiqueScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Boutique" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Découvrez nos produits exclusifs et soutenez la communauté.
    </Text>
  </PageContent>
);

const CommunityScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Communauté" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Connectez-vous avec d'autres membres, partagez vos idées et collaborez.
    </Text>
  </PageContent>
);

export default function ExploreScreen() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const lightTheme: Theme = {
    background: "#F0F2F5",
    card: "#FFFFFF",
    text: "#1C1E21",
    textSecondary: "#65676B",
    primary: "#007AFF",
    shadow: "rgba(0,0,0,0.1)",
  };

  const darkTheme: Theme = {
    background: "#121212",
    card: "#1E1E1E",
    text: "#E4E6EB",
    textSecondary: "#B0B3B8",
    primary: "#0A84FF",
    shadow: "rgba(0,0,0,0.7)",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  // Fonction pour gérer le retour
  const handleGoBack = (): boolean => {
    setCurrentPage(null);
    return true;
  };

  // Gestion du bouton retour natif du téléphone
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (currentPage) {
          handleGoBack();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [currentPage]);

  const pageComponents: { [key: string]: JSX.Element } = {
    events: <EventsScreen onGoBack={handleGoBack} theme={theme} />,
    videos: <VideosScreen onGoBack={handleGoBack} theme={theme} />,
    articles: <ArticlesScreen onGoBack={handleGoBack} theme={theme} />,
    boutique: <BoutiqueScreen onGoBack={handleGoBack} theme={theme} />,
    community: <CommunityScreen onGoBack={handleGoBack} theme={theme} />,
  };

  const renderGrid = (): JSX.Element => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Découvrez du nouveau contenu
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardsGrid}>
          {EXPLORE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, shadowColor: theme.shadow },
              ]}
              onPress={() => setCurrentPage(category.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardIcon, { color: theme.text }]}>
                {ICONS[category.iconName]}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {currentPage ? pageComponents[currentPage] : renderGrid()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  subtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  scrollContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    aspectRatio: 1 / 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cardIcon: {
    fontSize: 40,
  },
  cardTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  pageContainer: {
    flex: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginTop: 12,
  },
  pageScroll: {
    paddingHorizontal: 20,
  },
  pageParagraph: {
    fontSize: 16,
    lineHeight: 24,
  },
});
*/






















/*
import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  BackHandler,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import de votre instance Supabase
import { supabase } from "../../lib/supabase";

// Types
interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  shadow: string;
  border: string;
}

interface PageContentProps {
  title?: string;
  onGoBack: () => void;
  children: React.ReactNode;
  theme: Theme;
}

interface ScreenProps {
  onGoBack: () => void;
  theme: Theme;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  user_id: string;
  created_at: string;
}

const ICONS: { [key: string]: string } = {
  events: "✨",
  videos: "🎬",
  articles: "📰",
  boutique: "🛒",
  community: "🤝",
};

const EXPLORE_CATEGORIES = [
  { id: "events", title: "Événements", iconName: "events" },
  //{ id: "videos", title: "Vidéos", iconName: "videos" },
  //{ id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

const PageContent: React.FC<PageContentProps> = ({ title, onGoBack, children, theme }) => (
  <View style={[styles.pageContainer, { backgroundColor: theme.background }]}>
    <View style={styles.headerBar}>
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color="indigo" />
      </TouchableOpacity>
      {title && <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>}
    </View>
    <View style={styles.pageScroll}>{children}</View>
  </View>
);

// ====================================================================
// COMPOSANT ÉVÉNEMENTS (GÉRÉ AVEC SUPABASE ET LA COLONNE 'ROLE')
// ====================================================================
const EventsScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Informations utilisateur
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // État du Formulaire de création
  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Charger profil utilisateur & événements
  const fetchUserDataAndEvents = async () => {
    try {
      // 1. Utilisateur actuel
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);

        // On sélectionne la colonne 'role' depuis la table profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          setIsAdmin(profile.role === 'admin');
          setIsSuperuser(profile.role === 'superuser');
        }
      }

      // 2. Récupérer les événements
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error("Erreur événements :", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDataAndEvents();
  }, []);

  // Publier un événement (Réservé Admin / Superuser)
  const handleCreateEvent = async () => {
    if (!titleInput.trim() || !descriptionInput.trim()) {
      Alert.alert("Erreur", "Veuillez remplir au moins le titre et la description.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("events").insert([
        {
          title: titleInput.trim(),
          description: descriptionInput.trim(),
          event_date: dateInput.trim() || "Prochainement",
          location: locationInput.trim() || "Non spécifié",
          user_id: currentUserId,
        },
      ]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents((prev) => [data[0], ...prev]);
      }

      // Réinitialiser le formulaire
      setTitleInput("");
      setDescriptionInput("");
      setDateInput("");
      setLocationInput("");
      setModalVisible(false);
      Alert.alert("Succès", "Événement publié avec succès !");
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de créer l'événement : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer un événement
  const handleDeleteEvent = (eventId: string, ownerId: string) => {
    const isOwner = currentUserId === ownerId;
    const canDelete = isSuperuser || (isAdmin && isOwner);

    if (!canDelete) return;

    Alert.alert(
      "Supprimer l'événement",
      "Êtes-vous sûr de vouloir supprimer cet événement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("events").delete().eq("id", eventId);
              if (error) throw error;

              setEvents((prev) => prev.filter((item) => item.id !== eventId));
            } catch (error: any) {
              Alert.alert("Erreur", "Suppression échouée : " + error.message);
            }
          },
        },
      ]
    );
  };

  const canCreate = isAdmin || isSuperuser;

  return (
    <PageContent title="Événements" onGoBack={onGoBack} theme={theme}>
     
      {canCreate && (
        <TouchableOpacity
          style={[styles.addEventButton, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.addEventButtonText}>Ajouter un événement</Text>
        </TouchableOpacity>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="indigo" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["indigo"]} />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun événement à venir pour le moment.
            </Text>
          }
          renderItem={({ item }) => {
            const isOwner = currentUserId === item.user_id;
            const canDelete = isSuperuser || (isAdmin && isOwner);

            return (
              <View style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
                  {canDelete && (
                    <TouchableOpacity onPress={() => handleDeleteEvent(item.id, item.user_id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                {item.event_date ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.event_date}
                    </Text>
                  </View>
                ) : null}

                {item.location ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="location-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}

                <Text style={[styles.eventDescription, { color: theme.text }]}>
                  {item.description}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Nouvel événement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Titre de l'événement *"
              placeholderTextColor={theme.textSecondary}
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Date / Heure (ex: 15 Octobre à 18h)"
              placeholderTextColor={theme.textSecondary}
              value={dateInput}
              onChangeText={setDateInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Lieu (ex: Dakar / En ligne)"
              placeholderTextColor={theme.textSecondary}
              value={locationInput}
              onChangeText={setLocationInput}
            />

            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Description détaillée *"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateEvent}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Publier l'événement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageContent>
  );
};

// Autres écrans statiques
const VideosScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Vidéos" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Regardez nos vidéos éducatives et tutoriels.
    </Text>
  </PageContent>
);

const ArticlesScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Articles et Guides" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Apprenez de nouvelles compétences avec nos guides détaillés.
    </Text>
  </PageContent>
);

const BoutiqueScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Boutique" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Découvrez nos produits exclusifs et soutenez la communauté.
    </Text>
  </PageContent>
);

const CommunityScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Communauté" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Connectez-vous avec d'autres membres, partagez vos idées et collaborez.
    </Text>
  </PageContent>
);

// ====================================================================
// ÉCRAN PRINCIPAL
// ====================================================================
export default function ExploreScreen() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const lightTheme: Theme = {
    background: "#F0F2F5",
    card: "#FFFFFF",
    text: "#1C1E21",
    textSecondary: "#65676B",
    primary: "#007AFF",
    shadow: "rgba(0,0,0,0.1)",
    border: "#E4E6EB",
  };

  const darkTheme: Theme = {
    background: "#121212",
    card: "#1E1E1E",
    text: "#E4E6EB",
    textSecondary: "#B0B3B8",
    primary: "#0A84FF",
    shadow: "rgba(0,0,0,0.7)",
    border: "#2A2A2A",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const handleGoBack = (): boolean => {
    setCurrentPage(null);
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (currentPage) {
        handleGoBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [currentPage]);

  const pageComponents: { [key: string]: JSX.Element } = {
    events: <EventsScreen onGoBack={handleGoBack} theme={theme} />,
    videos: <VideosScreen onGoBack={handleGoBack} theme={theme} />,
    articles: <ArticlesScreen onGoBack={handleGoBack} theme={theme} />,
    boutique: <BoutiqueScreen onGoBack={handleGoBack} theme={theme} />,
    community: <CommunityScreen onGoBack={handleGoBack} theme={theme} />,
  };

  const renderGrid = (): JSX.Element => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Découvrez du nouveau contenu
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardsGrid}>
          {EXPLORE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, shadowColor: theme.shadow },
              ]}
              onPress={() => setCurrentPage(category.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardIcon, { color: theme.text }]}>
                {ICONS[category.iconName]}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {currentPage ? pageComponents[currentPage] : renderGrid()}
    </SafeAreaView>
  );
}

// ====================================================================
// STYLES
// ====================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 32, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginTop: 4 },
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    aspectRatio: 1 / 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cardIcon: { fontSize: 40 },
  cardTitle: { marginTop: 12, fontSize: 15, fontWeight: "600" },
  pageContainer: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingTop: 10 },
  backButton: { padding: 5 },
  pageTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  pageScroll: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  pageParagraph: { fontSize: 16, lineHeight: 24 },
  
  // Événements
  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  addEventButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 15 },
  eventCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  eventHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  eventTitle: { fontSize: 18, fontWeight: "bold", flex: 1, marginRight: 10 },
  eventDetailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eventDetailText: { fontSize: 13, fontWeight: "500" },
  eventDescription: { fontSize: 14, marginTop: 8, lineHeight: 20 },

  // Modal Formulaire
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  submitButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
*/























/*

import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  BackHandler,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import de votre instance Supabase
import { supabase } from "../../lib/supabase";

// Types
interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  shadow: string;
  border: string;
}

interface PageContentProps {
  title?: string;
  onGoBack: () => void;
  children: React.ReactNode;
  theme: Theme;
}

interface ScreenProps {
  onGoBack: () => void;
  theme: Theme;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  user_id: string;
  created_at: string;
}

const ICONS: { [key: string]: string } = {
  events: "✨",
  videos: "🎬",
  articles: "📰",
  boutique: "🛒",
  community: "🤝",
};

const EXPLORE_CATEGORIES = [
  { id: "events", title: "Événements", iconName: "events" },
  //{ id: "videos", title: "Vidéos", iconName: "videos" },
  //{ id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

const PageContent: React.FC<PageContentProps> = ({ title, onGoBack, children, theme }) => (
  <View style={[styles.pageContainer, { backgroundColor: theme.background }]}>
    <View style={styles.headerBar}>
      <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
        <Ionicons name="arrow-back" size={28} color="indigo" />
      </TouchableOpacity>
      {title && <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>}
    </View>
    <View style={styles.pageScroll}>{children}</View>
  </View>
);

// ====================================================================
// COMPOSANT ÉVÉNEMENTS
// ====================================================================
const EventsScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Informations utilisateur
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // État du Formulaire de création
  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Charger profil utilisateur & événements
  const fetchUserDataAndEvents = async () => {
    try {
      // 1. Utilisateur actuel
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);

        // Sélectionner tous les champs pour vérifier role ET is_superuser
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const roleText = (profile.role || "").toString().toLowerCase();
          const isSuper = profile.is_superuser === true || roleText === 'superuser';
          const isAdm = roleText === 'admin' || isSuper;

          setIsAdmin(isAdm);
          setIsSuperuser(isSuper);
        }
      }

      // 2. Récupérer les événements
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error("Erreur événements :", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDataAndEvents();
  }, []);

  // Publier un événement (Réservé Admin / Superuser)
  const handleCreateEvent = async () => {
    if (!titleInput.trim() || !descriptionInput.trim()) {
      Alert.alert("Erreur", "Veuillez remplir au moins le titre et la description.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("events").insert([
        {
          title: titleInput.trim(),
          description: descriptionInput.trim(),
          event_date: dateInput.trim() || "Prochainement",
          location: locationInput.trim() || "Non spécifié",
          user_id: currentUserId,
        },
      ]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents((prev) => [data[0], ...prev]);
      }

      // Réinitialiser le formulaire
      setTitleInput("");
      setDescriptionInput("");
      setDateInput("");
      setLocationInput("");
      setModalVisible(false);
      Alert.alert("Succès", "Événement publié avec succès !");
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de créer l'événement : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Supprimer un événement
  const handleDeleteEvent = (eventId: string, ownerId: string) => {
    const isOwner = currentUserId === ownerId;
    // Superuser supprime tout, Admin supprime ses propres événements
    const canDelete = isSuperuser || (isAdmin && isOwner);

    if (!canDelete) {
      Alert.alert("Action non autorisée", "Vous n'avez pas les droits pour supprimer cet événement.");
      return;
    }

    Alert.alert(
      "Supprimer l'événement",
      "Êtes-vous sûr de vouloir supprimer cet événement définitivement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("events")
                .delete()
                .eq("id", eventId);

              if (error) {
                console.error("Erreur suppression Supabase:", error);
                throw new Error(error.message);
              }

              // Mise à jour de l'affichage local
              setEvents((prev) => prev.filter((item) => item.id !== eventId));
              Alert.alert("Succès", "L'événement a été supprimé.");
            } catch (error: any) {
              Alert.alert("Erreur de suppression", "Supabase a rejeté la demande : " + error.message);
            }
          },
        },
      ]
    );
  };

  const canCreate = isAdmin || isSuperuser;

  return (
    <PageContent title="Événements" onGoBack={onGoBack} theme={theme}>
     
      {canCreate && (
        <TouchableOpacity
          style={[styles.addEventButton, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.addEventButtonText}>Ajouter un événement</Text>
        </TouchableOpacity>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="indigo" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["indigo"]} />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun événement à venir pour le moment.
            </Text>
          }
          renderItem={({ item }) => {
            const isOwner = currentUserId === item.user_id;
            const canDelete = isSuperuser || (isAdmin && isOwner);

            return (
              <View style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
                  {canDelete && (
                    <TouchableOpacity onPress={() => handleDeleteEvent(item.id, item.user_id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                {item.event_date ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.event_date}
                    </Text>
                  </View>
                ) : null}

                {item.location ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="location-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}

                <Text style={[styles.eventDescription, { color: theme.text }]}>
                  {item.description}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

     
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Nouvel événement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Titre de l'événement *"
              placeholderTextColor={theme.textSecondary}
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Date / Heure (ex: 15 Octobre à 18h)"
              placeholderTextColor={theme.textSecondary}
              value={dateInput}
              onChangeText={setDateInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Lieu (ex: Dakar / En ligne)"
              placeholderTextColor={theme.textSecondary}
              value={locationInput}
              onChangeText={setLocationInput}
            />

            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Description détaillée *"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateEvent}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Publier l'événement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageContent>
  );
};

// Écrans statiques
const VideosScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Vidéos" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Regardez nos vidéos éducatives et tutoriels.
    </Text>
  </PageContent>
);

const ArticlesScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Articles et Guides" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Apprenez de nouvelles compétences avec nos guides détaillés.
    </Text>
  </PageContent>
);

const BoutiqueScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Boutique" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Découvrez nos produits exclusifs et soutenez la communauté.
    </Text>
  </PageContent>
);

const CommunityScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Communauté" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Connectez-vous avec d'autres membres, partagez vos idées et collaborez.
    </Text>
  </PageContent>
);

// Écran principal
export default function ExploreScreen() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const lightTheme: Theme = {
    background: "#F0F2F5",
    card: "#FFFFFF",
    text: "#1C1E21",
    textSecondary: "#65676B",
    primary: "#007AFF",
    shadow: "rgba(0,0,0,0.1)",
    border: "#E4E6EB",
  };

  const darkTheme: Theme = {
    background: "#121212",
    card: "#1E1E1E",
    text: "#E4E6EB",
    textSecondary: "#B0B3B8",
    primary: "#0A84FF",
    shadow: "rgba(0,0,0,0.7)",
    border: "#2A2A2A",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const handleGoBack = (): boolean => {
    setCurrentPage(null);
    return true;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      if (currentPage) {
        handleGoBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [currentPage]);

  const pageComponents: { [key: string]: JSX.Element } = {
    events: <EventsScreen onGoBack={handleGoBack} theme={theme} />,
    videos: <VideosScreen onGoBack={handleGoBack} theme={theme} />,
    articles: <ArticlesScreen onGoBack={handleGoBack} theme={theme} />,
    boutique: <BoutiqueScreen onGoBack={handleGoBack} theme={theme} />,
    community: <CommunityScreen onGoBack={handleGoBack} theme={theme} />,
  };

  const renderGrid = (): JSX.Element => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Découvrez du nouveau contenu
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardsGrid}>
          {EXPLORE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, shadowColor: theme.shadow },
              ]}
              onPress={() => setCurrentPage(category.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardIcon, { color: theme.text }]}>
                {ICONS[category.iconName]}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {currentPage ? pageComponents[currentPage] : renderGrid()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 32, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginTop: 4 },
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    aspectRatio: 1 / 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cardIcon: { fontSize: 40 },
  cardTitle: { marginTop: 12, fontSize: 15, fontWeight: "600" },
  pageContainer: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingTop: 10 },
  backButton: { padding: 5 },
  pageTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  pageScroll: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  pageParagraph: { fontSize: 16, lineHeight: 24 },
  
  // Événements
  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  addEventButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 15 },
  eventCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  eventHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  eventTitle: { fontSize: 18, fontWeight: "bold", flex: 1, marginRight: 10 },
  eventDetailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eventDetailText: { fontSize: 13, fontWeight: "500" },
  eventDescription: { fontSize: 14, marginTop: 8, lineHeight: 20 },

  // Modal Formulaire
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  submitButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});

*/


























/*
import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  BackHandler,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import de votre instance Supabase
import { supabase } from "../../lib/supabase";

// Types
interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  shadow: string;
  border: string;
}

interface PageContentProps {
  title?: string;
  onGoBack: () => void;
  children: React.ReactNode;
  theme: Theme;
}

interface ScreenProps {
  onGoBack: () => void;
  theme: Theme;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  user_id: string;
  created_at: string;
}

const ICONS: { [key: string]: string } = {
  events: "✨",
  videos: "🎬",
  articles: "📰",
  boutique: "🛒",
  community: "🤝",
};

const EXPLORE_CATEGORIES = [
  { id: "events", title: "Événements", iconName: "events" },
  //{ id: "videos", title: "Vidéos", iconName: "videos" },
  //{ id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

// ====================================================================
// WRAPPER DE PAGE (Gère le bouton retour physique)
// ====================================================================
const PageContent: React.FC<PageContentProps> = ({ title, onGoBack, children, theme }) => {
  // Capture le bouton physique "Retour" du téléphone
  useEffect(() => {
    const handleHardwareBackPress = () => {
      onGoBack();
      return true; // Renvoie 'true' pour indiquer que l'action a été gérée
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleHardwareBackPress
    );

    return () => backHandler.remove();
  }, [onGoBack]);

  return (
    <View style={[styles.pageContainer, { backgroundColor: theme.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="indigo" />
        </TouchableOpacity>
        {title && <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>}
      </View>
      <View style={styles.pageScroll}>{children}</View>
    </View>
  );
};

// ====================================================================
// COMPOSANT ÉVÉNEMENTS
// ====================================================================
const EventsScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Informations utilisateur
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // État du Formulaire de création
  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Charger profil utilisateur & événements
  const fetchUserDataAndEvents = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const roleText = (profile.role || "").toString().toLowerCase();
          const isSuper = profile.is_superuser === true || roleText === 'superuser';
          const isAdm = roleText === 'admin' || isSuper;

          setIsAdmin(isAdm);
          setIsSuperuser(isSuper);
        }
      }

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error("Erreur événements :", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDataAndEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!titleInput.trim() || !descriptionInput.trim()) {
      Alert.alert("Erreur", "Veuillez remplir au moins le titre et la description.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("events").insert([
        {
          title: titleInput.trim(),
          description: descriptionInput.trim(),
          event_date: dateInput.trim() || "Prochainement",
          location: locationInput.trim() || "Non spécifié",
          user_id: currentUserId,
        },
      ]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents((prev) => [data[0], ...prev]);
      }

      setTitleInput("");
      setDescriptionInput("");
      setDateInput("");
      setLocationInput("");
      setModalVisible(false);
      Alert.alert("Succès", "Événement publié avec succès !");
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de créer l'événement : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = (eventId: string, ownerId: string) => {
    const isOwner = currentUserId === ownerId;
    const canDelete = isSuperuser || (isAdmin && isOwner);

    if (!canDelete) {
      Alert.alert("Action non autorisée", "Vous n'avez pas les droits pour supprimer cet événement.");
      return;
    }

    Alert.alert(
      "Supprimer l'événement",
      "Êtes-vous sûr de vouloir supprimer cet événement définitivement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("events").delete().eq("id", eventId);
              if (error) throw new Error(error.message);

              setEvents((prev) => prev.filter((item) => item.id !== eventId));
              Alert.alert("Succès", "L'événement a été supprimé.");
            } catch (error: any) {
              Alert.alert("Erreur de suppression", "Supabase a rejeté la demande : " + error.message);
            }
          },
        },
      ]
    );
  };

  const canCreate = isAdmin || isSuperuser;

  return (
    <PageContent title="Événements" onGoBack={onGoBack} theme={theme}>
      {canCreate && (
        <TouchableOpacity
          style={[styles.addEventButton, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.addEventButtonText}>Ajouter un événement</Text>
        </TouchableOpacity>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="indigo" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["indigo"]} />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun événement à venir pour le moment.
            </Text>
          }
          renderItem={({ item }) => {
            const isOwner = currentUserId === item.user_id;
            const canDelete = isSuperuser || (isAdmin && isOwner);

            return (
              <View style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
                  {canDelete && (
                    <TouchableOpacity onPress={() => handleDeleteEvent(item.id, item.user_id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                {item.event_date ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.event_date}
                    </Text>
                  </View>
                ) : null}

                {item.location ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="location-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}

                <Text style={[styles.eventDescription, { color: theme.text }]}>
                  {item.description}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Nouvel événement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Titre de l'événement *"
              placeholderTextColor={theme.textSecondary}
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Date / Heure (ex: 15 Octobre à 18h)"
              placeholderTextColor={theme.textSecondary}
              value={dateInput}
              onChangeText={setDateInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Lieu (ex: Dakar / En ligne)"
              placeholderTextColor={theme.textSecondary}
              value={locationInput}
              onChangeText={setLocationInput}
            />

            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Description détaillée *"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateEvent}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Publier l'événement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageContent>
  );
};

// Écrans statiques
const VideosScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Vidéos" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Regardez nos vidéos éducatives et tutoriels.
    </Text>
  </PageContent>
);

const ArticlesScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Articles et Guides" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Apprenez de nouvelles compétences avec nos guides détaillés.
    </Text>
  </PageContent>
);

const BoutiqueScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Boutique" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Découvrez nos produits exclusifs et soutenez la communauté.
    </Text>
  </PageContent>
);

const CommunityScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Communauté" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Connectez-vous avec d'autres membres, partagez vos idées et collaborez.
    </Text>
  </PageContent>
);

// ====================================================================
// ÉCRAN PRINCIPAL
// ====================================================================
export default function ExploreScreen() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const lightTheme: Theme = {
    background: "#F0F2F5",
    card: "#FFFFFF",
    text: "#1C1E21",
    textSecondary: "#65676B",
    primary: "#007AFF",
    shadow: "rgba(0,0,0,0.1)",
    border: "#E4E6EB",
  };

  const darkTheme: Theme = {
    background: "#121212",
    card: "#1E1E1E",
    text: "#E4E6EB",
    textSecondary: "#B0B3B8",
    primary: "#0A84FF",
    shadow: "rgba(0,0,0,0.7)",
    border: "#2A2A2A",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  // Fonction de retour
  const handleGoBack = useCallback(() => {
    setCurrentPage(null);
  }, []);

  const pageComponents: { [key: string]: JSX.Element } = {
    events: <EventsScreen onGoBack={handleGoBack} theme={theme} />,
    videos: <VideosScreen onGoBack={handleGoBack} theme={theme} />,
    articles: <ArticlesScreen onGoBack={handleGoBack} theme={theme} />,
    boutique: <BoutiqueScreen onGoBack={handleGoBack} theme={theme} />,
    community: <CommunityScreen onGoBack={handleGoBack} theme={theme} />,
  };

  const renderGrid = (): JSX.Element => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Découvrez du nouveau contenu
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardsGrid}>
          {EXPLORE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, shadowColor: theme.shadow },
              ]}
              onPress={() => setCurrentPage(category.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardIcon, { color: theme.text }]}>
                {ICONS[category.iconName]}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {currentPage ? pageComponents[currentPage] : renderGrid()}
    </SafeAreaView>
  );
}

// ====================================================================
// STYLES
// ====================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 32, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginTop: 4 },
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    aspectRatio: 1 / 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cardIcon: { fontSize: 40 },
  cardTitle: { marginTop: 12, fontSize: 15, fontWeight: "600" },
  pageContainer: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingTop: 10 },
  backButton: { padding: 5 },
  pageTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  pageScroll: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  pageParagraph: { fontSize: 16, lineHeight: 24 },
  
  // Événements
  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  addEventButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 15 },
  eventCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  eventHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  eventTitle: { fontSize: 18, fontWeight: "bold", flex: 1, marginRight: 10 },
  eventDetailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eventDetailText: { fontSize: 13, fontWeight: "500" },
  eventDescription: { fontSize: 14, marginTop: 8, lineHeight: 20 },

  // Modal Formulaire
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  submitButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
*/
















/*

import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  BackHandler,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import de votre instance Supabase
import { supabase } from "../../lib/supabase";

const EVENTS_CACHE_KEY = "ganbanaaxu_events_cache";

// Types
interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  shadow: string;
  border: string;
}

interface PageContentProps {
  title?: string;
  onGoBack: () => void;
  children: React.ReactNode;
  theme: Theme;
}

interface ScreenProps {
  onGoBack: () => void;
  theme: Theme;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  user_id: string;
  created_at: string;
}

const ICONS: { [key: string]: string } = {
  events: "✨",
  videos: "🎬",
  articles: "📰",
  boutique: "🛒",
  community: "🤝",
};

const EXPLORE_CATEGORIES = [
  { id: "events", title: "Événements", iconName: "events" },
  //{ id: "videos", title: "Vidéos", iconName: "videos" },
  //{ id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

// ====================================================================
// WRAPPER DE PAGE (Gère le bouton retour physique)
// ====================================================================
const PageContent: React.FC<PageContentProps> = ({ title, onGoBack, children, theme }) => {
  useEffect(() => {
    const handleHardwareBackPress = () => {
      onGoBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleHardwareBackPress
    );

    return () => backHandler.remove();
  }, [onGoBack]);

  return (
    <View style={[styles.pageContainer, { backgroundColor: theme.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="indigo" />
        </TouchableOpacity>
        {title && <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>}
      </View>
      <View style={styles.pageScroll}>{children}</View>
    </View>
  );
};

// ====================================================================
// COMPOSANT ÉVÉNEMENTS (AVEC ASYNCSTORAGE OFFLINE)
// ====================================================================
const EventsScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Informations utilisateur
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // État du Formulaire de création
  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Utilitaire sécurisé pour sauvegarder dans le cache
  const saveEventsToCache = async (data: EventItem[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Erreur de sauvegarde du cache des événements", e);
    }
  };

  // Charger profil utilisateur & événements (depuis le cache d'abord, puis Supabase)
  const fetchUserDataAndEvents = async () => {
    try {
      // 1. Charger immédiatement le cache pour un affichage instantané hors-ligne
      const cachedEvents = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cachedEvents) {
        setEvents(JSON.parse(cachedEvents));
        setLoading(false);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const roleText = (profile.role || "").toString().toLowerCase();
          const isSuper = profile.is_superuser === true || roleText === 'superuser';
          const isAdm = roleText === 'admin' || isSuper;

          setIsAdmin(isAdm);
          setIsSuperuser(isSuper);
        }
      }

      // 2. Récupérer les données fraîches depuis Supabase
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setEvents(data);
        saveEventsToCache(data); // Mettre à jour le cache local
      }
    } catch (error: any) {
      console.error("Erreur événements (mode hors-ligne potentiel) :", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDataAndEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!titleInput.trim() || !descriptionInput.trim()) {
      Alert.alert("Erreur", "Veuillez remplir au moins le titre et la description.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("events").insert([
        {
          title: titleInput.trim(),
          description: descriptionInput.trim(),
          event_date: dateInput.trim() || "Prochainement",
          location: locationInput.trim() || "Non spécifié",
          user_id: currentUserId,
        },
      ]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents((prev) => {
          const newEvents = [data[0], ...prev];
          saveEventsToCache(newEvents);
          return newEvents;
        });
      }

      setTitleInput("");
      setDescriptionInput("");
      setDateInput("");
      setLocationInput("");
      setModalVisible(false);
      Alert.alert("Succès", "Événement publié avec succès !");
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de créer l'événement : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = (eventId: string, ownerId: string) => {
    const isOwner = currentUserId === ownerId;
    const canDelete = isSuperuser || (isAdmin && isOwner);

    if (!canDelete) {
      Alert.alert("Action non autorisée", "Vous n'avez pas les droits pour supprimer cet événement.");
      return;
    }

    Alert.alert(
      "Supprimer l'événement",
      "Êtes-vous sûr de vouloir supprimer cet événement définitivement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("events").delete().eq("id", eventId);
              if (error) throw new Error(error.message);

              setEvents((prev) => {
                const newEvents = prev.filter((item) => item.id !== eventId);
                saveEventsToCache(newEvents);
                return newEvents;
              });
              Alert.alert("Succès", "L'événement a été supprimé.");
            } catch (error: any) {
              Alert.alert("Erreur de suppression", "Supabase a rejeté la demande : " + error.message);
            }
          },
        },
      ]
    );
  };

  const canCreate = isAdmin || isSuperuser;

  return (
    <PageContent title="Événements" onGoBack={onGoBack} theme={theme}>
      {canCreate && (
        <TouchableOpacity
          style={[styles.addEventButton, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.addEventButtonText}>Ajouter un événement</Text>
        </TouchableOpacity>
      )}

      {loading && events.length === 0 && !refreshing ? (
        <ActivityIndicator size="large" color="indigo" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["indigo"]} />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun événement à venir pour le moment.
            </Text>
          }
          renderItem={({ item }) => {
            const isOwner = currentUserId === item.user_id;
            const canDelete = isSuperuser || (isAdmin && isOwner);

            return (
              <View style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
                  {canDelete && (
                    <TouchableOpacity onPress={() => handleDeleteEvent(item.id, item.user_id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                {item.event_date ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.event_date}
                    </Text>
                  </View>
                ) : null}

                {item.location ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="location-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}

                <Text style={[styles.eventDescription, { color: theme.text }]}>
                  {item.description}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Nouvel événement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Titre de l'événement *"
              placeholderTextColor={theme.textSecondary}
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Date / Heure (ex: 15 Octobre à 18h)"
              placeholderTextColor={theme.textSecondary}
              value={dateInput}
              onChangeText={setDateInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Lieu (ex: Dakar / En ligne)"
              placeholderTextColor={theme.textSecondary}
              value={locationInput}
              onChangeText={setLocationInput}
            />

            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Description détaillée *"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateEvent}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Publier l'événement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageContent>
  );
};

// Écrans statiques
const VideosScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Vidéos" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Regardez nos vidéos éducatives et tutoriels.
    </Text>
  </PageContent>
);

const ArticlesScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Articles et Guides" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Apprenez de nouvelles compétences avec nos guides détaillés.
    </Text>
  </PageContent>
);

const BoutiqueScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Boutique" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Découvrez nos produits exclusifs et soutenez la communauté.
    </Text>
  </PageContent>
);

const CommunityScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Communauté" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Connectez-vous avec d'autres membres, partagez vos idées et collaborez.
    </Text>
  </PageContent>
);

// ====================================================================
// ÉCRAN PRINCIPAL
// ====================================================================
export default function ExploreScreen() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const colorScheme = useColorScheme();

  const lightTheme: Theme = {
    background: "#F0F2F5",
    card: "#FFFFFF",
    text: "#1C1E21",
    textSecondary: "#65676B",
    primary: "#007AFF",
    shadow: "rgba(0,0,0,0.1)",
    border: "#E4E6EB",
  };

  const darkTheme: Theme = {
    background: "#121212",
    card: "#1E1E1E",
    text: "#E4E6EB",
    textSecondary: "#B0B3B8",
    primary: "#0A84FF",
    shadow: "rgba(0,0,0,0.7)",
    border: "#2A2A2A",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  const handleGoBack = useCallback(() => {
    setCurrentPage(null);
  }, []);

  const pageComponents: { [key: string]: JSX.Element } = {
    events: <EventsScreen onGoBack={handleGoBack} theme={theme} />,
    videos: <VideosScreen onGoBack={handleGoBack} theme={theme} />,
    articles: <ArticlesScreen onGoBack={handleGoBack} theme={theme} />,
    boutique: <BoutiqueScreen onGoBack={handleGoBack} theme={theme} />,
    community: <CommunityScreen onGoBack={handleGoBack} theme={theme} />,
  };

  const renderGrid = (): JSX.Element => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Découvrez du nouveau contenu
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.cardsGrid}>
          {EXPLORE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, shadowColor: theme.shadow },
              ]}
              onPress={() => setCurrentPage(category.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardIcon, { color: theme.text }]}>
                {ICONS[category.iconName]}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {currentPage ? pageComponents[currentPage] : renderGrid()}
    </SafeAreaView>
  );
}

// ====================================================================
// STYLES
// ====================================================================
// ====================================================================
// STYLES
// ====================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20 },
  title: { fontSize: 32, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginTop: 4 },
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 20 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    aspectRatio: 1 / 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cardIcon: { fontSize: 40 },
  cardTitle: { marginTop: 12, fontSize: 15, fontWeight: "600" },
  pageContainer: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingTop: 10 },
  backButton: { padding: 5 },
  pageTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  pageScroll: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  pageParagraph: { fontSize: 16, lineHeight: 24 },
  
  // Événements
  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  addEventButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  emptyText: { textAlign: "center", marginTop: 30, fontSize: 15 },
  eventCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  eventHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  eventTitle: { fontSize: 18, fontWeight: "bold", flex: 1, marginRight: 10 },
  eventDetailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eventDetailText: { fontSize: 13, fontWeight: "500" },
  eventDescription: { fontSize: 14, marginTop: 8, lineHeight: 20 },

  // Modal Formulaire
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between", // Corrigé ici (camelCase)
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  submitButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});
*/































import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useColorScheme,
  BackHandler,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  RefreshControl,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import de votre instance Supabase
import { supabase } from "../../lib/supabase";

const EVENTS_CACHE_KEY = "ganbanaaxu_events_cache";

// Types
interface Theme {
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  primary: string;
  shadow: string;
  border: string;
}

interface PageContentProps {
  title?: string;
  onGoBack: () => void;
  children: React.ReactNode;
  theme: Theme;
}

interface ScreenProps {
  onGoBack: () => void;
  theme: Theme;
}

interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location?: string;
  user_id: string;
  created_at: string;
}

const ICONS: { [key: string]: string } = {
  events: "✨",
  videos: "🎬",
  articles: "📰",
  boutique: "🛒",
  community: "🤝",
};

const EXPLORE_CATEGORIES = [
  { id: "events", title: "Événements", iconName: "events" },
  //{ id: "videos", title: "Vidéos", iconName: "videos" },
  //{ id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

// ====================================================================
// WRAPPER DE PAGE (Gère le bouton retour physique)
// ====================================================================
const PageContent: React.FC<PageContentProps> = ({ title, onGoBack, children, theme }) => {
  useEffect(() => {
    const handleHardwareBackPress = () => {
      onGoBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleHardwareBackPress
    );

    return () => backHandler.remove();
  }, [onGoBack]);

  return (
    <View style={[styles.pageContainer, { backgroundColor: theme.background }]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="indigo" />
        </TouchableOpacity>
        {title && <Text style={[styles.pageTitle, { color: theme.text }]}>{title}</Text>}
      </View>
      <View style={styles.pageScroll}>{children}</View>
    </View>
  );
};

// ====================================================================
// COMPOSANT ÉVÉNEMENTS (AVEC ASYNCSTORAGE OFFLINE)
// ====================================================================
const EventsScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Informations utilisateur
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  // État du Formulaire de création
  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Utilitaire sécurisé pour sauvegarder dans le cache
  const saveEventsToCache = async (data: EventItem[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Erreur de sauvegarde du cache des événements", e);
    }
  };

  // Charger profil utilisateur & événements (depuis le cache d'abord, puis Supabase)
  const fetchUserDataAndEvents = async () => {
    try {
      // 1. Charger immédiatement le cache pour un affichage instantané hors-ligne
      const cachedEvents = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cachedEvents) {
        setEvents(JSON.parse(cachedEvents));
        setLoading(false);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUserId(session.user.id);

        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) {
          const roleText = (profile.role || "").toString().toLowerCase();
          const isSuper = profile.is_superuser === true || roleText === 'superuser';
          const isAdm = roleText === 'admin' || isSuper;

          setIsAdmin(isAdm);
          setIsSuperuser(isSuper);
        }
      }

      // 2. Récupérer les données fraîches depuis Supabase
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setEvents(data);
        saveEventsToCache(data); // Mettre à jour le cache local
      }
    } catch (error: any) {
      console.error("Erreur événements (mode hors-ligne potentiel) :", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserDataAndEvents();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserDataAndEvents();
  }, []);

  const handleCreateEvent = async () => {
    if (!titleInput.trim() || !descriptionInput.trim()) {
      Alert.alert("Erreur", "Veuillez remplir au moins le titre et la description.");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("events").insert([
        {
          title: titleInput.trim(),
          description: descriptionInput.trim(),
          event_date: dateInput.trim() || "Prochainement",
          location: locationInput.trim() || "Non spécifié",
          user_id: currentUserId,
        },
      ]).select();

      if (error) throw error;

      if (data && data.length > 0) {
        setEvents((prev) => {
          const newEvents = [data[0], ...prev];
          saveEventsToCache(newEvents);
          return newEvents;
        });
      }

      setTitleInput("");
      setDescriptionInput("");
      setDateInput("");
      setLocationInput("");
      setModalVisible(false);
      Alert.alert("Succès", "Événement publié avec succès !");
    } catch (error: any) {
      Alert.alert("Erreur", "Impossible de créer l'événement : " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = (eventId: string, ownerId: string) => {
    const isOwner = currentUserId === ownerId;
    const canDelete = isSuperuser || (isAdmin && isOwner);

    if (!canDelete) {
      Alert.alert("Action non autorisée", "Vous n'avez pas les droits pour supprimer cet événement.");
      return;
    }

    Alert.alert(
      "Supprimer l'événement",
      "Êtes-vous sûr de vouloir supprimer cet événement définitivement ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase.from("events").delete().eq("id", eventId);
              if (error) throw new Error(error.message);

              setEvents((prev) => {
                const newEvents = prev.filter((item) => item.id !== eventId);
                saveEventsToCache(newEvents);
                return newEvents;
              });
              Alert.alert("Succès", "L'événement a été supprimé.");
            } catch (error: any) {
              Alert.alert("Erreur de suppression", "Supabase a rejeté la demande : " + error.message);
            }
          },
        },
      ]
    );
  };

  const canCreate = isAdmin || isSuperuser;

  return (
    <PageContent title="Événements" onGoBack={onGoBack} theme={theme}>
      {canCreate && (
        <TouchableOpacity
          style={[styles.addEventButton, { backgroundColor: theme.primary }]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFF" />
          <Text style={styles.addEventButtonText}>Ajouter un événement</Text>
        </TouchableOpacity>
      )}

      {loading && events.length === 0 && !refreshing ? (
        <ActivityIndicator size="large" color="indigo" style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["indigo"]} />
          }
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
              Aucun événement à venir pour le moment.
            </Text>
          }
          renderItem={({ item }) => {
            const isOwner = currentUserId === item.user_id;
            const canDelete = isSuperuser || (isAdmin && isOwner);

            return (
              <View style={[styles.eventCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.eventHeader}>
                  <Text style={[styles.eventTitle, { color: theme.text }]}>{item.title}</Text>
                  {canDelete && (
                    <TouchableOpacity onPress={() => handleDeleteEvent(item.id, item.user_id)}>
                      <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                {item.event_date ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.event_date}
                    </Text>
                  </View>
                ) : null}

                {item.location ? (
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="location-outline" size={16} color="indigo" />
                    <Text style={[styles.eventDetailText, { color: theme.textSecondary }]}>
                      {item.location}
                    </Text>
                  </View>
                ) : null}

                <Text style={[styles.eventDescription, { color: theme.text }]}>
                  {item.description}
                </Text>
              </View>
            );
          }}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Nouvel événement</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Titre de l'événement *"
              placeholderTextColor={theme.textSecondary}
              value={titleInput}
              onChangeText={setTitleInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Date / Heure (ex: 15 Octobre à 18h)"
              placeholderTextColor={theme.textSecondary}
              value={dateInput}
              onChangeText={setDateInput}
            />

            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Lieu (ex: Dakar / En ligne)"
              placeholderTextColor={theme.textSecondary}
              value={locationInput}
              onChangeText={setLocationInput}
            />

            <TextInput
              style={[styles.input, styles.textArea, { color: theme.text, borderColor: theme.border }]}
              placeholder="Description détaillée *"
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              value={descriptionInput}
              onChangeText={setDescriptionInput}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: theme.primary }]}
              onPress={handleCreateEvent}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Publier l'événement</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </PageContent>
  );
};

// Écrans statiques
const VideosScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Vidéos" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Regardez nos vidéos éducatives et tutoriels.
    </Text>
  </PageContent>
);

const ArticlesScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Articles et Guides" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Apprenez de nouvelles compétences avec nos guides détaillés.
    </Text>
  </PageContent>
);

const BoutiqueScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Boutique" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Découvrez nos produits exclusifs et soutenez la communauté.
    </Text>
  </PageContent>
);

const CommunityScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Communauté" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Connectez-vous avec d'autres membres, partagez vos idées et collaborez.
    </Text>
  </PageContent>
);

// ====================================================================
// ÉCRAN PRINCIPAL (EXPLORE)
// ====================================================================
export default function ExploreScreen() {
  const [currentPage, setCurrentPage] = useState<string | null>(null);
  const [exploreEvents, setExploreEvents] = useState<EventItem[]>([]);
  const [loadingExploreEvents, setLoadingExploreEvents] = useState(true);
  const [refreshingExplore, setRefreshingExplore] = useState(false);

  const colorScheme = useColorScheme();

  const lightTheme: Theme = {
    background: "#F0F2F5",
    card: "#FFFFFF",
    text: "#1C1E21",
    textSecondary: "#65676B",
    primary: "#007AFF",
    shadow: "rgba(0,0,0,0.1)",
    border: "#E4E6EB",
  };

  const darkTheme: Theme = {
    background: "#121212",
    card: "#1E1E1E",
    text: "#E4E6EB",
    textSecondary: "#B0B3B8",
    primary: "#0A84FF",
    shadow: "rgba(0,0,0,0.7)",
    border: "#2A2A2A",
  };

  const theme = colorScheme === "dark" ? darkTheme : lightTheme;

  // Récupérer les événements pour les afficher directement dans l'accueil Explore
  const loadExploreEvents = async () => {
    try {
      // 1. Lire d'abord depuis AsyncStorage pour un affichage instantané
      const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) {
        setExploreEvents(JSON.parse(cached));
        setLoadingExploreEvents(false);
      }

      // 2. Fetcher la version réseau de Supabase
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setExploreEvents(data);
        await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.warn("Erreur chargement événements Explore:", err);
    } finally {
      setLoadingExploreEvents(false);
      setRefreshingExplore(false);
    }
  };

  useEffect(() => {
    loadExploreEvents();
  }, [currentPage]);

  const onRefreshExplore = useCallback(() => {
    setRefreshingExplore(true);
    loadExploreEvents();
  }, []);

  const handleGoBack = useCallback(() => {
    setCurrentPage(null);
  }, []);

  const pageComponents: { [key: string]: JSX.Element } = {
    events: <EventsScreen onGoBack={handleGoBack} theme={theme} />,
    videos: <VideosScreen onGoBack={handleGoBack} theme={theme} />,
    articles: <ArticlesScreen onGoBack={handleGoBack} theme={theme} />,
    boutique: <BoutiqueScreen onGoBack={handleGoBack} theme={theme} />,
    community: <CommunityScreen onGoBack={handleGoBack} theme={theme} />,
  };

  const renderGrid = (): JSX.Element => (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Explorer</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Découvrez du nouveau contenu
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshingExplore}
            onRefresh={onRefreshExplore}
            colors={["indigo"]}
          />
        }
      >
        {/* GRILLE DES CATÉGORIES */}
        <View style={styles.cardsGrid}>
          {EXPLORE_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.card,
                { backgroundColor: theme.card, shadowColor: theme.shadow },
              ]}
              onPress={() => setCurrentPage(category.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.cardIcon, { color: theme.text }]}>
                {ICONS[category.iconName]}
              </Text>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {category.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* SECTION APERÇU DES ÉVÉNEMENTS DÉJÀ CHARGÉS */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Événements à venir
          </Text>
          <TouchableOpacity onPress={() => setCurrentPage("events")}>
            <Text style={[styles.seeAllText, { color: theme.primary }]}>
              Voir tout ({exploreEvents.length})
            </Text>
          </TouchableOpacity>
        </View>

        {loadingExploreEvents && exploreEvents.length === 0 ? (
          <ActivityIndicator size="large" color="indigo" style={{ marginTop: 15 }} />
        ) : exploreEvents.length === 0 ? (
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Aucun événement disponible pour le moment.
          </Text>
        ) : (
          exploreEvents.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.eventCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={() => setCurrentPage("events")}
              activeOpacity={0.8}
            >
              <View style={styles.eventHeader}>
                <Text style={[styles.eventTitle, { color: theme.text }]}>
                  {item.title}
                </Text>
              </View>

              {item.event_date ? (
                <View style={styles.eventDetailRow}>
                  <Ionicons name="calendar-outline" size={16} color="indigo" />
                  <Text
                    style={[
                      styles.eventDetailText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {item.event_date}
                  </Text>
                </View>
              ) : null}

              {item.location ? (
                <View style={styles.eventDetailRow}>
                  <Ionicons name="location-outline" size={16} color="indigo" />
                  <Text
                    style={[
                      styles.eventDetailText,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {item.location}
                  </Text>
                </View>
              ) : null}

              <Text
                style={[styles.eventDescription, { color: theme.text }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      {currentPage ? pageComponents[currentPage] : renderGrid()}
    </SafeAreaView>
  );
}

// ====================================================================
// STYLES
// ====================================================================
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 15, paddingBottom: 10 },
  title: { fontSize: 32, fontWeight: "bold" },
  subtitle: { fontSize: 16, marginTop: 4 },
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 40 },
  cardsGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    aspectRatio: 1 / 1,
    borderRadius: 20,
    padding: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  cardIcon: { fontSize: 40 },
  cardTitle: { marginTop: 12, fontSize: 15, fontWeight: "600" },
  pageContainer: { flex: 1 },
  headerBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingTop: 10 },
  backButton: { padding: 5 },
  pageTitle: { fontSize: 20, fontWeight: "bold", marginLeft: 10 },
  pageScroll: { flex: 1, paddingHorizontal: 15, paddingTop: 10 },
  pageParagraph: { fontSize: 16, lineHeight: 24 },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 20, fontWeight: "bold" },
  seeAllText: { fontSize: 14, fontWeight: "600" },

  // Événements
  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 15,
    gap: 8,
  },
  addEventButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 15 },
  emptyText: { textAlign: "center", marginTop: 20, fontSize: 15 },
  eventCard: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  eventHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  eventTitle: { fontSize: 18, fontWeight: "bold", flex: 1, marginRight: 10 },
  eventDetailRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eventDetailText: { fontSize: 13, fontWeight: "500" },
  eventDescription: { fontSize: 14, marginTop: 8, lineHeight: 20 },

  // Modal Formulaire
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContainer: {
    borderRadius: 16,
    padding: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  textArea: { height: 90, textAlignVertical: "top" },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 5,
  },
  submitButtonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
});