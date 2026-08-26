

/*

export default {
  expo: {
    name: "Ganbanaaxu",
    slug: "Ganbanaaxu",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/logoLiberty.png",
    scheme: "ganbanaaxu",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.godapps.Ganbanaaxu",
    },
    android: {
      package: "com.godapps.Ganbanaaxu",
      googleServicesFile: "./google-services.json",
      versionCode: 48,
      targetSdkVersion: 36,
      compileSdkVersion: 36,
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: "./assets/images/logoLiberty.png",
        backgroundColor: "#000000",
      },
      permissions: ["android.permission.RECORD_AUDIO"],
      // ==========================================
      // AJOUT DES INTENT FILTERS ICI 👇
      // ==========================================
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "https",
              host: "ganbanaaxu.app",
              pathPrefix: "/post"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
      // ==========================================
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logoLiberty.png",
          resizeMode: "contain",
          backgroundColor: "#000000",
          imageWidth: 200,
          enableFullScreenImage_experimental: true,
          dark: {
            image: "./assets/images/logoLiberty.png",
            backgroundColor: "#000000",
             [
    "expo-font",
    "expo-image",
    "expo-sharing",
    "expo-status-bar",
    "expo-web-browser"
  ]

          },
        },
      ],
      "expo-image-picker",
      "expo-document-picker",
      "expo-router",
      "expo-secure-store",
      "expo-video",
      "expo-av",
      "expo-asset",
    ],
    extra: {
      supabaseUrl: "https://tuciyiawyawrhifpjmmn.supabase.co",
      supabaseAnonKey: "sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1",
      eas: { projectId: "1dc64a7e-56a9-4a5a-9edb-25443f39a2f0" },
    },
    owner: "godapps",
  },
};
*/











export default {
  expo: {
    name: "Ganbanaaxu",
    slug: "Ganbanaaxu",
    version: "1.0.5",
    orientation: "portrait",
    icon: "./assets/images/logoLiberty.png",
    scheme: "ganbanaaxu",
    userInterfaceStyle: "automatic",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.godapps.Ganbanaaxu",
    },
    android: {
      package: "com.godapps.Ganbanaaxu",
      googleServicesFile: "./google-services.json",
      versionCode: 54, // N'oubliez pas de mettre 49 si Google Play refuse la version 48
      /*targetSdkVersion: 36,
      compileSdkVersion: 36,*/
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: "./assets/images/logoLiberty.png",
        backgroundColor: "#000000",
      },
      permissions: ["android.permission.RECORD_AUDIO"],
      // ==========================================
      // AJOUT DES INTENT FILTERS ICI 👇
      // ==========================================
      intentFilters: [
        {
          action: "VIEW",
          data: [
            {
              scheme: "https",
              host: "ganbanaaxu.app",
              pathPrefix: "/post"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
      // ==========================================
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logoLiberty.png",
          resizeMode: "contain",
          backgroundColor: "#000000",
          imageWidth: 200,
          enableFullScreenImage_experimental: true,
          dark: {
            image: "./assets/images/logoLiberty.png",
            backgroundColor: "#000000",
          },
        },
      ],
      [
    "react-native-compressor"
  ],

      [
    "expo-audio",
    {
      "microphonePermission": "Autoriser l'accès au micro.",
      "recordAudioAndroid": true
    }
  ],
      "expo-image-picker",
      "expo-document-picker",
      "expo-router",
      "expo-secure-store",
      "expo-video",
      
      "expo-asset",
      // 👇 Les plugins manquants ont été rajoutés ici correctement
      "expo-font",
      "expo-image",
      "expo-sharing",
      "expo-status-bar",
      "expo-web-browser"
    ],
    extra: {
      supabaseUrl: "https://tuciyiawyawrhifpjmmn.supabase.co",
      supabaseAnonKey: "sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1",
      eas: { projectId: "1dc64a7e-56a9-4a5a-9edb-25443f39a2f0" },
    },
    owner: "godapps",
  },
};