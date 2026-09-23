












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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

// Import de votre instance Supabase
import { supabase } from "../../lib/supabase";

const EVENTS_CACHE_KEY = "ganbanaaxu_events_cache";

// ====================================================================
// CONFIGURATION PUBLICITÉS ADMOB (PRODUCTION & DÉVELOPPEMENT)
// ====================================================================
// En mode dev (__DEV__), les TestIDs Google AdMob sont utilisés automatiquement.
// Pour passer en PRODUCTION, remplacez simplement les valeurs "ca-app-pub-..." ci-dessous.

const EXPLORE_BANNER_AD_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_EXPLORE_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_EXPLORE_ID",
      default: TestIds.BANNER,
    });

const EVENTS_BANNER_AD_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_EVENTS_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_EVENTS_ID",
      default: TestIds.BANNER,
    });

const ARTICLES_BANNER_AD_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_ARTICLES_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_ARTICLES_ID",
      default: TestIds.BANNER,
    });

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
  { id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

// ====================================================================
// WRAPPER DE PAGE
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
// COMPOSANT ÉVÉNEMENTS
// ====================================================================
const EventsScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const saveEventsToCache = async (data: EventItem[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Erreur de sauvegarde du cache", e);
    }
  };

  const fetchUserDataAndEvents = async () => {
    try {
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

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setEvents(data);
        saveEventsToCache(data);
      }
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
              Alert.alert("Erreur de suppression", error.message);
            }
          },
        },
      ]
    );
  };

  const canCreate = isAdmin || isSuperuser;

  return (
    <PageContent title="Événements" onGoBack={onGoBack} theme={theme}>
      <View style={{ flex: 1 }}>
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
            style={{ flex: 1 }}
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
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

    
      <View style={[styles.adContainerBottom, { borderColor: theme.border }]}>
        <BannerAd
          unitId={EVENTS_BANNER_AD_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>

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
    <View style={{ flex: 1, justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
          Apprenez de nouvelles compétences avec nos guides détaillés.
        </Text>
      </View>

      
      <View style={[styles.adContainerBottom, { borderColor: theme.border }]}>
        <BannerAd
          unitId={ARTICLES_BANNER_AD_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </View>
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

  const loadExploreEvents = async () => {
    try {
      const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) {
        setExploreEvents(JSON.parse(cached));
        setLoadingExploreEvents(false);
      }

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

        <View style={styles.adContainer}>
          <BannerAd
            unitId={EXPLORE_BANNER_AD_ID}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>

      
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

  // Publicités
  adContainer: {
    alignItems: "center",
    marginVertical: 15,
  },
  adContainerBottom: {
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    marginTop: "auto",
  },

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
  Image as RNImage,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";

// Import de votre instance Supabase
import { supabase } from "../../lib/supabase";

const EVENTS_CACHE_KEY = "ganbanaaxu_events_cache";

// ====================================================================
// CONFIGURATION PUBLICITÉS ADMOB (PRODUCTION & DÉVELOPPEMENT)
// ====================================================================

const EXPLORE_NATIVE_AD_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_EXPLORE_NATIVE_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_EXPLORE_NATIVE_ID",
      default: TestIds.NATIVE,
    });

const EVENTS_BANNER_AD_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_EVENTS_BANNER_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_EVENTS_BANNER_ID",
      default: TestIds.BANNER,
    });

const ARTICLES_BANNER_AD_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_ARTICLES_BANNER_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_ARTICLES_BANNER_ID",
      default: TestIds.BANNER,
    });

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
  { id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

// ====================================================================
// COMPOSANT NATIVE AD (IDENTIQUE A INDEX.TSX)
// ====================================================================
const CustomNativeAd = React.memo(
  ({
    isDark,
    adUnitId,
    theme,
  }: {
    isDark: boolean;
    adUnitId: string;
    theme: Theme;
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

    // Mode Skeleton pendant le chargement
    if (!nativeAd) {
      return (
        <View
          style={[
            styles.nativeAdCard,
            { backgroundColor: theme.card, borderColor: theme.border, opacity: 0.5 },
          ]}
        >
          <View style={styles.nativeAdHeader}>
            <View
              style={[
                styles.nativeAdIcon,
                { backgroundColor: isDark ? "#333" : "#E0E0E0" },
              ]}
            />
            <View style={styles.nativeAdTextContainer}>
              <View
                style={{
                  height: 15,
                  width: "80%",
                  backgroundColor: isDark ? "#333" : "#E0E0E0",
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <View
                style={{
                  height: 12,
                  width: "50%",
                  backgroundColor: isDark ? "#333" : "#E0E0E0",
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
          <View
            style={[
              styles.nativeAdMedia,
              { backgroundColor: isDark ? "#333" : "#E0E0E0" },
            ]}
          />
          <View style={{ marginTop: 4 }}>
            <View
              style={[
                styles.nativeAdButton,
                { backgroundColor: isDark ? "#333" : "#E0E0E0" },
              ]}
            />
          </View>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.nativeAdCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        <NativeAdView nativeAd={nativeAd} style={{ width: "100%" }}>
          <View style={styles.nativeAdHeader}>
            {nativeAd.icon && (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <RNImage
                  source={{ uri: nativeAd.icon.url }}
                  style={styles.nativeAdIcon}
                />
              </NativeAsset>
            )}
            <View style={styles.nativeAdTextContainer}>
              {nativeAd.headline && (
                <NativeAsset assetType={NativeAssetType.HEADLINE}>
                  <Text style={[styles.nativeAdHeadline, { color: theme.text }]}>
                    {nativeAd.headline}
                  </Text>
                </NativeAsset>
              )}
              {nativeAd.body && (
                <NativeAsset assetType={NativeAssetType.BODY}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.nativeAdTagline,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {nativeAd.body}
                  </Text>
                </NativeAsset>
              )}
            </View>
            <View style={styles.nativeAdBadge}>
              <Text style={styles.nativeAdBadgeText}>Annonce</Text>
            </View>
          </View>

          <NativeMediaView style={styles.nativeAdMedia} />

          {nativeAd.callToAction && (
            <View style={{ marginTop: 4 }}>
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <View
                  style={[
                    styles.nativeAdButton,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <Text style={styles.nativeAdButtonText}>
                    {nativeAd.callToAction}
                  </Text>
                </View>
              </NativeAsset>
            </View>
          )}
        </NativeAdView>
      </View>
    );
  }
);

// ====================================================================
// WRAPPER DE PAGE
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
// COMPOSANT ÉVÉNEMENTS
// ====================================================================
const EventsScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const saveEventsToCache = async (data: EventItem[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Erreur de sauvegarde du cache", e);
    }
  };

  const fetchUserDataAndEvents = async () => {
    try {
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

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setEvents(data);
        saveEventsToCache(data);
      }
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
              Alert.alert("Erreur de suppression", error.message);
            }
          },
        },
      ]
    );
  };

  const canCreate = isAdmin || isSuperuser;

  return (
    <PageContent title="Événements" onGoBack={onGoBack} theme={theme}>
      <View style={{ flex: 1 }}>
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
            style={{ flex: 1 }}
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
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

   
      <View style={[styles.adContainerBottom, { borderColor: theme.border }]}>
        <BannerAd
          unitId={EVENTS_BANNER_AD_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>

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
    <View style={{ flex: 1, justifyContent: "space-between" }}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
          Apprenez de nouvelles compétences avec nos guides détaillés.
        </Text>
      </View>

      <View style={[styles.adContainerBottom, { borderColor: theme.border }]}>
        <BannerAd
          unitId={ARTICLES_BANNER_AD_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </View>
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

  const loadExploreEvents = async () => {
    try {
      const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) {
        setExploreEvents(JSON.parse(cached));
        setLoadingExploreEvents(false);
      }

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

        <CustomNativeAd
          isDark={colorScheme === "dark"}
          adUnitId={EXPLORE_NATIVE_AD_ID}
          theme={theme}
        />

       
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

  // Publicités
  adContainerBottom: {
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    marginTop: "auto",
  },

  // Native Ad Style
  nativeAdCard: {
    width: "100%",
    borderRadius: 16,
    padding: 12,
    marginVertical: 15,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  nativeAdHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  nativeAdIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#CCC",
  },
  nativeAdTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  nativeAdHeadline: {
    fontWeight: "bold",
    fontSize: 15,
  },
  nativeAdTagline: {
    fontSize: 12,
    marginTop: 2,
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
    fontWeight: "bold",
  },
  nativeAdMedia: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    marginVertical: 8,
  },
  nativeAdButton: {
    width: "100%",
    height: 38,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  nativeAdButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },

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
  Platform,
  Image as RNImage,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  TestIds,
  NativeAd,
  NativeAdView,
  NativeAsset,
  NativeAssetType,
  NativeMediaView,
} from "react-native-google-mobile-ads";

// Import de votre instance Supabase
import { supabase } from "../../lib/supabase";

const EVENTS_CACHE_KEY = "ganbanaaxu_events_cache";

// ====================================================================
// CONFIGURATION PUBLICITÉS ADMOB (PRODUCTION & DÉVELOPPEMENT)
// ====================================================================
const EXPLORE_NATIVE_AD_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_EXPLORE_NATIVE_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_EXPLORE_NATIVE_ID",
      default: TestIds.NATIVE,
    });

const EVENTS_NATIVE_AD_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_EVENTS_NATIVE_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_EVENTS_NATIVE_ID",
      default: TestIds.NATIVE,
    });

const ARTICLES_NATIVE_AD_ID = __DEV__
  ? TestIds.NATIVE
  : Platform.select({
      ios: "ca-app-pub-XXXXXXXXXXXXXXXX/IOS_ARTICLES_NATIVE_ID",
      android: "ca-app-pub-XXXXXXXXXXXXXXXX/ANDROID_ARTICLES_NATIVE_ID",
      default: TestIds.NATIVE,
    });

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
  hideScroll?: boolean;
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
  { id: "articles", title: "Articles", iconName: "articles" },
  //{ id: "boutique", title: "Boutique", iconName: "boutique" },
  //{ id: "community", title: "Communauté", iconName: "community" },
];

// ====================================================================
// COMPOSANT NATIVE AD (Standard et Compact)
// ====================================================================
const CustomNativeAd = React.memo(
  ({
    isDark,
    adUnitId,
    theme,
    compact = false, // Par défaut: format normal (Explorer)
  }: {
    isDark: boolean;
    adUnitId: string;
    theme: Theme;
    compact?: boolean;
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

    const cardMargin = compact ? 0 : 15;
    const mediaHeight = compact ? 120 : 160;
    const btnHeight = compact ? 34 : 38;

    // SKELETON (chargement instantané)
    if (!nativeAd) {
      return (
        <View
          style={[
            styles.nativeAdCard,
            { 
              backgroundColor: theme.card, 
              borderColor: theme.border, 
              opacity: 0.5,
              marginVertical: cardMargin
            },
          ]}
        >
          <View style={styles.nativeAdHeader}>
            <View
              style={[
                styles.nativeAdIcon,
                { backgroundColor: isDark ? "#333" : "#E0E0E0" },
              ]}
            />
            <View style={styles.nativeAdTextContainer}>
              <View
                style={{
                  height: 15,
                  width: "80%",
                  backgroundColor: isDark ? "#333" : "#E0E0E0",
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <View
                style={{
                  height: 12,
                  width: "50%",
                  backgroundColor: isDark ? "#333" : "#E0E0E0",
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
          <View
            style={[
              styles.nativeAdMedia,
              { backgroundColor: isDark ? "#333" : "#E0E0E0", height: mediaHeight },
            ]}
          />
          <View style={{ marginTop: 4 }}>
            <View
              style={[
                styles.nativeAdButton,
                { backgroundColor: isDark ? "#333" : "#E0E0E0", height: btnHeight },
              ]}
            />
          </View>
        </View>
      );
    }

    // ANNONCE CHARGÉE
    return (
      <View
        style={[
          styles.nativeAdCard,
          { 
            backgroundColor: theme.card, 
            borderColor: theme.border,
            marginVertical: cardMargin
          },
        ]}
      >
        <NativeAdView nativeAd={nativeAd} style={{ width: "100%" }}>
          <View style={styles.nativeAdHeader}>
            {nativeAd.icon && (
              <NativeAsset assetType={NativeAssetType.ICON}>
                <RNImage
                  source={{ uri: nativeAd.icon.url }}
                  style={styles.nativeAdIcon}
                />
              </NativeAsset>
            )}
            <View style={styles.nativeAdTextContainer}>
              {nativeAd.headline && (
                <NativeAsset assetType={NativeAssetType.HEADLINE}>
                  <Text style={[styles.nativeAdHeadline, { color: theme.text }]}>
                    {nativeAd.headline}
                  </Text>
                </NativeAsset>
              )}
              {nativeAd.body && (
                <NativeAsset assetType={NativeAssetType.BODY}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.nativeAdTagline,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {nativeAd.body}
                  </Text>
                </NativeAsset>
              )}
            </View>
            <View style={styles.nativeAdBadge}>
              <Text style={styles.nativeAdBadgeText}>Annonce</Text>
            </View>
          </View>

          <NativeMediaView style={[styles.nativeAdMedia, { height: mediaHeight }]} />

          {nativeAd.callToAction && (
            <View style={{ marginTop: 4 }}>
              <NativeAsset assetType={NativeAssetType.CALL_TO_ACTION}>
                <View
                  style={[
                    styles.nativeAdButton,
                    { backgroundColor: theme.primary, height: btnHeight },
                  ]}
                >
                  <Text style={styles.nativeAdButtonText}>
                    {nativeAd.callToAction}
                  </Text>
                </View>
              </NativeAsset>
            </View>
          )}
        </NativeAdView>
      </View>
    );
  }
);

// ====================================================================
// WRAPPER DE PAGE
// ====================================================================
const PageContent: React.FC<PageContentProps> = ({ title, onGoBack, children, theme, hideScroll = false }) => {
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
      
      {/* Si hideScroll est true (ex: pour la FlatList dans Events), on n'utilise pas le ScrollView du Wrapper */}
      {hideScroll ? (
        <View style={{ flex: 1, paddingHorizontal: 15, paddingTop: 10 }}>{children}</View>
      ) : (
        <ScrollView style={styles.pageScroll}>{children}</ScrollView>
      )}
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

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperuser, setIsSuperuser] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [descriptionInput, setDescriptionInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isDark = theme.background === "#121212";

  const saveEventsToCache = async (data: EventItem[]) => {
    try {
      await AsyncStorage.setItem(EVENTS_CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn("Erreur de sauvegarde du cache", e);
    }
  };

  const fetchUserDataAndEvents = async () => {
    try {
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

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      if (data) {
        setEvents(data);
        saveEventsToCache(data);
      }
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
              Alert.alert("Erreur de suppression", error.message);
            }
          },
        },
      ]
    );
  };

  const canCreate = isAdmin || isSuperuser;

  // On injecte la pub native au milieu de la liste (ex: après le 2ème élément)
  const renderEventsWithAds = () => {
    if (events.length === 0) return [];
    
    let mixedData: any[] = [...events];
    if (mixedData.length >= 2) {
      mixedData.splice(2, 0, { isAd: true, id: 'event-ad-1' });
    } else {
      mixedData.push({ isAd: true, id: 'event-ad-1' });
    }
    return mixedData;
  };

  return (
    <PageContent title="Événements" onGoBack={onGoBack} theme={theme} hideScroll={true}>
      <View style={{ flex: 1 }}>
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
            style={{ flex: 1 }}
            data={renderEventsWithAds()}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["indigo"]} />
            }
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Aucun événement à venir pour le moment.
              </Text>
            }
            renderItem={({ item }) => {
              if (item.isAd) {
                return (
                  <View style={{ marginBottom: 12 }}>
                    <CustomNativeAd
                      isDark={isDark}
                      adUnitId={EVENTS_NATIVE_AD_ID}
                      theme={theme}
                      compact={true} // Format réduit
                    />
                  </View>
                );
              }

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
      </View>

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

// ====================================================================
// ÉCRANS STATIQUES
// ====================================================================
const VideosScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => (
  <PageContent title="Vidéos" onGoBack={onGoBack} theme={theme}>
    <Text style={[styles.pageParagraph, { color: theme.textSecondary }]}>
      Regardez nos vidéos éducatives et tutoriels.
    </Text>
  </PageContent>
);

const ArticlesScreen: React.FC<ScreenProps> = ({ onGoBack, theme }) => {
  const isDark = theme.background === "#121212";
  
  return (
    <PageContent title="Articles et Guides" onGoBack={onGoBack} theme={theme}>
      <Text style={[styles.pageParagraph, { color: theme.textSecondary, marginBottom: 20 }]}>
        Apprenez de nouvelles compétences avec nos guides détaillés. (Contenu à venir)
      </Text>

      {/* PUB NATIVE DANS ARTICLES */}
      <CustomNativeAd
        isDark={isDark}
        adUnitId={ARTICLES_NATIVE_AD_ID}
        theme={theme}
        compact={true} 
      />
    </PageContent>
  );
};

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
  const isDark = colorScheme === "dark";

  const loadExploreEvents = async () => {
    try {
      const cached = await AsyncStorage.getItem(EVENTS_CACHE_KEY);
      if (cached) {
        setExploreEvents(JSON.parse(cached));
        setLoadingExploreEvents(false);
      }

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
        showsVerticalScrollIndicator={false}
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

        {/* PUBLICITÉ NATIVE DANS EXPLORER (FORMAT NORMAL) */}
        <CustomNativeAd
          isDark={isDark}
          adUnitId={EXPLORE_NATIVE_AD_ID}
          theme={theme}
          compact={false}
        />

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

  // Native Ad Style
  nativeAdCard: {
    width: "100%",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  nativeAdHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  nativeAdIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#CCC",
  },
  nativeAdTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  nativeAdHeadline: {
    fontWeight: "bold",
    fontSize: 15,
  },
  nativeAdTagline: {
    fontSize: 12,
    marginTop: 2,
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
    fontWeight: "bold",
  },
  nativeAdMedia: {
    width: "100%",
    borderRadius: 8,
    marginVertical: 8,
  },
  nativeAdButton: {
    width: "100%",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  nativeAdButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },

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






