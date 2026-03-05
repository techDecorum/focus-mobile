import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Animated } from 'react-native';
import { Connection, PublicKey } from '@solana/web3.js';
import Svg, { Circle } from 'react-native-svg';
import {
  initializeVault, startSession, completeSession, abandonSession, fetchVaultState,
} from '../mobileVaultClient';
import { useMusic, TRACKS as MUSIC_TRACKS } from '../contexts/MusicContext';
import { useTheme } from '../contexts/ThemeContext';
import { onSessionCompleted } from '../services/StreakService';
import { checkChallengeCompletion } from '../services/DailyChallengeService';
import { sendCompletionNotification, scheduleStreakReminder } from '../services/NotificationService';

interface Props {
  duration: number;
  stakeAmount: number;
  publicKey: PublicKey;
  connection: Connection;
  taskNote: string;
  onComplete: (sig: string, reward: number) => void;
  onAbandon: (sig: string) => void;
}

const TRACKS = [
  { name: 'Deep Focus',           emoji: '🧠', description: 'Beta · 14Hz · Concentration',    index: 0 },
  { name: 'Flow State',           emoji: '🌊', description: 'Alpha · 10Hz · Creative flow',    index: 1 },
  { name: 'Deep Work',            emoji: '⚡', description: 'Gamma · 40Hz · Peak performance', index: 2 },
  { name: 'Calm Focus',           emoji: '🧘', description: 'Theta · 6Hz · Relaxed focus',     index: 3 },
  { name: 'Memory',               emoji: '💡', description: 'Beta · 12Hz · Memory retention',  index: 4 },
  { name: 'Meditation',           emoji: '☯️', description: 'Delta · 4Hz · Deep meditation',   index: 5 },
  { name: 'Energy Boost',         emoji: '🚀', description: 'Beta · 20Hz · Mental energy',     index: 6 },
  { name: 'Sleep Prep',           emoji: '🌙', description: 'Delta · 2Hz · Wind down',         index: 7 },
  { name: 'Dusty Jazz Piano',     emoji: '🎷', description: 'Jazz · 90s · Warm vibes',         index: 8 },
  { name: 'Mellow Drift',         emoji: '🌿', description: 'Ambient · Relaxing study',        index: 9 },
  { name: 'Deep Long Study',      emoji: '📚', description: 'Deep · Long work sessions',       index: 10 },
  { name: 'Spacious Motifs',      emoji: '🌌', description: 'Ambient · Flow state',            index: 11 },
  { name: 'Quiet Focus Motif',    emoji: '🕊️', description: 'Calm · Quiet concentration',      index: 12 },
  { name: 'Deep Focus Piano',     emoji: '🖤', description: 'Piano · Deep focus',              index: 13 },
  { name: 'Mind Memory',          emoji: '🔮', description: 'Ambient · Memory retention',      index: 14 },
  { name: 'Gentle Concentration', emoji: '🌸', description: 'Meditation · Gentle focus',       index: 15 },
  { name: 'Moments Are Peaceful', emoji: '☁️', description: 'Ambient · Peaceful moments',      index: 16 },
  { name: 'Glass Shore at Dusk',  emoji: '🌅', description: 'Ambient · Evening wind down',     index: 17 },
  { name: 'Midnight Sleep Prep',  emoji: '🌃', description: 'Sleep · Midnight wind down',      index: 18 },
];

