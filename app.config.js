

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










/*
export default {
  expo: {
    name: "Ganbanaaxu",
    slug: "Ganbanaaxu",
    version: "1.0.6",
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
      versionCode: 55, // N'oubliez pas de mettre 49 si Google Play refuse la version 48
      
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
*/






/*
export default {
  expo: {
    name: "Ganbanaaxu",
    slug: "Ganbanaaxu",
    version: "1.0.15",
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
      versionCode: 64,
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: "./assets/images/logoLiberty.png",
        backgroundColor: "#000000",
      },
      // 👇 SUPPRESSION DU TABLEAU RESTRICTIF
      // Expo ajoutera automatiquement : RECORD_AUDIO, READ_EXTERNAL_STORAGE, CAMERA, etc.
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
      "react-native-compressor",
      [
        "react-native-google-mobile-ads",
        {
          "androidAppId": "ca-app-pub-2071663229767228/8501336070",
          "iosAppId": "ca-app-pub-2071663229767228/8501336070"
        }
      ],
      [
        "expo-audio",
        {
          microphonePermission: "Autoriser l'accès au micro.",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Autoriser l'accès aux photos.",
          cameraPermission: "Autoriser l'accès à l'appareil photo."
        }
      ],
      "expo-document-picker",
      "expo-router",
      "expo-secure-store",
      "expo-video",
      "expo-asset",
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
*/


















export default {
  expo: {
    name: "Ganbanaaxu",
    slug: "Ganbanaaxu",
    version: "1.0.15",
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
      versionCode: 64,
      usesCleartextTraffic: true,
      adaptiveIcon: {
        foregroundImage: "./assets/images/logoLiberty.png",
        backgroundColor: "#000000",
      },
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
      "react-native-compressor",
      [
        "react-native-google-mobile-ads",
        {
          // 👇 REMPLACEZ CECI PAR L'ID AVEC LE TILDE (~)
          "androidAppId": "ca-app-pub-2071663229767228/8501336070", 
          /*"iosAppId": "ca-app-pub-2071663229767228~YYYYYYYYYY"*/
        }
      ],
      [
        "expo-audio",
        {
          microphonePermission: "Autoriser l'accès au micro.",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Autoriser l'accès aux photos.",
          cameraPermission: "Autoriser l'accès à l'appareil photo."
        }
      ],
      "expo-document-picker",
      "expo-router",
      "expo-secure-store",
      "expo-video",
      "expo-asset",
      "expo-font",
      "expo-image",
      "expo-sharing",
      "expo-status-bar",
      "expo-web-browser"
    ],
    extra: {
      // Les clés ici sont correctes si vous ne souhaitez pas utiliser de fichier .env pour l'instant
      supabaseUrl: "https://tuciyiawyawrhifpjmmn.supabase.co",
      supabaseAnonKey: "sb_publishable_HnPHoEeulclLH-AIHOhS-w_y9j6oZo1",
      eas: { projectId: "1dc64a7e-56a9-4a5a-9edb-25443f39a2f0" },
    },
    owner: "godapps",
  },
};



/*

git add .
git commit -m "un nouveau build de release" 
git push origin main
*/