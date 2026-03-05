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
  { id: 'settings', emoji: '⚙️', label: 'Settings' },
] as const;

export default function BottomNav({ active, onNavigate }: Props) {
  const { colors: c } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: c.navBg, borderTopColor: c.navBorder }]}>
      {TABS.map(tab => {
        const isCenter = 'center' in tab && tab.center;
        const isActive = active === tab.id;

        if (isCenter) {
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.centerTab}
              onPress={() => onNavigate(tab.id as Screen)}
              activeOpacity={0.75}
            >
              <View style={[
                styles.centerBtn,
                { borderColor: c.accentDark, backgroundColor: `${c.accent}18` },
                isActive && { borderColor: c.accent, backgroundColor: `${c.accent}30` },
              ]}>
                <Text style={styles.centerEmoji}>{tab.emoji}</Text>
              </View>
              {/* FIX 5: larger label, weighted when active */}
              <Text style={[styles.label, { color: isActive ? c.accent : c.textMuted },
                isActive && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onNavigate(tab.id as Screen)}
            activeOpacity={0.75}
          >
            {/* FIX 5: pill background on active icon so inactive icons look visually distinct */}
            <View style={[
              styles.iconWrap,
              isActive && { backgroundColor: `${c.accent}18`, borderRadius: 14 },
            ]}>
              {/* FIX 5: opacity dimming on inactive so active/inactive are clearly different */}
              <Text style={[styles.emoji, { opacity: isActive ? 1 : 0.45 }]}>
                {tab.emoji}
              </Text>
            </View>
            <Text style={[
              styles.label,
              { color: isActive ? c.accent : c.textMuted },
              isActive && styles.labelActive,
            ]}>
              {tab.label}
            </Text>
            {isActive && <View style={[styles.dot, { backgroundColor: c.accent }]} />}
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
    paddingBottom: 22,
    paddingTop: 10,
    alignItems: 'flex-end',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  centerTab: {
    flex: 1,
    alignItems: 'center',
    marginTop: -22,
    gap: 4,
  },
  centerBtn: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  centerEmoji: { fontSize: 22 },
  iconWrap: {
    width: 42, height: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 22 },
  // FIX 5: bumped from 10 → 11.5, tightened letter-spacing
  label: { fontSize: 11.5, letterSpacing: 0.2 },
  labelActive: { fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
});