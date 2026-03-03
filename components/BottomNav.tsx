import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

export type Screen = 'home' | 'feed' | 'library' | 'history' | 'settings';

interface Props {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

const TABS = [
  { id: 'home',     emoji: '⚡', label: 'Focus'   },
  { id: 'feed',     emoji: '🌐', label: 'Feed'    },
  { id: 'library',  emoji: '🎵', label: 'Music'   },
  { id: 'history',  emoji: '📋', label: 'History' },
  { id: 'settings', emoji: '⚙️', label: 'Settings'},
] as const;

export default function BottomNav({ active, onNavigate }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => onNavigate(tab.id as Screen)}
        >
          <Text style={styles.emoji}>{tab.emoji}</Text>
          <Text style={[styles.label, active === tab.id && styles.labelActive]}>
            {tab.label}
          </Text>
          {active === tab.id && <View style={styles.dot} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#060d12',
    borderTopWidth: 1,
    borderTopColor: 'rgba(77,217,172,0.1)',
    paddingBottom: 20,
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  emoji: { fontSize: 20 },
  label: { color: '#4a7a6a', fontSize: 10, letterSpacing: 1 },
  labelActive: { color: '#4dd9ac' },
  dot: {
    width: 4, height: 4,
    borderRadius: 2,
    backgroundColor: '#4dd9ac',
    marginTop: 2,
  },
});