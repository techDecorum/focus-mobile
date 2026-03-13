import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
  ScrollView, Animated, Dimensions, Platform, AppState, AppStateStatus,
} from 'react-native';
import { Connection, PublicKey } from '@solana/web3.js';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import {
  initializeVault, startSession, completeSession, abandonSession, fetchVaultState,
} from '../mobileVaultClient';
import { useMusic } from '../contexts/MusicContext';
import { useTheme } from '../contexts/ThemeContext';
import { onSessionCompleted } from '../services/StreakService';
import { checkChallengeCompletion } from '../services/DailyChallengeService';
import { sendCompletionNotification, scheduleStreakReminder } from '../services/NotificationService';

const { width, height } = Dimensions.get('window');

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
  { name: 'Deep Focus',           emoji: '🧠', description: 'Beta · 14Hz · Concentration',    index: 0  },
  { name: 'Flow State',           emoji: '🌊', description: 'Alpha · 10Hz · Creative flow',    index: 1  },
  { name: 'Deep Work',            emoji: '⚡', description: 'Gamma · 40Hz · Peak performance', index: 2  },
  { name: 'Calm Focus',           emoji: '🧘', description: 'Theta · 6Hz · Relaxed focus',     index: 3  },
  { name: 'Memory',               emoji: '💡', description: 'Beta · 12Hz · Memory retention',  index: 4  },
  { name: 'Meditation',           emoji: '☯️', description: 'Delta · 4Hz · Deep meditation',   index: 5  },
  { name: 'Energy Boost',         emoji: '🚀', description: 'Beta · 20Hz · Mental energy',     index: 6  },
  { name: 'Sleep Prep',           emoji: '🌙', description: 'Delta · 2Hz · Wind down',         index: 7  },
  { name: 'Dusty Jazz Piano',     emoji: '🎷', description: 'Jazz · 90s · Warm vibes',         index: 8  },
  { name: 'Mellow Drift',         emoji: '🌿', description: 'Ambient · Relaxing study',        index: 9  },
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
  { text: "The successful warrior is the average person, with laser-like focus.",                      author: "Bruce Lee"            },
  { text: "Deep work is the ability to focus without distraction on a cognitively demanding task.",    author: "Cal Newport"          },
  { text: "It's not that I'm so smart. I just stay with problems longer.",                            author: "Albert Einstein"      },
  { text: "Energy flows where attention goes.",                                                        author: ""                     },
  { text: "You don't rise to the level of your goals. You fall to the level of your systems.",        author: "James Clear"          },
  { text: "One hour of focused work beats three hours of distracted effort.",                         author: ""                     },
  { text: "The mind is everything. What you think, you become.",                                      author: "Buddha"               },
  { text: "Concentrate all your thoughts upon the work at hand.",                                     author: "Alexander Graham Bell" },
  { text: "The ability to perform deep work is becoming increasingly rare and increasingly valuable.", author: "Cal Newport"          },
  { text: "Where focus goes, energy flows.",                                                           author: "Tony Robbins"         },
  { text: "Clarity about what matters provides clarity about what does not.",                         author: "Cal Newport"          },
  { text: "The secret of getting ahead is getting started.",                                          author: "Mark Twain"           },
];