const QUOTES = [
  { text: "The successful warrior is the average person, with laser-like focus.", author: "Bruce Lee" },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
  { text: "It's not that I'm so smart. I just stay with problems longer.", author: "Albert Einstein" },
  { text: "Energy flows where attention goes.", author: "" },
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "One hour of focused work beats three hours of distracted effort.", author: "" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell" },
  { text: "The ability to perform deep work is becoming increasingly rare and increasingly valuable.", author: "Cal Newport" },
  { text: "Where focus goes, energy flows.", author: "Tony Robbins" },
  { text: "Clarity about what matters provides clarity about what does not.", author: "Cal Newport" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
];

function ProgressRing({ progress, size = 220, strokeWidth = 5, color = '#4dd9ac' }: {
  progress: number; size?: number; strokeWidth?: number; color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(progress, 100) / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={radius}
          stroke="rgba(77,217,172,0.08)" strokeWidth={strokeWidth} fill="none" />
      </Svg>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" />
      </Svg>
    </View>
  );
}

export default function ActiveScreen({
  duration, stakeAmount, publicKey, connection, taskNote, onComplete, onAbandon
}: Props) {
  const { colors } = useTheme();
  const c = colors;
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [loading, setLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const quoteOpacity = useRef(new Animated.Value(1)).current;

  const { trackIndex, setTrackIndex, next: musicNext, prev: musicPrev, isPlaying, play, pause } = useMusic();

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const ringColor = timeLeft < 60 ? '#f87171' : '#4dd9ac';

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  useEffect(() => { handleStart(); }, []);

  // Rotate quote every 45s with fade
  useEffect(() => {
    if (!sessionStarted) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(quoteOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(quoteOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setQuoteIndex(prev => (prev + 1) % QUOTES.length), 500);
    }, 45000);
    return () => clearInterval(interval);
  }, [sessionStarted]);

  useEffect(() => {
    if (!sessionStarted) return;
    if (timeLeft <= 0) { handleComplete(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [sessionStarted, timeLeft]);

  const handleStart = async () => {
    setLoading(true);
    try {
      try { await initializeVault(connection, publicKey); } catch {}
      try {
        await startSession(connection, publicKey, stakeAmount, duration * 60);
        setSessionStarted(true);
      } catch (startErr: any) {
        if (startErr.message?.includes('SessionAlreadyActive') || startErr.message?.includes('0x1770')) {
          await abandonSession(connection, publicKey);
          await startSession(connection, publicKey, stakeAmount, duration * 60);
          setSessionStarted(true);
        } else { throw startErr; }
      }
    } catch (err: any) {
      Alert.alert('Error', `Failed to start: ${err.message}`, [
        { text: 'Go Back', onPress: () => onAbandon('cancelled') }
      ]);
    } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const vaultBefore = await fetchVaultState(connection, publicKey);
      const sig = await completeSession(connection, publicKey);
      const vaultAfter = await fetchVaultState(connection, publicKey);

      const rewardBefore = vaultBefore ? ((vaultBefore as any).totalEarnedFromPool?.toNumber() ?? 0) : 0;
      const rewardAfter = vaultAfter ? ((vaultAfter as any).totalEarnedFromPool?.toNumber() ?? 0) : 0;
      const reward = Math.max(0, rewardAfter - rewardBefore) / 1e9;

      const existing = await AsyncStorage.getItem('focus_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift({ status: 'completed', completedAt: new Date().toISOString(), duration, stakeAmount, reward, taskNote, txSig: sig });
      await AsyncStorage.setItem('focus_history', JSON.stringify(history.slice(0, 100)));

      const streakData = await onSessionCompleted();
      await checkChallengeCompletion(duration, stakeAmount, 'completed');
      await sendCompletionNotification(reward);
      await scheduleStreakReminder(streakData.currentStreak);

      if (streakData.currentStreak > 0 && streakData.currentStreak % 7 === 0) {
        Alert.alert('🛡 Streak Shield Earned!', `${streakData.currentStreak} days. You've earned a shield.`, [{ text: 'Nice!' }]);
      }

      onComplete(sig, reward);
    } catch (err: any) {
      Alert.alert('Error', `Failed to complete: ${err.message}`);
    } finally { setLoading(false); }
  };

  const handleAbandon = async () => {
    Alert.alert('Abandon Session?', `You will forfeit ${(stakeAmount * 0.2).toFixed(3)} SOL`, [
      { text: 'Keep Going', style: 'cancel' },
      {
        text: 'Abandon', style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            const sig = await abandonSession(connection, publicKey);
            const existing = await AsyncStorage.getItem('focus_history');
            const history = existing ? JSON.parse(existing) : [];
            history.unshift({ status: 'abandoned', completedAt: new Date().toISOString(), duration, stakeAmount, reward: 0, taskNote, txSig: sig });
            await AsyncStorage.setItem('focus_history', JSON.stringify(history.slice(0, 100)));
            onAbandon(sig);
          } catch (err: any) {
            Alert.alert('Error', `Failed to abandon: ${err.message}`);
          } finally { setLoading(false); }
        }
      }
    ]);
  };

  const currentTrack = TRACKS[trackIndex];
  const currentQuote = QUOTES[quoteIndex];

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.textSub }]}>SESSION ACTIVE</Text>

      {taskNote ? (
        <View style={[styles.taskContainer, { backgroundColor: `${c.accent}0d`, borderColor: `${c.accent}26` }]}>
          <Text style={styles.taskEmoji}>🎯</Text>
          <Text style={[styles.taskNote, { color: c.accent }]} numberOfLines={1}>{taskNote}</Text>
        </View>
      ) : null}

      {/* Progress ring */}
      <View style={styles.ringContainer}>
        <ProgressRing progress={progress} color={ringColor} />
        <View style={styles.ringCenter}>
          {loading && !sessionStarted ? (
            <Text style={[styles.loadingText, { color: c.accent }]}>Starting...</Text>
          ) : (
            <>
              <Text style={[styles.timer, { color: c.text }, timeLeft < 60 && styles.timerRed]}>
                {formatTime(timeLeft)}
              </Text>
              <Text style={[styles.timerSub, { color: c.textMuted }]}>{duration} min session</Text>
            </>
          )}
        </View>
      </View>

      <Text style={[styles.locked, { color: c.textMuted }]}>🔒 {stakeAmount} SOL locked</Text>

      {/* Music controls with prev/next */}
      <View style={[styles.musicCard, { backgroundColor: `${c.accent}0a`, borderColor: `${c.accent}1a` }]}>
        <TouchableOpacity
          onPress={async () => {
            musicPrev();
          }}
          disabled={!sessionStarted}
          style={styles.musicNav}
        >
          <Text style={[styles.musicNavText, { color: c.textMuted }]}>‹</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.musicCenter}
          onPress={() => setShowTracks(!showTracks)}
          disabled={!sessionStarted}
        >
          <Text style={styles.musicEmoji}>{currentTrack.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.musicName, { color: c.accent }]}>{currentTrack.name}</Text>
            <Text style={[styles.musicDesc, { color: c.textMuted }]}>{currentTrack.description}</Text>
          </View>
          <Text style={[styles.musicChevron, { color: c.textMuted }]}>{showTracks ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={async () => {
            musicNext();
          }}
          disabled={!sessionStarted}
          style={styles.musicNav}
        >
          <Text style={[styles.musicNavText, { color: c.textMuted }]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Track list */}
      {showTracks && (
        <ScrollView style={[styles.trackList, { borderColor: `${c.accent}26` }]} showsVerticalScrollIndicator={false}>
          {TRACKS.map(track => (
            <TouchableOpacity
              key={track.index}
              style={[
                styles.trackItem, { borderBottomColor: `${c.accent}10` },
                trackIndex === track.index && { backgroundColor: `${c.accent}10` },
              ]}
              onPress={async () => {
                setTrackIndex(track.index);
                setShowTracks(false);
                if (!isPlaying) play(track.index);
              }}
            >
              <Text style={styles.trackItemEmoji}>{track.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trackItemName, { color: c.textMuted }, trackIndex === track.index && { color: c.accent }]}>
                  {track.name}
                </Text>
                <Text style={[styles.trackItemDesc, { color: c.textMuted }]}>{track.description}</Text>
              </View>
              {trackIndex === track.index && <Text style={[styles.trackCheck, { color: c.accent }]}>✓</Text>}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Rotating quote */}
      {!showTracks && (
        <Animated.View style={[styles.quoteContainer, { opacity: quoteOpacity }]}>
          <Text style={[styles.quoteText, { color: c.textMuted }]}>"{currentQuote.text}"</Text>
          {currentQuote.author ? (
            <Text style={[styles.quoteAuthor, { color: `${c.textMuted}77` }]}>— {currentQuote.author}</Text>
          ) : null}
        </Animated.View>
      )}

      {/* Abandon */}
      {!showTracks && (
        <TouchableOpacity
          onPress={handleAbandon}
          disabled={loading || !sessionStarted}
          style={[styles.abandonButton, { borderColor: c.cardBorder }, (loading || !sessionStarted) && styles.abandonButtonDisabled]}
        >
          <Text style={[styles.abandonText, { color: c.textSub }]}>
            Abandon — forfeit {(stakeAmount * 0.2).toFixed(3)} SOL
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  taskContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 20, width: '100%' },
  taskEmoji: { fontSize: 14, marginRight: 8 },
  taskNote: { fontSize: 13, flex: 1, fontStyle: 'italic' },
  loadingText: { fontSize: 13 },
  ringContainer: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  timer: { fontSize: 58, fontWeight: '200', letterSpacing: -2 },
  timerRed: { color: '#f87171' },
  timerSub: { fontSize: 12, textAlign: 'center', marginTop: 2 },
  locked: { fontSize: 12, marginBottom: 16 },
  musicCard: { flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 1, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  musicNav: { paddingHorizontal: 14, paddingVertical: 18 },
  musicNavText: { fontSize: 30, fontWeight: '200' },
  musicCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14 },
  musicEmoji: { fontSize: 20 },
  musicName: { fontSize: 13, fontWeight: '500' },
  musicDesc: { fontSize: 10, marginTop: 1 },
  musicChevron: { fontSize: 11, marginRight: 4 },
  trackList: { width: '100%', maxHeight: 260, borderWidth: 1, borderRadius: 12, marginBottom: 12 },
  trackItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  trackItemEmoji: { fontSize: 18, marginRight: 10 },
  trackItemName: { fontSize: 13, fontWeight: '500' },
  trackItemDesc: { fontSize: 10, marginTop: 1 },
  trackCheck: { fontSize: 14 },
  quoteContainer: { paddingHorizontal: 8, marginBottom: 24, alignItems: 'center' },
  quoteText: { fontSize: 12, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  quoteAuthor: { fontSize: 11, textAlign: 'center', marginTop: 5 },
  abandonButton: { borderWidth: 1, borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  abandonButtonDisabled: { opacity: 0.4 },
  abandonText: { fontSize: 14 },
});