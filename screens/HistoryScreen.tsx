import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from '../components/PageHeader';

interface HistoryEntry {
  taskNote: string;
  duration: number;
  stakeAmount: number;
  reward: number;
  status: 'completed' | 'abandoned';
  completedAt: string;
  txSig: string | null;
}

interface Props {
  onShowWeeklyReport?: () => void;
}

const FACTS = [
  { emoji: '🧠', text: 'People who work in focused blocks are 40% more productive on average.' },
  { emoji: '💎', text: 'Staking real value makes you 3× more likely to finish what you start.' },
  { emoji: '🔥', text: 'A 7-day streak earns you a shield — your safety net for off days.' },
  { emoji: '🏆', text: "Top agents on this week's leaderboard have 30+ day streaks." },
  { emoji: '⚡', text: 'The penalty pool grows with every abandon — completers earn it.' },
];

function EmptyState() {
  const { colors } = useTheme();
  const c = colors;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <LinearGradient colors={['#0d2b1f', '#0a1f17']} style={styles.emptyHero}>
        <LinearGradient colors={['#2a7a5e', '#4dd9ac']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.emptyHeroBar} />
        <Text style={styles.emptyHeroEmoji}>✦</Text>
        <Text style={[styles.emptyHeroTitle, { color: '#f0faf6' }]}>Your record starts now.</Text>
        <Text style={[styles.emptyHeroSub, { color: 'rgba(77,217,172,0.6)' }]}>
          Every agent begins with a blank slate.{'\n'}Complete your first session to build your record.
        </Text>
      </LinearGradient>

      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>HOW IT WORKS</Text>
      {[
        { step: '01', title: 'Stake SOL', desc: 'Lock a small amount as your commitment.' },
        { step: '02', title: 'Focus', desc: 'Work undistracted for your chosen duration.' },
        { step: '03', title: 'Complete & Earn', desc: 'Get your SOL back — plus a share of abandoned stakes.' },
      ].map((item, i) => (
        <View key={i} style={[styles.stepRow, { borderColor: `${c.accent}18`, backgroundColor: `${c.accent}06` }]}>
          <Text style={[styles.stepNum, { color: `${c.accent}44` }]}>{item.step}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.stepTitle, { color: c.text }]}>{item.title}</Text>
            <Text style={[styles.stepDesc, { color: c.textMuted }]}>{item.desc}</Text>
          </View>
        </View>
      ))}

      <Text style={[styles.sectionLabel, { color: c.textMuted, marginTop: 24 }]}>DID YOU KNOW</Text>
      {FACTS.map((fact, i) => (
        <View key={i} style={[styles.factRow, { borderBottomColor: `${c.accent}14` }]}>
          <Text style={styles.factEmoji}>{fact.emoji}</Text>
          <Text style={[styles.factText, { color: c.textSub }]}>{fact.text}</Text>
        </View>
      ))}

      <Text style={[styles.emptyFooter, { color: c.textMuted }]}>Built on Solana · Real stakes · Real focus</Text>
    </Animated.View>
  );
}