function ProgressRing({ progress, urgent }: { progress: number; urgent: boolean }) {
  const SIZE   = 248;
  const SW     = 6;
  const radius = (SIZE - SW) / 2;
  const circ   = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.min(progress, 100) / 100);

  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!urgent) { pulse.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [urgent]);

  return (
    <Animated.View style={{ width: SIZE, height: SIZE, transform: [{ scale: pulse }] }}>
      <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={SIZE/2} cy={SIZE/2} r={radius}
          stroke="rgba(77,217,172,0.07)" strokeWidth={SW} fill="none" />
      </Svg>
      <Svg width={SIZE} height={SIZE} style={[StyleSheet.absoluteFill, { transform: [{ rotate: '-90deg' }] }]}>
        <Defs>
          <SvgGrad id="pg" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={urgent ? '#dc2626' : '#1a5c46'} />
            <Stop offset="1" stopColor={urgent ? '#f87171' : '#4dd9ac'} />
          </SvgGrad>
        </Defs>
        <Circle cx={SIZE/2} cy={SIZE/2} r={radius}
          stroke="url(#pg)" strokeWidth={SW} fill="none"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ActiveScreen({
  duration, stakeAmount, publicKey, connection, taskNote, onComplete, onAbandon,
}: Props) {
  const { colors } = useTheme();

  const [timeLeft,       setTimeLeft]       = useState(duration * 60);
  const [loading,        setLoading]        = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showTracks,     setShowTracks]     = useState(false);
  const [quoteIndex,     setQuoteIndex]     = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [completeFailed, setCompleteFailed] = useState(false);

  const quoteOpacity   = useRef(new Animated.Value(1)).current;
  const enterAnim      = useRef(new Animated.Value(0)).current;
  const appStateRef    = useRef(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);
  const completedRef   = useRef(false);

  const { trackIndex, setTrackIndex, next: musicNext, prev: musicPrev, isPlaying, play } = useMusic();

  const totalSecs = duration * 60;
  const progress  = ((totalSecs - timeLeft) / totalSecs) * 100;
  const urgent    = timeLeft > 0 && timeLeft < 60;
  const penalty   = (stakeAmount * 0.2).toFixed(3);
  const refund    = (stakeAmount * 0.8).toFixed(3);

  const fmt = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // ── Entrance ───────────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.spring(enterAnim, { toValue: 1, tension: 55, friction: 11, useNativeDriver: true }).start();
    handleStart();
  }, []);

  // ── Quote rotation ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted) return;
    const iv = setInterval(() => {
      Animated.sequence([
        Animated.timing(quoteOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(quoteOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setQuoteIndex(i => (i + 1) % QUOTES.length), 500);
    }, 45000);
    return () => clearInterval(iv);
  }, [sessionStarted]);

  // ── Countdown ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionStarted) return;
    if (timeLeft <= 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        handleComplete();
      }
      return;
    }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [sessionStarted, timeLeft]);

  // ── AppState ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appStateRef.current === 'active' && nextState === 'background') {
        backgroundedAt.current = Date.now();
      }
      if (appStateRef.current === 'background' && nextState === 'active') {
        if (backgroundedAt.current && sessionStarted) {
          const elapsed = Math.floor((Date.now() - backgroundedAt.current) / 1000);
          setTimeLeft(prev => {
            const newTime = prev - elapsed;
            if (newTime <= 0) {
              if (!completedRef.current) {
                completedRef.current = true;
                handleComplete();
              }
              return 0;
            }
            return newTime;
          });
        }
        backgroundedAt.current = null;
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, [sessionStarted]);

  // ── Blockchain ─────────────────────────────────────────────────────────────
  const handleStart = async () => {
    setLoading(true);
    try {
      console.log('=== STEP 1: initializeVault ===');
      try { await initializeVault(connection, publicKey); } catch (e: any) {
        console.log('=== initializeVault failed (ok):', e.message);
      }

      console.log('=== STEP 2: startSession ===');
      try {
        await startSession(connection, publicKey, stakeAmount, duration * 60);
        console.log('=== STEP 2 SUCCESS ===');
        setSessionStarted(true);
      } catch (e: any) {
        console.log('=== startSession error:', e.message);
        if (e.message?.includes('SessionAlreadyActive') || e.message?.includes('0x1770')) {
          console.log('=== STEP 3: abandonSession ===');
          await abandonSession(connection, publicKey);
          console.log('=== STEP 4: startSession retry ===');
          await startSession(connection, publicKey, stakeAmount, duration * 60);
          console.log('=== STEP 4 SUCCESS ===');
          setSessionStarted(true);
        } else throw e;
      }
    } catch (err: any) {
      console.log('=== FATAL ERROR:', err.message);
      Alert.alert('Could not start session', 'Please go back and try again.', [
        { text: 'Go Back', onPress: () => onAbandon('cancelled') },
      ]);
    } finally { setLoading(false); }
  };

  const handleComplete = async () => {
    setLoading(true);
    setCompleteFailed(false);
    try {
      const vb  = await fetchVaultState(connection, publicKey);
      const sig = await completeSession(connection, publicKey);
      const va  = await fetchVaultState(connection, publicKey);
      const rb  = vb ? ((vb as any).totalEarnedFromPool?.toNumber() ?? 0) : 0;
      const ra  = va ? ((va as any).totalEarnedFromPool?.toNumber() ?? 0) : 0;
      const reward = Math.max(0, ra - rb) / 1e9;

      const existing = await AsyncStorage.getItem('focus_history');
      const history  = existing ? JSON.parse(existing) : [];
      history.unshift({ status: 'completed', completedAt: new Date().toISOString(), duration, stakeAmount, reward, taskNote, txSig: sig });
      await AsyncStorage.setItem('focus_history', JSON.stringify(history.slice(0, 100)));

      const streakData = await onSessionCompleted();
      await checkChallengeCompletion(duration, stakeAmount, 'completed');
      await sendCompletionNotification(reward);
      await scheduleStreakReminder(streakData.currentStreak);

      if (streakData.currentStreak > 0 && streakData.currentStreak % 7 === 0) {
        Alert.alert('🛡 Streak Shield Earned!', `${streakData.currentStreak} days. Shield activated.`, [{ text: 'Nice!' }]);
      }
      onComplete(sig, reward);
    } catch (err: any) {
      setCompleteFailed(true);
      Alert.alert(
        'Could not collect SOL',
        'Network issue detected. Make sure Phantom is set to Devnet, then tap Retry.',
        [{ text: 'OK' }]
      );
    } finally { setLoading(false); }
  };

  const handleAbandon = () => {
    Alert.alert(
      'Abandon session?',
      `Forfeit ${penalty} SOL penalty.\n${refund} SOL returns to your wallet immediately.`,
      [
        { text: 'Keep Going 💪', style: 'cancel' },
        {
          text: `Forfeit ${penalty} SOL`, style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const sig = await abandonSession(connection, publicKey);
              const existing = await AsyncStorage.getItem('focus_history');
              const history  = existing ? JSON.parse(existing) : [];
              history.unshift({ status: 'abandoned', completedAt: new Date().toISOString(), duration, stakeAmount, reward: 0, taskNote, txSig: sig });
              await AsyncStorage.setItem('focus_history', JSON.stringify(history.slice(0, 100)));
              onAbandon(sig);
            } catch (err: any) {
              Alert.alert('Error', `Failed to abandon: ${err.message}`);
            } finally { setLoading(false); }
          },
        },
      ]
    );
  };

  const track = TRACKS[trackIndex];
  const quote = QUOTES[quoteIndex];
  const RING_SIZE = 248;

  return (
    <View style={s.container}>
      <View style={[s.ambientGlow, urgent && s.ambientGlowUrgent]} />
      <Animated.View style={[
        s.inner,
        {
          opacity: enterAnim,
          transform: [{ translateY: enterAnim.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }],
        },
      ]}>
        <View style={s.topBar}>
          <View style={s.statusPill}>
            <Animated.View style={[s.statusDot, urgent && s.statusDotUrgent]} />
            <Text style={[s.statusLabel, urgent && s.statusLabelUrgent]}>
              {loading && !sessionStarted ? 'STARTING' : urgent ? 'ALMOST DONE' : 'SESSION ACTIVE'}
            </Text>
          </View>
          <View style={s.stakePill}>
            <Text style={s.stakeLock}>🔒</Text>
            <Text style={s.stakeAmt}>{stakeAmount} SOL</Text>
          </View>
        </View>

        {!!taskNote && (
          <View style={s.taskRow}>
            <Text style={s.taskEmoji}>🎯</Text>
            <Text style={s.taskText} numberOfLines={1}>{taskNote}</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <View style={s.timerSection}>
          <View style={[s.ringWrap, { width: RING_SIZE, height: RING_SIZE }]}>
            <ProgressRing progress={progress} urgent={urgent} />
            <View style={s.ringCenter}>
              {loading && !sessionStarted ? (
                <Text style={s.startingLabel}>Starting…</Text>
              ) : (
                <>
                  <Text style={[s.timerText, urgent && s.timerUrgent]}>{fmt(timeLeft)}</Text>
                  <Text style={s.timerSub}>{duration} min</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={{ flex: 2 }} />

        <View style={s.bottomSection}>
          <View style={s.musicRow}>
            <TouchableOpacity onPress={musicPrev} disabled={!sessionStarted} style={s.musicArrow}>
              <Text style={s.musicArrowTxt}>‹</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.musicPill}
              onPress={() => setShowTracks(v => !v)}
              disabled={!sessionStarted}
              activeOpacity={0.75}
            >
              <Text style={s.musicEmoji}>{track.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.musicName}>{track.name}</Text>
                <Text style={s.musicDesc}>{track.description}</Text>
              </View>
              <Text style={s.musicChevron}>{showTracks ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={musicNext} disabled={!sessionStarted} style={s.musicArrow}>
              <Text style={s.musicArrowTxt}>›</Text>
            </TouchableOpacity>
          </View>

          {showTracks && (
            <ScrollView style={s.trackList} showsVerticalScrollIndicator={false}>
              {TRACKS.map(t => (
                <TouchableOpacity
                  key={t.index}
                  style={[s.trackItem, trackIndex === t.index && s.trackItemActive]}
                  onPress={() => {
                    setTrackIndex(t.index);
                    setShowTracks(false);
                    if (!isPlaying) play(t.index);
                  }}
                >
                  <Text style={s.trackEmoji}>{t.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.trackName, trackIndex === t.index && s.trackNameActive]}>{t.name}</Text>
                    <Text style={s.trackDesc}>{t.description}</Text>
                  </View>
                  {trackIndex === t.index && <Text style={s.trackCheck}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {!showTracks && (
            <Animated.View style={[s.quoteBlock, { opacity: quoteOpacity }]}>
              <Text style={s.quoteMark}>"</Text>
              <Text style={s.quoteText}>{quote.text}</Text>
              {!!quote.author && <Text style={s.quoteAuthor}>— {quote.author}</Text>}
            </Animated.View>
          )}

          {completeFailed && !showTracks && (
            <TouchableOpacity
              onPress={() => {
                completedRef.current = false;
                handleComplete();
              }}
              style={s.retryBtn}
              activeOpacity={0.75}
            >
              <Text style={s.retryIcon}>↻</Text>
              <View>
                <Text style={s.retryText}>Retry Collecting SOL</Text>
                <Text style={s.retrySub}>Switch Phantom to Devnet first</Text>
              </View>
            </TouchableOpacity>
          )}

          {!showTracks && (
            <TouchableOpacity
              onPress={handleAbandon}
              disabled={loading || !sessionStarted}
              style={[s.abandonBtn, (loading || !sessionStarted) && s.abandonDisabled]}
              activeOpacity={0.55}
            >
              <Text style={s.abandonLeft}>Abandon</Text>
              <View style={s.abandonTag}>
                <Text style={s.abandonTagTxt}>forfeit {penalty} SOL · 20% penalty</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const A  = '#4dd9ac';
const AD = 'rgba(77,217,172,0.5)';
const T  = '#dff5ec';
const M  = 'rgba(223,245,236,0.3)';
const CB = 'rgba(77,217,172,0.08)';
const CE = 'rgba(77,217,172,0.13)';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020814' },
  ambientGlow: {
    position: 'absolute',
    top: height * 0.18, left: width / 2 - 140,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'transparent',
    shadowColor: A, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18, shadowRadius: 90,
  },
  ambientGlowUrgent: { shadowColor: '#f87171', shadowOpacity: 0.22 },
  inner: {
    flex: 1, paddingHorizontal: 22,
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 28, alignItems: 'center', justifyContent: 'flex-start',
  },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 18 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderColor: CE, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: CB,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: A },
  statusDotUrgent: { backgroundColor: '#f87171' },
  statusLabel: { fontSize: 9, letterSpacing: 2.5, color: AD, fontWeight: '700' },
  statusLabelUrgent: { color: '#fca5a5' },
  stakePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.18)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: 'rgba(251,191,36,0.05)',
  },
  stakeLock: { fontSize: 11 },
  stakeAmt: { fontSize: 12, color: '#fbbf24', fontWeight: '600', letterSpacing: 0.3 },
  timerSection: { width: '100%', alignItems: 'center' },
  bottomSection: { width: '100%', paddingBottom: 4 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderColor: CE, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: CB, width: '100%', marginBottom: 24,
  },
  taskEmoji: { fontSize: 14 },
  taskText: { flex: 1, color: A, fontSize: 13, fontStyle: 'italic', fontWeight: '500' },
  ringWrap: { alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  startingLabel: { color: AD, fontSize: 14 },
  timerText: { fontSize: 70, fontWeight: '100', letterSpacing: -4, color: T, fontVariant: ['tabular-nums'] },
  timerUrgent: { color: '#f87171' },
  timerSub: { fontSize: 10, color: M, letterSpacing: 1.5, marginTop: 2, textTransform: 'uppercase' },
  musicRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%', marginBottom: 18 },
  musicArrow: { paddingHorizontal: 4, paddingVertical: 10 },
  musicArrowTxt: { fontSize: 30, color: M, fontWeight: '100', lineHeight: 32 },
  musicPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: CE, borderRadius: 50,
    paddingHorizontal: 16, paddingVertical: 11, backgroundColor: CB,
  },
  musicEmoji: { fontSize: 18 },
  musicName: { fontSize: 12, color: A, fontWeight: '600' },
  musicDesc: { fontSize: 10, color: M, marginTop: 1 },
  musicChevron: { fontSize: 9, color: M },
  trackList: {
    width: '100%', maxHeight: 230,
    borderWidth: 1, borderColor: CE, borderRadius: 14,
    marginBottom: 16, backgroundColor: CB,
  },
  trackItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: 'rgba(77,217,172,0.06)',
  },
  trackItemActive: { backgroundColor: 'rgba(77,217,172,0.1)' },
  trackEmoji: { fontSize: 17, width: 26 },
  trackName: { fontSize: 12, color: M, fontWeight: '500' },
  trackNameActive: { color: A },
  trackDesc: { fontSize: 10, color: 'rgba(223,245,236,0.18)', marginTop: 1 },
  trackCheck: { fontSize: 13, color: A },
  quoteBlock: { alignItems: 'center', paddingHorizontal: 16, marginBottom: 20, width: '100%' },
  quoteMark: { fontSize: 28, color: 'rgba(77,217,172,0.1)', fontWeight: '900', lineHeight: 22, marginBottom: 2 },
  quoteText: { fontSize: 12, color: 'rgba(223,245,236,0.28)', textAlign: 'center', fontStyle: 'italic', lineHeight: 19 },
  quoteAuthor: { fontSize: 10, color: 'rgba(223,245,236,0.16)', textAlign: 'center', marginTop: 5, letterSpacing: 0.4 },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: 'rgba(251,191,36,0.3)', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 18, width: '100%',
    backgroundColor: 'rgba(251,191,36,0.06)', marginBottom: 12,
  },
  retryIcon: { fontSize: 22, color: '#fbbf24' },
  retryText: { fontSize: 13, color: '#fbbf24', fontWeight: '600' },
  retrySub: { fontSize: 10, color: 'rgba(251,191,36,0.5)', marginTop: 2 },
  abandonBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.12)', borderRadius: 14,
    paddingVertical: 13, paddingHorizontal: 18, width: '100%',
    backgroundColor: 'rgba(248,113,113,0.03)',
  },
  abandonDisabled: { opacity: 0.3 },
  abandonLeft: { fontSize: 13, color: 'rgba(248,113,113,0.45)', fontWeight: '500' },
  abandonTag: {
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.14)', borderRadius: 8,
    paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(248,113,113,0.06)',
  },
  abandonTagTxt: { fontSize: 10, color: 'rgba(248,113,113,0.4)', letterSpacing: 0.2 },
});