import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Share, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { getWeeklyStats, WeeklyStats } from '../services/WeeklyReportService';

const { width } = Dimensions.get('window');

export default function WeeklyReportScreen() {
  const { colors } = useTheme();
  const c = colors;
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWeeklyStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  const handleShare = async () => {
    if (!stats) return;
    const text = [
      `📊 My Focus Week (${stats.weekStart} – ${stats.weekEnd})`,
      ``,
      `🎯 Sessions completed: ${stats.sessionsCompleted}`,
      `⏱ Total focus time: ${stats.totalMinutes} minutes`,
      `💎 SOL staked: ${stats.solStaked.toFixed(3)} SOL`,
      `💰 Pool earnings: +${stats.solEarned.toFixed(4)} SOL`,
      `🔥 Current streak: ${stats.currentStreak} days`,
      stats.shields > 0 ? `🛡 Streak shields: ${stats.shields}` : '',
      ``,
      `Built on @Solana — stake SOL to stay focused.`,
      `https://focus-app-orpin.vercel.app`,
    ].filter(Boolean).join('\n');

    await Share.share({ message: text });
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  if (!stats || stats.sessionsCompleted === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <Text style={styles.emptyEmoji}>📊</Text>
        <Text style={[styles.emptyTitle, { color: c.text }]}>No sessions this week</Text>
        <Text style={[styles.emptySub, { color: c.textMuted }]}>
          Complete your first session to see your weekly report.
        </Text>
      </View>
    );
  }

  const completionRate = stats.sessionsCompleted + stats.sessionsAbandoned > 0
    ? Math.round((stats.sessionsCompleted / (stats.sessionsCompleted + stats.sessionsAbandoned)) * 100)
    : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.screenLabel, { color: c.textMuted }]}>WEEKLY REPORT</Text>
      <Text style={[styles.dateRange, { color: c.textSub }]}>
        {stats.weekStart} — {stats.weekEnd}
      </Text>

      {/* Hero card */}
      <LinearGradient
        colors={['#0d2b1f', '#0a1f17']}
        style={styles.heroCard}
      >
        {/* Top border accent */}
        <LinearGradient
          colors={['#2a7a5e', '#4dd9ac']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroAccentBar}
        />

        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroLabel}>SESSIONS COMPLETED</Text>
            <Text style={styles.heroNumber}>{stats.sessionsCompleted}</Text>
          </View>
          <View style={styles.heroRight}>
            <Text style={styles.heroLabel}>COMPLETION RATE</Text>
            <Text style={styles.heroNumber}>{completionRate}%</Text>
          </View>
        </View>

        <View style={styles.heroDivider} />

        <View style={styles.heroBottom}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{stats.totalMinutes}</Text>
            <Text style={styles.heroStatLabel}>minutes focused</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{stats.solStaked.toFixed(3)}</Text>
            <Text style={styles.heroStatLabel}>SOL staked</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={[styles.heroStatValue, { color: '#4dd9ac' }]}>
              +{stats.solEarned.toFixed(4)}
            </Text>
            <Text style={styles.heroStatLabel}>pool earned</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Streak card */}
      <View style={[styles.streakCard, { backgroundColor: c.card, borderColor: 'rgba(251,146,60,0.2)' }]}>
        <View style={styles.streakLeft}>
          <Text style={styles.streakFire}>🔥</Text>
          <View>
            <Text style={[styles.streakNumber, { color: '#fb923c' }]}>{stats.currentStreak}</Text>
            <Text style={[styles.streakLabel, { color: c.textMuted }]}>day streak</Text>
          </View>
        </View>
        <View style={styles.streakRight}>
          {stats.longestStreak > 0 && (
            <View style={styles.streakStat}>
              <Text style={[styles.streakStatValue, { color: c.textSub }]}>{stats.longestStreak}</Text>
              <Text style={[styles.streakStatLabel, { color: c.textMuted }]}>longest</Text>
            </View>
          )}
          {stats.shields > 0 && (
            <View style={[styles.shieldBadge, { borderColor: 'rgba(99,179,237,0.3)', backgroundColor: 'rgba(99,179,237,0.08)' }]}>
              <Text style={styles.shieldEmoji}>🛡</Text>
              <Text style={styles.shieldText}>{stats.shields} shield{stats.shields > 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress bar — sessions vs abandoned */}
      {stats.sessionsAbandoned > 0 && (
        <View style={[styles.ratioCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.ratioLabel, { color: c.textSub }]}>SESSION OUTCOMES</Text>
          <View style={styles.ratioBar}>
            <View style={[styles.ratioFill, { flex: stats.sessionsCompleted }]} />
            <View style={[styles.ratioFillAbandoned, { flex: stats.sessionsAbandoned }]} />
          </View>
          <View style={styles.ratioLegend}>
            <View style={styles.ratioLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#4dd9ac' }]} />
              <Text style={[styles.legendText, { color: c.textMuted }]}>{stats.sessionsCompleted} completed</Text>
            </View>
            <View style={styles.ratioLegendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
              <Text style={[styles.legendText, { color: c.textMuted }]}>{stats.sessionsAbandoned} abandoned</Text>
            </View>
          </View>
        </View>
      )}

      {/* Insight */}
      <View style={[styles.insightCard, { backgroundColor: `${c.accent}0a`, borderColor: `${c.accent}20` }]}>
        <Text style={styles.insightEmoji}>{getInsightEmoji(stats)}</Text>
        <Text style={[styles.insightText, { color: c.textSub }]}>{getInsight(stats)}</Text>
      </View>

      {/* Share button */}
      <TouchableOpacity onPress={handleShare} activeOpacity={0.85}>
        <LinearGradient
          colors={['#2a7a5e', '#4dd9ac']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shareBtn}
        >
          <Text style={styles.shareBtnText}>Share my report</Text>
          <Text style={styles.shareBtnIcon}>↗</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={[styles.footer, { color: c.textMuted }]}>
        Report resets every Monday · Powered by Solana
      </Text>
    </ScrollView>
  );
}

function getInsight(stats: WeeklyStats): string {
  if (stats.currentStreak >= 7) return `${stats.currentStreak} consecutive days — you're in rare company. Most people quit by day 3.`;
  if (stats.solEarned > 0) return `You earned ${stats.solEarned.toFixed(4)} SOL from other people's abandoned sessions. Discipline pays literally.`;
  if (stats.totalMinutes >= 200) return `${stats.totalMinutes} minutes of deep work this week. That's ${Math.round(stats.totalMinutes / 60 * 10) / 10} hours of compounding focus.`;
  if (stats.sessionsCompleted >= 5) return `${stats.sessionsCompleted} sessions completed. Consistency over intensity — you're building the habit.`;
  return `${stats.sessionsCompleted} session${stats.sessionsCompleted !== 1 ? 's' : ''} this week. Every session is a vote for the person you're becoming.`;
}

function getInsightEmoji(stats: WeeklyStats): string {
  if (stats.currentStreak >= 14) return '🏆';
  if (stats.currentStreak >= 7) return '⚡';
  if (stats.solEarned > 0.01) return '💰';
  if (stats.totalMinutes >= 300) return '🧠';
  return '✦';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },

  screenLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 4 },
  dateRange: { fontSize: 14, marginBottom: 24 },

  heroCard: {
    borderRadius: 20, overflow: 'hidden', marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(77,217,172,0.1)',
  },
  heroAccentBar: { height: 2, width: '100%' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', padding: 24, paddingBottom: 16 },
  heroRight: { alignItems: 'flex-end' },
  heroLabel: { color: 'rgba(77,217,172,0.5)', fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  heroNumber: { color: '#f0faf6', fontSize: 42, fontWeight: '200', letterSpacing: -1 },
  heroDivider: { height: 1, backgroundColor: 'rgba(77,217,172,0.08)', marginHorizontal: 24 },
  heroBottom: { flexDirection: 'row', padding: 24, paddingTop: 16 },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatValue: { color: '#f0faf6', fontSize: 18, fontWeight: '500', marginBottom: 2 },
  heroStatLabel: { color: 'rgba(77,217,172,0.4)', fontSize: 10, letterSpacing: 1 },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(77,217,172,0.08)' },

  streakCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 12,
  },
  streakLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  streakFire: { fontSize: 32 },
  streakNumber: { fontSize: 36, fontWeight: '200' },
  streakLabel: { fontSize: 11, letterSpacing: 1 },
  streakRight: { alignItems: 'flex-end', gap: 8 },
  streakStat: { alignItems: 'flex-end' },
  streakStatValue: { fontSize: 16, fontWeight: '500' },
  streakStatLabel: { fontSize: 10, letterSpacing: 1 },
  shieldBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
  },
  shieldEmoji: { fontSize: 14 },
  shieldText: { color: '#63b3ed', fontSize: 12, fontWeight: '500' },

  ratioCard: {
    borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 12,
  },
  ratioLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  ratioBar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 12 },
  ratioFill: { backgroundColor: '#4dd9ac' },
  ratioFillAbandoned: { backgroundColor: '#f87171' },
  ratioLegend: { flexDirection: 'row', gap: 20 },
  ratioLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 12 },

  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 20, marginBottom: 24,
  },
  insightEmoji: { fontSize: 20 },
  insightText: { flex: 1, fontSize: 14, lineHeight: 22, fontStyle: 'italic' },

  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 16, paddingVertical: 18,
  },
  shareBtnText: { color: '#060d12', fontSize: 15, fontWeight: '700' },
  shareBtnIcon: { color: '#060d12', fontSize: 18, fontWeight: '700' },

  footer: { fontSize: 11, textAlign: 'center', marginTop: 20, letterSpacing: 0.5 },
});