export default function HistoryScreen({ onShowWeeklyReport }: Props) {
  const { colors } = useTheme();
  const c = colors;
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'completed' | 'abandoned'>('all');

  useEffect(() => {
    AsyncStorage.getItem('focus_history').then(data => {
      if (data) {
        // Normalise old entries that used 'date' instead of 'completedAt'
        const parsed = JSON.parse(data).map((e: any) => ({
          ...e,
          completedAt: e.completedAt ?? e.date ?? new Date().toISOString(),
        }));
        setHistory(parsed);
      }
    });
  }, []);

  const filtered = filter === 'all' ? history : history.filter(h => h.status === filter);
  const totalCompleted = history.filter(h => h.status === 'completed').length;
  const totalMinutes = history.filter(h => h.status === 'completed').reduce((acc, h) => acc + h.duration, 0);
  const totalStaked = history.filter(h => h.status === 'completed').reduce((acc, h) => acc + h.stakeAmount, 0);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return '—'; }
  };

  if (history.length === 0) {
    return (
      <View style={[styles.outerContainer, { backgroundColor: c.bg }]}>
        <PageHeader title="Your Focus Record" subtitle="SESSION HISTORY" />
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <EmptyState />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.outerContainer, { backgroundColor: c.bg }]}>
      <PageHeader title="Your Focus Record" subtitle="SESSION HISTORY" />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {onShowWeeklyReport && (
        <TouchableOpacity
          style={[styles.weeklyBtn, { borderColor: `${c.accent}33`, backgroundColor: `${c.accent}0a` }]}
          onPress={onShowWeeklyReport}
        >
          <Text style={styles.weeklyBtnEmoji}>📊</Text>
          <Text style={[styles.weeklyBtnText, { color: c.accent }]}>View Weekly Report</Text>
          <Text style={[styles.weeklyBtnChevron, { color: c.accent }]}>›</Text>
        </TouchableOpacity>
      )}

      <View style={styles.statsRow}>
        {[
          { value: totalCompleted, label: 'Completed' },
          { value: totalMinutes, label: 'Minutes' },
          { value: totalStaked.toFixed(3), label: 'SOL Staked' },
        ].map((stat, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: `${c.accent}0d`, borderColor: `${c.accent}22` }]}>
            <Text style={[styles.statValue, { color: c.accent }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: c.textSub }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.filterRow}>
        {(['all', 'completed', 'abandoned'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, { borderColor: c.cardBorder }, filter === f && { borderColor: c.accent, backgroundColor: `${c.accent}15` }]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, { color: c.textSub }, filter === f && { color: c.accent }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 && (
        <View style={styles.filteredEmpty}>
          <Text style={styles.filteredEmptyEmoji}>{filter === 'completed' ? '🎯' : '💨'}</Text>
          <Text style={[styles.filteredEmptyText, { color: c.textSub }]}>
            {filter === 'completed' ? 'No completed sessions yet.' : 'No abandoned sessions — good discipline.'}
          </Text>
        </View>
      )}

      {filtered.map((entry, index) => (
        <View
          key={`${entry.completedAt}-${index}`}
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
            <Text style={[styles.entryStatus, { color: c.accent }, entry.status === 'abandoned' && { color: '#f87171' }]}>
              {entry.status === 'completed' ? 'Done' : 'Quit'}
            </Text>
          </View>
          <View style={styles.entryDetails}>
            <Text style={[styles.entryDetail, { color: c.textSub }]}>⏱ {entry.duration} min</Text>
            <Text style={[styles.entryDetail, { color: c.textSub }]}>💎 {entry.stakeAmount} SOL</Text>
            {entry.reward > 0 && (
              <Text style={[styles.entryDetail, { color: '#fbbf24' }]}>+{entry.reward.toFixed(4)} SOL</Text>
            )}
            <Text style={[styles.entryDate, { color: c.textMuted }]}>{formatDate(entry.completedAt)}</Text>
          </View>
        </View>
      ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 20, paddingBottom: 40 },
  pageLabel: { fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  sectionLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  weeklyBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 24 },
  weeklyBtnEmoji: { fontSize: 18 },
  weeklyBtnText: { flex: 1, fontSize: 14, fontWeight: '600' },
  weeklyBtnChevron: { fontSize: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 10, letterSpacing: 1, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  filterText: { fontSize: 12 },
  filteredEmpty: { alignItems: 'center', paddingVertical: 48 },
  filteredEmptyEmoji: { fontSize: 36, marginBottom: 12 },
  filteredEmptyText: { fontSize: 14, textAlign: 'center' },
  entry: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  entryEmoji: { fontSize: 16, marginRight: 8 },
  entryTask: { flex: 1, fontSize: 14, fontWeight: '500' },
  entryStatus: { fontSize: 11, letterSpacing: 1 },
  entryDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  entryDetail: { fontSize: 12 },
  entryDate: { fontSize: 11, marginLeft: 'auto' },
  emptyHero: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(77,217,172,0.1)', marginBottom: 28, alignItems: 'center' },
  emptyHeroBar: { height: 2, width: '100%' },
  emptyHeroEmoji: { fontSize: 44, marginTop: 32, marginBottom: 12 },
  emptyHeroTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10 },
  emptyHeroSub: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24, marginBottom: 28 },
  stepRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 8, gap: 14 },
  stepNum: { fontSize: 22, fontWeight: '200', width: 32 },
  stepTitle: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  stepDesc: { fontSize: 12, lineHeight: 16 },
  factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderBottomWidth: 1, paddingVertical: 12 },
  factEmoji: { fontSize: 18, width: 26 },
  factText: { flex: 1, fontSize: 13, lineHeight: 18 },
  emptyFooter: { fontSize: 11, textAlign: 'center', marginTop: 28 },
});