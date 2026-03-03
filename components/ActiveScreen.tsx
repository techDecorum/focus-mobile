import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  initializeVault, startSession, completeSession, abandonSession, fetchVaultState,
} from '../mobileVaultClient';
import { useBinauralBeats } from '../hooks/useBinauralBeats';
import { useTheme } from '../contexts/ThemeContext';

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
  { name: 'Deep Focus',          emoji: '🧠', description: 'Beta · 14Hz · Concentration',    index: 0 },
  { name: 'Flow State',          emoji: '🌊', description: 'Alpha · 10Hz · Creative flow',    index: 1 },
  { name: 'Deep Work',           emoji: '⚡', description: 'Gamma · 40Hz · Peak performance', index: 2 },
  { name: 'Calm Focus',          emoji: '🧘', description: 'Theta · 6Hz · Relaxed focus',     index: 3 },
  { name: 'Memory',              emoji: '💡', description: 'Beta · 12Hz · Memory retention',  index: 4 },
  { name: 'Meditation',          emoji: '☯️', description: 'Delta · 4Hz · Deep meditation',   index: 5 },
  { name: 'Energy Boost',        emoji: '🚀', description: 'Beta · 20Hz · Mental energy',     index: 6 },
  { name: 'Sleep Prep',          emoji: '🌙', description: 'Delta · 2Hz · Wind down',         index: 7 },
  { name: 'Dusty Jazz Piano',    emoji: '🎷', description: 'Jazz · 90s · Warm vibes',         index: 8 },
  { name: 'Mellow Drift',        emoji: '🌿', description: 'Ambient · Relaxing study',        index: 9 },
  { name: 'Deep Long Study',     emoji: '📚', description: 'Deep · Long work sessions',       index: 10 },
  { name: 'Spacious Motifs',     emoji: '🌌', description: 'Ambient · Flow state',            index: 11 },
  { name: 'Quiet Focus Motif',   emoji: '🕊️', description: 'Calm · Quiet concentration',      index: 12 },
  { name: 'Deep Focus Piano',    emoji: '🖤', description: 'Piano · Deep focus',              index: 13 },
  { name: 'Mind Memory',         emoji: '🔮', description: 'Ambient · Memory retention',      index: 14 },
  { name: 'Gentle Concentration',emoji: '🌸', description: 'Meditation · Gentle focus',       index: 15 },
  { name: 'Moments Are Peaceful',emoji: '☁️', description: 'Ambient · Peaceful moments',      index: 16 },
  { name: 'Glass Shore at Dusk', emoji: '🌅', description: 'Ambient · Evening wind down',     index: 17 },
  { name: 'Midnight Sleep Prep', emoji: '🌃', description: 'Sleep · Midnight wind down',      index: 18 },
];

