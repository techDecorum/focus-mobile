import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  rightAction?: { label: string; onPress: () => void };
}

export default function PageHeader({ title, subtitle, rightAction }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.textSub }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.title}>{title}</Text>
        </View>
        {rightAction && (
          <TouchableOpacity onPress={rightAction.onPress} style={styles.rightBtn}>
            <Text style={styles.rightBtnText}>{rightAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'android'
      ? (StatusBar.currentHeight ?? 24) + 12
      : 56,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  left: { flex: 1 },
  subtitle: { fontSize: 10, letterSpacing: 3, color: 'rgba(240,250,246,0.55)', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '700', color: '#f0faf6', letterSpacing: -0.5 },
  rightBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: 'rgba(240,250,246,0.15)',
    borderWidth: 1, borderColor: 'rgba(240,250,246,0.2)',
  },
  rightBtnText: { color: '#f0faf6', fontSize: 12, fontWeight: '600' },
});