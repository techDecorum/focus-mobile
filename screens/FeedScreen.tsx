import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function FeedScreen() {
  const { colors } = useTheme();
  const c = colors;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.accent }]}>COMMUNITY FEED</Text>
      <Text style={[styles.sub, { color: c.textMuted }]}>Coming soon...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, letterSpacing: 3 },
  sub: { fontSize: 13, marginTop: 8 },
});