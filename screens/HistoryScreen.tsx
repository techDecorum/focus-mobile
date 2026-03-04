import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

interface HistoryEntry {
  id: string;
  taskNote: string;
  duration: number;
  stakeAmount: number;
  reward: number;
  status: 'completed' | 'abandoned';
  date: string;
  txSignature: string | null;
}

export default function HistoryScreen() {
  const { colors } = useTheme();
  const c = colors;
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'abandoned'>('all');

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('focus_history');
      if (data) setHistory(JSON.parse(data));
    } catch (err) {
      console.log('Failed to load history:', err);
    }
  };

  useEffect(() => { loadHistory(); }, []);

  const filtered = filter === 'all' ? history : history.filter(h => h.status === filter);
  const totalCompleted = history.filter(h => h.status === 'completed').length;
  const totalMinutes = history.filter(h => h.status === 'completed').reduce((acc, h) => acc + h.duration, 0);
  const totalStaked = history.filter(h => h.status === 'completed').reduce((acc, h) => acc + h.stakeAmount, 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.pageLabel, { color: c.textSub }]}>SESSION HISTORY</Text>
      <Text style={[styles.pageTitle, { color: c.text }]}>Your Focus Record</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: `${c.accent}0d`, borderColor: `${c.accent}22` }]}>
          <Text style={[styles.statValue, { color: c.accent }]}>{totalCompleted}</Text>
          <Text style={[styles.statLabel, { color: c.textSub }]}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: `${c.accent}0d`, borderColor: `${c.accent}22` }]}>
          <Text style={[styles.statValue, { color: c.accent }]}>{totalMinutes}</Text>
          <Text style={[styles.statLabel, { color: c.textSub }]}>Minutes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: `${c.accent}0d`, borderColor: `${c.accent}22` }]}>
          <Text style={[styles.statValue, { color: c.accent }]}>{totalStaked.toFixed(3)}</Text>
          <Text style={[styles.statLabel, { color: c.textSub }]}>SOL Staked</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'completed', 'abandoned'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              { borderColor: c.cardBorder },
              filter === f && { borderColor: c.accent, backgroundColor: `${c.accent}15` },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text style={[
              styles.filterText,
              { color: c.textSub },
              filter === f && { color: c.accent },
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Entries */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={[styles.emptyText, { color: c.text }]}>No sessions yet</Text>
          <Text style={[styles.emptySubtext, { color: c.textSub }]}>Complete a focus session to see it here</Text>
        </View>
      ) : (
        filtered.map(entry => (
          <View
            key={entry.id}
            style={[
              styles.entry,
              { borderColor: `${c.accent}22`, backgroundColor: `${c.accent}08` },
              entry.status === 'abandoned' && { borderColor: 'rgba(248,113,113,0.2)', backgroundColor: 'rgba(248,113,113,0.05)' },
            ]}
          >
            <View style={styles.entryHeader}>
              <Text style={styles.entryEmoji}>{entry.status === 'completed' ? '✅' : '❌'}</Text>
              <Text style={[styles.entryTask, { color: c.text }]} numberOfLines={1}>
                {entry.taskNote || 'Untitled session'}
              </Text>
              <Text style={[
                styles.entryStatus,
                { color: c.accent },
                entry.status === 'abandoned' && { color: '#f87171' },
              ]}>
                {entry.status === 'completed' ? 'Done' : 'Quit'}
              </Text>
            </View>
            <View style={styles.entryDetails}>
              <Text style={[styles.entryDetail, { color: c.textSub }]}>⏱ {entry.duration} min</Text>
              <Text style={[styles.entryDetail, { color: c.textSub }]}>💎 {entry.stakeAmount} SOL</Text>
              {entry.reward > 0 && (
                <Text style={[styles.entryDetail, { color: '#fbbf24' }]}>+{entry.reward.toFixed(4)} SOL</Text>
              )}
              <Text style={[styles.entryDate, { color: c.textMuted }]}>{formatDate(entry.date)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  pageLabel: { fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 10, letterSpacing: 1, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 13, marginTop: 8 },
  entry: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  entryEmoji: { fontSize: 16, marginRight: 8 },
  entryTask: { flex: 1, fontSize: 14, fontWeight: '500' },
  entryStatus: { fontSize: 11, letterSpacing: 1 },
  entryDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  entryDetail: { fontSize: 12 },
  entryDate: { fontSize: 11, marginLeft: 'auto' },
});