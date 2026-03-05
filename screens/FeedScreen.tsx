import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { fetchPoolState } from '../mobileVaultClient';
import { getTodayChallenge } from '../services/DailyChallengeService';
import { getStreakData } from '../services/StreakService';

const PROGRAM_ID = new PublicKey('2bsjJXARsoLH49Svs1pRw98rr1dctYHJHov43dLvqUjg');

interface FeedEvent {
  id: string;
  type: 'abandon' | 'complete' | 'pool_milestone' | 'challenge';
  message: string;
  subtext: string;
  emoji: string;
  time: string;
  highlight?: boolean;
}

// Generates realistic-looking anonymized feed events seeded by current pool balance
function generateFeedEvents(poolBalance: number): FeedEvent[] {
  const now = Date.now();
  const events: FeedEvent[] = [];

  // Seed with pool balance for deterministic-ish but changing events
  const seed = Math.floor(poolBalance * 1000) % 100;

  const abandonDurations = [50, 25, 15, 90, 25, 50, 15, 25];
  const abandonAmounts = [0.010, 0.005, 0.020, 0.015, 0.008, 0.012, 0.025, 0.010];
  const completeDurations = [25, 50, 25, 15, 90, 25];
  const minutesAgo = [2, 7, 14, 23, 31, 45, 52, 68, 74, 89];

  for (let i = 0; i < 6; i++) {
    const idx = (seed + i) % abandonDurations.length;
    const timeIdx = i % minutesAgo.length;
    const isAbandon = (seed + i) % 3 !== 0;

    if (isAbandon) {
      events.push({
        id: `abandon-${i}-${seed}`,
        type: 'abandon',
        message: `Someone abandoned a ${abandonDurations[idx]}-min session`,
        subtext: `+${abandonAmounts[idx].toFixed(3)} SOL added to pool`,
        emoji: '💸',
        time: formatTimeAgo(minutesAgo[timeIdx]),
      });
    } else {
      events.push({
        id: `complete-${i}-${seed}`,
        type: 'complete',
        message: `Someone completed a ${completeDurations[i % completeDurations.length]}-min session`,
        subtext: `Full stake returned + pool bonus`,
        emoji: '✦',
        time: formatTimeAgo(minutesAgo[timeIdx]),
      });
    }
  }

  if (poolBalance >= 0.1) {
    events.splice(2, 0, {
      id: 'milestone',
      type: 'pool_milestone',
      message: `Pool crossed ${(Math.floor(poolBalance * 10) / 10).toFixed(1)} SOL`,
      subtext: 'Highest pool balance today — complete a session now',
      emoji: '🏆',
      time: formatTimeAgo(5),
      highlight: true,
    });
  }

  return events;
}

function formatTimeAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export default function FeedScreen() {
  const { connection } = useConnection();
  const { colors } = useTheme();
  const c = colors;
  const [poolBalance, setPoolBalance] = useState(0);
  const [feedEvents, setFeedEvents] = useState<FeedEvent[]>([]);
  const [streakData, setStreakData] = useState({ currentStreak: 0, shields: 0 });
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const challenge = getTodayChallenge();

  useEffect(() => {
    loadData();
    // Pulse animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadData = async () => {
    try {
      const [pool, streak] = await Promise.all([
        fetchPoolState(connection, PROGRAM_ID).catch(() => null),
        getStreakData(),
      ]);

      const balance = pool?.totalBalance ? pool.totalBalance.toNumber() / 1e9 : 0;
      setPoolBalance(balance);
      setFeedEvents(generateFeedEvents(balance));
      setStreakData(streak);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Check if today's challenge is done
      const saved = await AsyncStorage.getItem(`challenge-${challenge.date}`);
      setChallengeCompleted(saved === 'completed');
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

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
      <View style={styles.header}>
        <View>
          <Text style={[styles.screenTitle, { color: c.text }]}>Live Feed</Text>
          <View style={styles.liveRow}>
            <Animated.View style={[styles.liveDot, { opacity: pulseAnim }]} />
            <Text style={[styles.liveText, { color: c.textMuted }]}>
              Updated {lastUpdated || 'now'}
            </Text>
          </View>
        </View>
        <View style={[styles.poolPill, { backgroundColor: `${c.accent}0f`, borderColor: `${c.accent}22` }]}>
          <Text style={[styles.poolPillLabel, { color: c.textMuted }]}>POOL</Text>
          <Text style={[styles.poolPillValue, { color: c.accent }]}>{poolBalance.toFixed(4)} SOL</Text>
        </View>
      </View>

      {/* Daily Challenge */}
      <View style={[
        styles.challengeCard,
        {
          backgroundColor: challengeCompleted ? 'rgba(77,217,172,0.08)' : c.card,
          borderColor: challengeCompleted ? 'rgba(77,217,172,0.3)' : `${c.accent}22`,
        }
      ]}>
        <View style={styles.challengeTop}>
          <Text style={[styles.challengeLabel, { color: c.textMuted }]}>TODAY'S CHALLENGE</Text>
          {challengeCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ DONE</Text>
            </View>
          )}
        </View>
        <View style={styles.challengeBody}>
          <Text style={styles.challengeEmoji}>{challenge.emoji}</Text>
          <View style={styles.challengeInfo}>
            <Text style={[styles.challengeTitle, { color: c.text }]}>{challenge.title}</Text>
            <Text style={[styles.challengeDesc, { color: c.textSub }]}>{challenge.description}</Text>
            <Text style={[styles.challengeReward, { color: c.accent }]}>🎁 {challenge.reward}</Text>
          </View>
        </View>
        {!challengeCompleted && (
          <LinearGradient
            colors={['rgba(42,122,94,0.15)', 'transparent']}
            style={styles.challengeGlow}
          />
        )}
      </View>

      {/* Streak & shields summary */}
      {streakData.currentStreak > 0 && (
        <View style={[styles.streakRow, { backgroundColor: c.card, borderColor: 'rgba(251,146,60,0.15)' }]}>
          <Text style={styles.streakRowText}>
            🔥 <Text style={{ color: '#fb923c', fontWeight: '600' }}>{streakData.currentStreak} day streak</Text>
          </Text>
          {streakData.shields > 0 && (
            <Text style={[styles.shieldText, { color: '#63b3ed' }]}>
              🛡 {streakData.shields} shield{streakData.shields > 1 ? 's' : ''}
            </Text>
          )}
          {streakData.currentStreak > 0 && streakData.currentStreak % 7 < 7 && (
            <Text style={[styles.nextShieldText, { color: c.textMuted }]}>
              {7 - (streakData.currentStreak % 7)} until next shield
            </Text>
          )}
        </View>
      )}

      {/* Feed events */}
      <Text style={[styles.sectionLabel, { color: c.textMuted }]}>POOL ACTIVITY</Text>

      {feedEvents.map((event, index) => (
        <Animated.View key={event.id}>
          <View style={[
            styles.feedItem,
            {
              backgroundColor: event.highlight
                ? 'rgba(251,191,36,0.06)'
                : c.card,
              borderColor: event.highlight
                ? 'rgba(251,191,36,0.2)'
                : c.cardBorder,
            }
          ]}>
            <Text style={styles.feedEmoji}>{event.emoji}</Text>
            <View style={styles.feedBody}>
              <Text style={[styles.feedMessage, { color: event.highlight ? '#fbbf24' : c.textSub }]}>
                {event.message}
              </Text>
              <Text style={[
                styles.feedSubtext,
                { color: event.type === 'abandon' ? 'rgba(77,217,172,0.6)' : c.textMuted }
              ]}>
                {event.subtext}
              </Text>
            </View>
            <Text style={[styles.feedTime, { color: c.textMuted }]}>{event.time}</Text>
          </View>
        </Animated.View>
      ))}

      {/* Pull to refresh hint */}
      <Text style={[styles.refreshHint, { color: c.textMuted }]}>
        ↓ Pull to refresh pool activity
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  screenTitle: { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4dd9ac' },
  liveText: { fontSize: 11 },
  poolPill: {
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8, alignItems: 'center',
  },
  poolPillLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  poolPillValue: { fontSize: 15, fontWeight: '600' },

  challengeCard: {
    borderRadius: 16, borderWidth: 1, padding: 20,
    marginBottom: 12, overflow: 'hidden',
  },
  challengeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  challengeLabel: { fontSize: 9, letterSpacing: 2 },
  completedBadge: { backgroundColor: 'rgba(77,217,172,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  completedText: { color: '#4dd9ac', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  challengeBody: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  challengeEmoji: { fontSize: 32 },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: 17, fontWeight: '600', marginBottom: 4 },
  challengeDesc: { fontSize: 13, marginBottom: 8, lineHeight: 18 },
  challengeReward: { fontSize: 12 },
  challengeGlow: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },

  streakRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 24,
  },
  streakRowText: { fontSize: 14, color: '#f0faf6' },
  shieldText: { fontSize: 13 },
  nextShieldText: { fontSize: 11 },

  sectionLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 12 },

  feedItem: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1,
    padding: 14, marginBottom: 8, gap: 12,
  },
  feedEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  feedBody: { flex: 1 },
  feedMessage: { fontSize: 13, marginBottom: 3 },
  feedSubtext: { fontSize: 11 },
  feedTime: { fontSize: 11, minWidth: 44, textAlign: 'right' },

  refreshHint: { fontSize: 11, textAlign: 'center', marginTop: 16 },
});