import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export type Screen = 'home' | 'feed' | 'library' | 'history' | 'settings';

interface Props {
  active: Screen;
  onNavigate: (screen: Screen) => void;
}

const TABS = [
  { id: 'feed',     emoji: '🌐', label: 'Feed'     },
  { id: 'library',  emoji: '🎵', label: 'Music'    },
  { id: 'home',     emoji: '⚡', label: 'Focus',   center: true },
  { id: 'history',  emoji: '📋', label: 'History'  },
  { id: 'settings', emoji: '☰',  label: 'Settings' },
] as const;

export default function BottomNav({ active, onNavigate }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.navBg, borderTopColor: colors.navBorder }]}>
      {TABS.map(tab => {
        const isCenter = 'center' in tab && tab.center;
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, isCenter && styles.centerTab]}
            onPress={() => onNavigate(tab.id as Screen)}
          >
            {isCenter ? (
              <View style={[
                styles.centerBtn,
                { borderColor: colors.accentDark, backgroundColor: `${colors.accent}22` },
                isActive && { borderColor: colors.accent, backgroundColor: `${colors.accent}33` },
              ]}>
                <Text style={styles.centerEmoji}>{tab.emoji}</Text>
              </View>
            ) : (
              <Text style={[
                styles.emoji,
                isActive && { color: colors.accent },
              ]}>
                {tab.emoji}
              </Text>
            )}
            <Text style={[styles.label, { color: colors.textMuted }, isActive && { color: colors.accent }]}>
              {tab.label}
            </Text>
            {isActive && !isCenter && <View style={[styles.dot, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  centerTab: { alignItems: 'center', marginTop: -20 },
  centerBtn: {
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  centerEmoji: { fontSize: 20 },  // ✅ matched to regular emoji size
  emoji: { fontSize: 20 },
  label: { fontSize: 10, letterSpacing: 1 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});