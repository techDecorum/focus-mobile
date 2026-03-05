import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { getStreakData } from '../services/StreakService';

interface LeaderboardEntry {
  rank: number;
  streak: number;
  sessions: number;
  badge: string;
  isYou?: boolean;
}

// Deterministic anonymous name from a seed
function getAnonymousHandle(seed: number): string {
  const adjectives = [
    'Silent', 'Deep', 'Focused', 'Sharp', 'Calm', 'Swift',
    'Quiet', 'Steady', 'Bold', 'Clear', 'Dark', 'Iron',
  ];
  const nouns = [
    'Agent', 'Scholar', 'Monk', 'Architect', 'Operator',
    'Cipher', 'Analyst', 'Sentinel', 'Ghost', 'Vector',
  ];
  const adj = adjectives[seed % adjectives.length];
  const noun = nouns[Math.floor(seed / adjectives.length) % nouns.length];
  return `${adj} ${noun}`;
}

function getBadge(streak: number): string {
  if (streak >= 30) return '🏆';
  if (streak >= 14) return '💎';
  if (streak >= 7)  return '🔥';
  if (streak >= 3)  return '⚡';
  return '✦';
}

function getRankLabel(rank: number, total: number): string {
  const pct = Math.round((rank / total) * 100);
  if (pct <= 1)  return 'Top 1%';
  if (pct <= 5)  return 'Top 5%';
  if (pct <= 10) return 'Top 10%';
  if (pct <= 25) return 'Top 25%';
  if (pct <= 50) return 'Top 50%';
  return 'Keep going';
}

// Generate a realistic leaderboard seeded by current week number
// so it rotates weekly but feels consistent within a week
function generateLeaderboard(yourStreak: number, yourSessions: number): LeaderboardEntry[] {
  const weekSeed = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const entries: LeaderboardEntry[] = [];

  const streakPool = [47, 31, 28, 21, 19, 18, 14, 14, 12, 11, 9, 8, 7, 7, 6, 5, 4, 3, 3, 2];
  const sessionPool = [94, 67, 52, 43, 38, 35, 29, 26, 24, 22, 18, 17, 14, 13, 11, 10, 8, 6, 5, 4];

  // Shuffle deterministically with weekSeed
  const indices = streakPool.map((_, i) => i).sort((a, b) =>
    ((a * 2654435761 + weekSeed) % 100) - ((b * 2654435761 + weekSeed) % 100)
  );

  // Find where "you" would slot in
  let yourRank = streakPool.length + 1;
  for (let i = 0; i < streakPool.length; i++) {
    if (yourStreak >= streakPool[indices[i]]) {
      yourRank = i + 1;
      break;
    }
  }

  // Build top 10 list inserting "you" at correct position
  let youInserted = false;
  let displayRank = 1;

  for (let i = 0; i < Math.min(10, streakPool.length); i++) {
    const idx = indices[i];

    // Insert "you" if this is your rank and you haven't been inserted yet
    if (!youInserted && yourRank === displayRank) {
      entries.push({
        rank: displayRank,
        streak: yourStreak,
        sessions: yourSessions,
        badge: getBadge(yourStreak),
        isYou: true,
      });
      youInserted = true;
      displayRank++;
    }

    // Skip a simulated entry if it would be same rank as you
    entries.push({
      rank: displayRank,
      streak: streakPool[idx],
      sessions: sessionPool[idx],
      badge: getBadge(streakPool[idx]),
    });
    displayRank++;
  }

  // If you didn't make top 10, add you at end to show position
  if (!youInserted && yourStreak > 0) {
    entries.push({
      rank: yourRank,
      streak: yourStreak,
      sessions: yourSessions,
      badge: getBadge(yourStreak),
      isYou: true,
    });
  }

  return entries;
}

