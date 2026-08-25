// This file is a fallback for using MaterialIcons on Android and web.
/*
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // See MaterialIcons here: https://icons.expo.fyi
  // See SF Symbols in the SF Symbols app on Mac.
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'person.fill.and.arrow.left.and.arrow.right.outward': 'person',
  'video': 'videocam',
  'play':'play-arrow',
  'explore':'explore',
  'chat':'chat'
  
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;


export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]}  />;
}
*/






// This file is a fallback for using MaterialIcons on Android and web.
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Mapping complet des icônes SF Symbols vers MaterialIcons
const MAPPING = {
  // 🏠 Accueil
  'house.fill': 'home',
  'house': 'home',

  // 🔍 Recherche
  'magnifyingglass': 'search',
  'magnifyingglass.circle': 'search',
  'magnifyingglass.circle.fill': 'search',

  // 💬 Chat/Messages
  'bubble.left': 'chat',
  'bubble.left.fill': 'chat',
  'bubble.right': 'forum',
  'bubble.right.fill': 'forum',
  'chat': 'chat',
  'message': 'message',

  // 👤 Profil
  'person': 'person',
  'person.fill': 'person',
  'person.circle': 'account-circle',
  'person.circle.fill': 'account-circle',
  'person.fill.and.arrow.left.and.arrow.right.outward': 'sync-alt',

  // 📤 Autres
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'video': 'videocam',
  'play': 'play-arrow',
  'explore': 'explore',
  'plus': 'add',
  'plus.circle': 'add-circle',
  'plus.circle.fill': 'add-circle',
  'gear': 'settings',
  'gear.fill': 'settings',
  'bell': 'notifications',
  'bell.fill': 'notifications',
  'heart': 'favorite-border',
  'heart.fill': 'favorite',
  'star': 'star-border',
  'star.fill': 'star',
  'pencil': 'edit',
  'trash': 'delete',
  'trash.fill': 'delete-forever',
  'arrow.left': 'arrow-back',
  'arrow.right': 'arrow-forward',
  'xmark': 'close',
  'checkmark': 'check',
  'checkmark.circle': 'check-circle',
  'checkmark.circle.fill': 'check-circle',
} as Partial<Record<import('expo-symbols').SymbolViewProps['name'], React.ComponentProps<typeof MaterialIcons>['name']>>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * Composant d'icône qui utilise :
 * - SFSymbols sur iOS (automatiquement via expo-symbols)
 * - MaterialIcons sur Android et Web (via ce mapping)
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
