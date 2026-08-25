



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