export default function ActiveScreen({
  duration, stakeAmount, publicKey, connection, taskNote, onComplete, onAbandon
}: Props) {
  const { colors } = useTheme();
  const c = colors;
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [loading, setLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);
  const [showTracks, setShowTracks] = useState(false);

  useBinauralBeats(sessionStarted, trackIndex);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  useEffect(() => { handleStart(); }, []);

  useEffect(() => {
    if (!sessionStarted) return;
    if (timeLeft <= 0) { handleComplete(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [sessionStarted, timeLeft]);

  const handleStart = async () => {
    setLoading(true);
    try {
      try { await initializeVault(connection, publicKey); } catch { console.log('Vault already exists'); }
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
      const sig = await completeSession(connection, publicKey);
      const vaultState = await fetchVaultState(connection, publicKey);
      const reward = vaultState ? ((vaultState as any).totalEarnedFromPool?.toNumber() ?? 0) / 1e9 : 0;
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
            onAbandon(sig);
          } catch (err: any) {
            Alert.alert('Error', `Failed to abandon: ${err.message}`);
          } finally { setLoading(false); }
        }
      }
    ]);
  };

  const currentTrack = TRACKS[trackIndex];

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.textSub }]}>SESSION ACTIVE</Text>

      {taskNote ? (
        <View style={[styles.taskContainer, { backgroundColor: `${c.accent}0d`, borderColor: `${c.accent}26` }]}>
          <Text style={styles.taskEmoji}>🎯</Text>
          <Text style={[styles.taskNote, { color: c.accent }]} numberOfLines={2}>{taskNote}</Text>
        </View>
      ) : null}

      <Text style={[styles.locked, { color: c.textMuted }]}>🔒 {stakeAmount} SOL committed to vault</Text>

      {loading && (
        <Text style={[styles.loading, { color: c.accent }]}>
          {!sessionStarted ? '⏳ Starting session...' : '⏳ Processing...'}
        </Text>
      )}

      <View style={styles.timerContainer}>
        <Text style={[styles.timer, { color: c.text }, timeLeft < 60 && styles.timerRed]}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={[styles.timerSub, { color: c.textSub }]}>{duration} min session</Text>
      </View>

      <View style={[styles.progressBar, { backgroundColor: `${c.accent}1a` }]}>
        <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: c.accent }]} />
      </View>

      <TouchableOpacity
        style={[styles.trackButton, { borderColor: `${c.accent}33`, backgroundColor: `${c.accent}0d` }]}
        onPress={() => setShowTracks(!showTracks)}
        disabled={!sessionStarted}
      >
        <Text style={styles.trackEmoji}>{currentTrack.emoji}</Text>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, { color: c.accent }]}>{currentTrack.name}</Text>
          <Text style={[styles.trackDesc, { color: c.textSub }]}>{currentTrack.description}</Text>
        </View>
        <Text style={[styles.trackChevron, { color: c.textSub }]}>{showTracks ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {showTracks && (
        <ScrollView style={[styles.trackList, { borderColor: `${c.accent}26` }]} showsVerticalScrollIndicator={false}>
          {TRACKS.map((track) => (
            <TouchableOpacity
              key={track.index}
              style={[
                styles.trackItem,
                { borderBottomColor: `${c.accent}10` },
                trackIndex === track.index && { backgroundColor: `${c.accent}10` },
              ]}
              onPress={() => { setTrackIndex(track.index); setShowTracks(false); }}
            >
              <Text style={styles.trackItemEmoji}>{track.emoji}</Text>
              <View>
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

      {!showTracks && (
        <>
          <Text style={[styles.quote, { color: c.textMuted }]}>
            "The successful warrior is the average person,{'\n'}with laser-like focus."
          </Text>
          <TouchableOpacity
            onPress={handleAbandon}
            disabled={loading || !sessionStarted}
            style={[styles.abandonButton, { borderColor: c.cardBorder }, (loading || !sessionStarted) && styles.abandonButtonDisabled]}
          >
            <Text style={[styles.abandonText, { color: c.textSub }]}>
              Abandon — forfeit {(stakeAmount * 0.2).toFixed(3)} SOL
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  label: { fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  taskContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 12, width: '100%' },
  taskEmoji: { fontSize: 16, marginRight: 8 },
  taskNote: { fontSize: 13, flex: 1, fontStyle: 'italic' },
  locked: { fontSize: 13, marginBottom: 24 },
  loading: { fontSize: 13, marginBottom: 16 },
  timerContainer: { alignItems: 'center', marginBottom: 32 },
  timer: { fontSize: 72, fontWeight: '200', letterSpacing: -2 },
  timerRed: { color: '#f87171' },
  timerSub: { fontSize: 13, marginTop: 8 },
  progressBar: { width: '100%', height: 2, borderRadius: 1, marginBottom: 24 },
  progressFill: { height: '100%', borderRadius: 1 },
  trackButton: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 14, marginBottom: 16, borderWidth: 1, borderRadius: 12 },
  trackEmoji: { fontSize: 24, marginRight: 12 },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 14, fontWeight: '500' },
  trackDesc: { fontSize: 11, marginTop: 2 },
  trackChevron: { fontSize: 12 },
  trackList: { width: '100%', maxHeight: 320, borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  trackItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  trackItemEmoji: { fontSize: 20, marginRight: 12 },
  trackItemName: { fontSize: 13, fontWeight: '500' },
  trackItemDesc: { fontSize: 11, marginTop: 2 },
  trackCheck: { fontSize: 16, marginLeft: 'auto' },
  quote: { fontSize: 13, textAlign: 'center', fontStyle: 'italic', marginBottom: 48, lineHeight: 20 },
  abandonButton: { borderWidth: 1, borderRadius: 12, padding: 16, width: '100%', alignItems: 'center' },
  abandonButtonDisabled: { opacity: 0.4 },
  abandonText: { fontSize: 14 },
});