export default function StreakLeaderboardScreen() {
  const { colors } = useTheme();
  const c = colors;
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [yourEntry, setYourEntry] = useState<LeaderboardEntry | null>(null);
  const [totalUsers] = useState(847); // Simulated community size
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weekLabel, setWeekLabel] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadLeaderboard();
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    setWeekLabel(`Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
  }, []);

  const loadLeaderboard = async () => {
    try {
      const streakData = await getStreakData();
      const historyRaw = await AsyncStorage.getItem('focus_history');
      const history = historyRaw ? JSON.parse(historyRaw) : [];
      const yourSessions = history.filter((h: any) => h.status === 'completed').length;

      const board = generateLeaderboard(streakData.currentStreak, yourSessions);
      setEntries(board);

      const you = board.find(e => e.isYou);
      setYourEntry(you || null);

      Animated.timing(fadeAnim, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  const topEntries = entries.filter(e => e.rank <= 10);
  const yourRankLabel = yourEntry ? getRankLabel(yourEntry.rank, totalUsers) : null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
      }
    >
      {/* Header */}
      <Text style={[styles.screenLabel, { color: c.textMuted }]}>LEADERBOARD</Text>
      <Text style={[styles.screenTitle, { color: c.text }]}>Streak Rankings</Text>
      <Text style={[styles.weekLabel, { color: c.textMuted }]}>{weekLabel} · {totalUsers} agents</Text>

      {/* Your rank card */}
      {yourEntry ? (
        <LinearGradient
          colors={['#0d2b1f', '#0a1f17']}
          style={styles.yourCard}
        >
          <LinearGradient
            colors={['#2a7a5e', '#4dd9ac']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.yourCardAccent}
          />
          <View style={styles.yourCardBody}>
            <View>
              <Text style={styles.yourCardLabel}>YOUR RANK</Text>
              <Text style={styles.yourCardRank}>#{yourEntry.rank}</Text>
              <Text style={styles.yourCardPercentile}>{yourRankLabel}</Text>
            </View>
            <View style={styles.yourCardRight}>
              <Text style={styles.yourCardBadge}>{yourEntry.badge}</Text>
              <Text style={styles.yourCardStreak}>{yourEntry.streak} day streak</Text>
              <Text style={styles.yourCardSessions}>{yourEntry.sessions} sessions</Text>
            </View>
          </View>
        </LinearGradient>
      ) : (
        <View style={[styles.noStreakCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={styles.noStreakEmoji}>🎯</Text>
          <Text style={[styles.noStreakText, { color: c.textSub }]}>
            Complete a session to join the leaderboard
          </Text>
        </View>
      )}

      {/* Leaderboard */}
      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>TOP STREAKS THIS WEEK</Text>

      <Animated.View style={{ opacity: fadeAnim }}>
        {topEntries.map((entry, index) => (
          <View
            key={`${entry.rank}-${index}`}
            style={[
              styles.entryRow,
              {
                backgroundColor: entry.isYou
                  ? `${c.accent}0f`
                  : entry.rank <= 3 ? 'rgba(251,191,36,0.04)' : c.card,
                borderColor: entry.isYou
                  ? `${c.accent}33`
                  : entry.rank <= 3 ? 'rgba(251,191,36,0.15)' : c.cardBorder,
              }
            ]}
          >
            {/* Rank */}
            <View style={styles.rankCol}>
              {entry.rank <= 3 ? (
                <Text style={styles.medalEmoji}>
                  {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                </Text>
              ) : (
                <Text style={[styles.rankNum, { color: c.textMuted }]}>#{entry.rank}</Text>
              )}
            </View>

            {/* Badge + name */}
            <Text style={styles.entryBadge}>{entry.badge}</Text>
            <View style={styles.entryInfo}>
              <Text style={[
                styles.entryName,
                { color: entry.isYou ? c.accent : c.textSub },
              ]}>
                {entry.isYou ? 'You' : getAnonymousHandle(entry.rank * 7 + index)}
              </Text>
              <Text style={[styles.entrySessions, { color: c.textMuted }]}>
                {entry.sessions} sessions
              </Text>
            </View>

            {/* Streak */}
            <View style={styles.streakCol}>
              <Text style={[styles.entryStreak, {
                color: entry.isYou ? c.accent : entry.rank <= 3 ? '#fbbf24' : c.textSub,
              }]}>
                {entry.streak}
              </Text>
              <Text style={[styles.entryStreakLabel, { color: c.textMuted }]}>days</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      {/* Footer note */}
      <View style={[styles.footerCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <Text style={[styles.footerText, { color: c.textMuted }]}>
          Rankings are anonymous and reset weekly every Monday.
          Complete daily sessions to climb the board.
        </Text>
      </View>

      {/* Shield reminder */}
      <View style={[styles.shieldCard, { backgroundColor: 'rgba(99,179,237,0.06)', borderColor: 'rgba(99,179,237,0.15)' }]}>
        <Text style={styles.shieldEmoji}>🛡</Text>
        <Text style={[styles.shieldText, { color: '#63b3ed' }]}>
          Earn a streak shield every 7 sessions to protect your rank if you miss a day.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  screenLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 4 },
  screenTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 4 },
  weekLabel: { fontSize: 12, marginBottom: 24 },

  yourCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(77,217,172,0.1)',
    marginBottom: 28,
  },
  yourCardAccent: { height: 2 },
  yourCardBody: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 24,
  },
  yourCardLabel: { color: 'rgba(77,217,172,0.5)', fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  yourCardRank: { color: '#f0faf6', fontSize: 40, fontWeight: '200', letterSpacing: -1 },
  yourCardPercentile: { color: '#4dd9ac', fontSize: 12, fontWeight: '600', marginTop: 4 },
  yourCardRight: { alignItems: 'flex-end' },
  yourCardBadge: { fontSize: 32, marginBottom: 4 },
  yourCardStreak: { color: '#fb923c', fontSize: 14, fontWeight: '600' },
  yourCardSessions: { color: 'rgba(77,217,172,0.5)', fontSize: 11, marginTop: 2 },

  noStreakCard: {
    borderRadius: 16, borderWidth: 1,
    padding: 24, alignItems: 'center',
    marginBottom: 28,
  },
  noStreakEmoji: { fontSize: 32, marginBottom: 10 },
  noStreakText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  sectionLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 12 },

  entryRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, borderWidth: 1,
    padding: 14, marginBottom: 8, gap: 10,
  },
  rankCol: { width: 36, alignItems: 'center' },
  medalEmoji: { fontSize: 20 },
  rankNum: { fontSize: 13, fontWeight: '600' },
  entryBadge: { fontSize: 20, width: 28, textAlign: 'center' },
  entryInfo: { flex: 1 },
  entryName: { fontSize: 14, fontWeight: '500', marginBottom: 2 },
  entrySessions: { fontSize: 11 },
  streakCol: { alignItems: 'flex-end' },
  entryStreak: { fontSize: 20, fontWeight: '300' },
  entryStreakLabel: { fontSize: 10, letterSpacing: 1 },

  footerCard: {
    borderRadius: 12, borderWidth: 1,
    padding: 16, marginTop: 8, marginBottom: 12,
  },
  footerText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },

  shieldCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderRadius: 12, borderWidth: 1, padding: 16,
  },
  shieldEmoji: { fontSize: 16 },
  shieldText: { flex: 1, fontSize: 12, lineHeight: 18 },
});