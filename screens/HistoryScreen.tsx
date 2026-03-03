import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const totalReward = history.filter(h => h.status === 'completed').reduce((acc, h) => acc + h.reward, 0);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageLabel}>SESSION HISTORY</Text>
      <Text style={styles.pageTitle}>Your Focus Record</Text>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalCompleted}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalMinutes}</Text>
          <Text style={styles.statLabel}>Minutes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#fbbf24' }]}>{totalReward.toFixed(3)}</Text>
          <Text style={styles.statLabel}>SOL Earned</Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'completed', 'abandoned'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Entries */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptySubtext}>Complete a focus session to see it here</Text>
        </View>
      ) : (
        filtered.map(entry => (
          <View key={entry.id} style={[styles.entry, entry.status === 'abandoned' && styles.entryAbandoned]}>
            <View style={styles.entryHeader}>
              <Text style={styles.entryEmoji}>{entry.status === 'completed' ? '✅' : '❌'}</Text>
              <Text style={styles.entryTask} numberOfLines={1}>{entry.taskNote || 'Untitled session'}</Text>
              <Text style={[styles.entryStatus, entry.status === 'abandoned' && styles.entryStatusAbandoned]}>
                {entry.status === 'completed' ? 'Done' : 'Quit'}
              </Text>
            </View>
            <View style={styles.entryDetails}>
              <Text style={styles.entryDetail}>⏱ {entry.duration} min</Text>
              <Text style={styles.entryDetail}>💎 {entry.stakeAmount} SOL</Text>
              {entry.reward > 0 && (
                <Text style={[styles.entryDetail, { color: '#fbbf24' }]}>+{entry.reward.toFixed(4)} SOL</Text>
              )}
              <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  pageLabel: { color: '#2a7a5e', fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { color: '#f0faf6', fontSize: 28, fontWeight: 'bold', marginBottom: 24 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: 'rgba(77,217,172,0.05)',
    borderWidth: 1, borderColor: 'rgba(77,217,172,0.1)',
    borderRadius: 12, padding: 16, alignItems: 'center',
  },
  statValue: { color: '#4dd9ac', fontSize: 22, fontWeight: 'bold' },
  statLabel: { color: '#2a7a5e', fontSize: 10, letterSpacing: 1, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  filterBtnActive: { borderColor: '#4dd9ac', backgroundColor: 'rgba(77,217,172,0.1)' },
  filterText: { color: '#2a7a5e', fontSize: 12 },
  filterTextActive: { color: '#4dd9ac' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { color: '#f0faf6', fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: '#2a7a5e', fontSize: 13, marginTop: 8 },
  entry: {
    borderWidth: 1, borderColor: 'rgba(77,217,172,0.1)',
    borderRadius: 14, padding: 16, marginBottom: 12,
    backgroundColor: 'rgba(77,217,172,0.03)',
  },
  entryAbandoned: {
    borderColor: 'rgba(248,113,113,0.1)',
    backgroundColor: 'rgba(248,113,113,0.03)',
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  entryEmoji: { fontSize: 16, marginRight: 8 },
  entryTask: { flex: 1, color: '#f0faf6', fontSize: 14, fontWeight: '500' },
  entryStatus: { color: '#4dd9ac', fontSize: 11, letterSpacing: 1 },
  entryStatusAbandoned: { color: '#f87171' },
  entryDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  entryDetail: { color: '#2a7a5e', fontSize: 12 },
  entryDate: { color: '#1a4a35', fontSize: 11, marginLeft: 'auto' },
});