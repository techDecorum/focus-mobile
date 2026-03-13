import AsyncStorage from '@react-native-async-storage/async-storage';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Modal, Animated, Dimensions, ScrollView, KeyboardAvoidingView,
  Platform, Linking, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuroraBackground from './AuroraBackground';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import FirstSessionHint from './FirstSessionHint';
import { fetchPoolState } from '../mobileVaultClient';

const { height } = Dimensions.get('window');
const PROGRAM_ID = new PublicKey('2bsjJXARsoLH49Svs1pRw98rr1dctYHJHov43dLvqUjg');

// ─── SKR token mint (official Solana Mobile contract) ─────────────────────────
export const SKR_MINT = new PublicKey('SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3');
export type StakeToken = 'SOL' | 'SKR';

const TWEET_TEXT = encodeURIComponent(
  `🧠 Just discovered SolFocus — the app that makes you stake SOL to stay focused.\n\nComplete your session → full refund.\nAbandon early → lose 20%.\n\nBuilt on @Solana ⚡\n\nhttps://focus-app-orpin.vercel.app`
);

// ─── SKR stake amounts (in SKR — much larger numbers than SOL) ────────────────
const SOL_STAKES  = [0.01, 0.05, 0.1, 0.25, 0.5];
const SKR_STAKES  = [10, 50, 100, 250, 500];

interface Props {
  onStart: (duration: number, stakeAmount: number, taskNote: string, token: StakeToken) => void;
  onShowInfo: () => void;
  hintTrigger?: number;
}

const DURATIONS = [
  { mins: 1,  label: '1',  sub: 'Quick Start' },
  { mins: 5,  label: '5',  sub: 'Micro Focus' },
  { mins: 15, label: '15', sub: 'Power Block' },
  { mins: 30, label: '30', sub: 'Deep Focus'  },
  { mins: 60, label: '60', sub: 'Flow State'  },
  { mins: 90, label: '90', sub: 'Marathon'    },
];

type SheetStep = 'connect' | 'session';

function friendlyError(err: any): string {
  const msg: string = err?.message ?? String(err ?? '');
  if (/user rejected|cancelled|canceled/i.test(msg))
    return 'Wallet connection was cancelled — tap to try again.';
  if (/signature verification|missing signature/i.test(msg))
    return 'Transaction failed. Make sure your wallet is unlocked and try again.';
  if (/insufficient|not enough/i.test(msg))
    return 'Not enough balance. Please top up your wallet and try again.';
  if (/network|timeout|fetch/i.test(msg))
    return 'Network error — check your connection and try again.';
  if (/blockhash/i.test(msg))
    return 'Transaction expired — please try again.';
  return 'Something went wrong. Please try again.';
}

export default function HomeScreen({ onStart, onShowInfo, hintTrigger = 0 }: Props) {
  const { theme, colors } = useTheme();
  const c = colors;
  const { connection } = useConnection();
  const { walletAddress, solBalance, publicKey, connect } = useWallet();

  const [poolBalance, setPoolBalance]   = useState<number>(0);
  const [streak, setStreak]             = useState(0);
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [sheetStep, setSheetStep]       = useState<SheetStep>('session');
  const [duration, setDuration]         = useState(15);
  // ── Token toggle state ────────────────────────────────────────────────────────
  const [stakeToken, setStakeToken]     = useState<StakeToken>('SOL');
  const [solStake, setSolStake]         = useState(0.01);
  const [skrStake, setSkrStake]         = useState(100);
  const [taskNote, setTaskNote]         = useState('');
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [connecting, setConnecting]     = useState(false);
  const [staking, setStaking]           = useState(false);

  // Animated toggle slider
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(height)).current;

  // ── Pool balance ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!connection) return;
    fetchPoolState(connection, PROGRAM_ID)
      .then((pool: any) => {
        if (pool?.totalBalance) setPoolBalance(pool.totalBalance.toNumber() / 1e9);
      })
      .catch(() => {});
  }, [connection]);

  // ── Streak ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('focus_history').then(data => {
      if (!data) return;
      const history = JSON.parse(data);
      const uniqueDates = [...new Set(
        history
          .filter((h: any) => h.status === 'completed')
          .map((h: any) => new Date(h.completedAt).toDateString()),
      )] as string[];
      let count = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (uniqueDates.includes(d.toDateString())) count++;
        else break;
      }
      setStreak(count);
    }).catch(() => {});
  }, []);

  // ── Token toggle ──────────────────────────────────────────────────────────────
  const switchToken = (token: StakeToken) => {
    setStakeToken(token);
    setErrorMsg(null);
    Animated.spring(toggleAnim, {
      toValue: token === 'SKR' ? 1 : 0,
      tension: 80, friction: 12, useNativeDriver: false,
    }).start();
  };

  // Derived values
  const stakeAmount    = stakeToken === 'SOL' ? solStake : skrStake;
  const stakeAmounts   = stakeToken === 'SOL' ? SOL_STAKES : SKR_STAKES;
  const setStakeAmount = stakeToken === 'SOL' ? setSolStake : setSkrStake;

  // ── Sheet helpers ─────────────────────────────────────────────────────────────
  const openSheet = () => {
    setErrorMsg(null);
    setSheetStep(walletAddress ? 'session' : 'connect');
    setSheetOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: height, duration: 300, useNativeDriver: true,
    }).start(() => {
      setSheetOpen(false);
      setStaking(false);
      setErrorMsg(null);
    });
  };

  const handleInlineConnect = async () => {
    setConnecting(true);
    setErrorMsg(null);
    try {
      await connect();
      setSheetStep('session');
    } catch (err: any) {
      setErrorMsg(friendlyError(err));
    } finally {
      setConnecting(false);
    }
  };

  const skrComingSoon = stakeToken === 'SKR';

  const handleBegin = async () => {
    if (skrComingSoon) return; // guard — contract not yet deployed
    setErrorMsg(null);
    if (!taskNote.trim()) {
      setErrorMsg("Tell us what you're focusing on first.");
      return;
    }
    setStaking(true);
    try {
      closeSheet();
      setTimeout(() => onStart(duration, stakeAmount, taskNote.trim(), stakeToken), 350);
    } catch (err: any) {
      setStaking(false);
      setErrorMsg(friendlyError(err));
    }
  };

  const lightBg = theme === 'light';

  // Interpolated toggle knob position
  const knobLeft = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [2, 46] });
  // SKR accent: golden/amber to signal "Seeker native"
  const SKR_COLOR = '#f59e0b';
  const activeTokenColor = stakeToken === 'SKR' ? SKR_COLOR : c.accent;

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: lightBg ? '#e8f5f0' : '#020814' }]}>

      {lightBg ? (
        <LinearGradient colors={['#c8ede0', '#e8f5f0', '#f0faf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      ) : (
        <AuroraBackground />
      )}

      {/* Top left */}
      <View style={styles.topLeft}>
        <TouchableOpacity
          style={[styles.howItWorksBtn, {
            borderColor: `${c.accent}44`,
            backgroundColor: lightBg ? 'rgba(255,255,255,0.8)' : 'rgba(6,13,18,0.7)',
          }]}
          onPress={onShowInfo}
        >
          <Text style={[styles.howItWorksIcon, { color: c.accent }]}>?</Text>
          <Text style={[styles.howItWorksLabel, { color: c.accent }]}>How it works</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topIconBtn, {
            borderColor: 'rgba(29,161,242,0.35)',
            backgroundColor: lightBg ? 'rgba(255,255,255,0.8)' : 'rgba(6,13,18,0.7)',
          }]}
          onPress={() => Linking.openURL(`https://twitter.com/intent/tweet?text=${TWEET_TEXT}`)}
        >
          <Text style={[styles.topIconText, { color: 'rgb(29,161,242)' }]}>𝕏</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet pill */}
      <View style={styles.topBar}>
        {!walletAddress ? (
          <TouchableOpacity
            style={[styles.walletBtn, {
              borderColor: `${c.accent}55`,
              backgroundColor: lightBg ? 'rgba(255,255,255,0.8)' : 'rgba(6,13,18,0.7)',
            }]}
            onPress={openSheet}
          >
            <Text style={[styles.walletBtnText, { color: c.accent }]}>Connect Wallet</Text>
          </TouchableOpacity>
        ) : (
          <View style={[styles.walletConnected, {
            backgroundColor: lightBg ? 'rgba(255,255,255,0.8)' : 'rgba(6,13,18,0.7)',
            borderColor: `${c.accent}33`,
          }]}>
            <View style={[styles.walletDot, { backgroundColor: c.accent }]} />
            <Text style={[styles.walletText, { color: c.accent }]}>
              {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
            </Text>
            {solBalance !== null && (
              <Text style={[styles.walletBalance, { color: c.accent }]}>{solBalance.toFixed(3)} SOL</Text>
            )}
          </View>
        )}
      </View>

      {/* Center */}
      <View style={styles.center}>
        <Text style={[styles.appName, { color: lightBg ? '#0a2018' : '#f0faf6' }]}>SOLFOCUS</Text>
        <Text style={[styles.tagline, { color: lightBg ? c.accentDark : 'rgba(77,217,172,0.7)' }]}>
          Stake your attention.
        </Text>
        <Text style={[styles.tagline2, { color: lightBg ? `${c.accentDark}99` : 'rgba(77,217,172,0.5)' }]}>
          Earn it back.
        </Text>
        {streak > 0 && (
          <View style={[styles.streakBadge, {
            backgroundColor: lightBg ? 'rgba(255,255,255,0.6)' : 'rgba(6,13,18,0.5)',
            borderColor: 'rgba(251,146,60,0.3)',
          }]}>
            <Text style={styles.streakText}>🔥 {streak} day streak</Text>
          </View>
        )}
      </View>

      <FirstSessionHint onPress={openSheet} triggerKey={hintTrigger} />

      {/* Bottom CTA */}
      <View style={styles.bottomArea}>
        {poolBalance > 0 && (
          <View style={[styles.poolBadge, {
            backgroundColor: lightBg ? 'rgba(255,255,255,0.6)' : 'rgba(6,13,18,0.6)',
            borderColor: 'rgba(251,191,36,0.25)',
          }]}>
            <Text style={styles.poolDot}>●</Text>
            <Text style={styles.poolText}>Penalty pool · {poolBalance.toFixed(4)} SOL</Text>
          </View>
        )}
        <TouchableOpacity onPress={openSheet} activeOpacity={0.85}>
          <LinearGradient colors={['#2a7a5e', '#4dd9ac']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.startBtn}>
            <Text style={styles.startIcon}>◈</Text>
            <Text style={styles.startText}>Start Focus</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.hint, { color: lightBg ? `${c.accentDark}99` : 'rgba(42,122,94,0.6)' }]}>
          Complete → full refund · Abandon → lose 20%
        </Text>
      </View>

      {/* ── Bottom Sheet ───────────────────────────────────────────────────────── */}
      <Modal visible={sheetOpen} transparent animationType="none">
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet} />
        <Animated.View style={[
          styles.sheet,
          { backgroundColor: c.sheetBg, borderColor: `${c.accent}22` },
          { transform: [{ translateY: slideAnim }] },
        ]}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={[styles.handle, { backgroundColor: `${c.accent}33` }]} />
            <ScrollView showsVerticalScrollIndicator={false}>

              {/* ── Connect step ────────────────────────────────────────────────── */}
              {sheetStep === 'connect' ? (
                <View style={styles.connectStep}>
                  <Text style={styles.connectEmoji}>🔐</Text>
                  <Text style={[styles.sheetTitle, { color: c.text, textAlign: 'center' }]}>
                    Connect your wallet
                  </Text>
                  <Text style={[styles.connectSub, { color: c.textSub }]}>
                    You'll need a Phantom wallet to stake and start a focus session.
                  </Text>
                  {errorMsg && <ErrorBox msg={errorMsg} />}
                  <LinearGradient colors={['#2a7a5e', '#4dd9ac']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.beginBtn, { marginTop: 4 }]}>
                    <TouchableOpacity onPress={handleInlineConnect} style={styles.beginBtnInner} disabled={connecting}>
                      {connecting
                        ? <ActivityIndicator color="#060d12" />
                        : <Text style={styles.beginBtnText}>Connect Phantom Wallet</Text>
                      }
                    </TouchableOpacity>
                  </LinearGradient>
                  <TouchableOpacity onPress={closeSheet} style={styles.cancelBtn}>
                    <Text style={[styles.cancelText, { color: c.textMuted }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>

              ) : (
                /* ── Session config ────────────────────────────────────────────── */
                <>
                  <Text style={[styles.sheetTitle, { color: c.text }]}>New Session</Text>
                  {errorMsg && <ErrorBox msg={errorMsg} />}

                  {/* ── STAKE TOKEN TOGGLE ──────────────────────────────────────── */}
                  <Text style={[styles.sheetLabel, { color: c.textSub }]}>STAKE WITH</Text>
                  <View style={[styles.tokenToggleWrap, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                    {/* Animated sliding pill */}
                    <Animated.View style={[
                      styles.togglePill,
                      {
                        left: knobLeft,
                        backgroundColor: stakeToken === 'SKR' ? `${SKR_COLOR}22` : `${c.accent}22`,
                        borderColor: stakeToken === 'SKR' ? SKR_COLOR : c.accent,
                      },
                    ]} />

                    <TouchableOpacity
                      style={styles.tokenTab}
                      onPress={() => switchToken('SOL')}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.tokenTabText,
                        { color: stakeToken === 'SOL' ? c.accent : c.textMuted },
                        stakeToken === 'SOL' && styles.tokenTabActive,
                      ]}>
                        ◎ SOL
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.tokenTab}
                      onPress={() => switchToken('SKR')}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        styles.tokenTabText,
                        { color: stakeToken === 'SKR' ? SKR_COLOR : c.textMuted },
                        stakeToken === 'SKR' && styles.tokenTabActive,
                      ]}>
                          📱 SKR
                      </Text>
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>SOON</Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* SKR context chip */}
                  {stakeToken === 'SKR' && (
                    <View style={[styles.skrChip, { backgroundColor: `${SKR_COLOR}10`, borderColor: `${SKR_COLOR}30` }]}>
                      <Text style={styles.skrChipIcon}>⚡</Text>
                      <Text style={[styles.skrChipText, { color: SKR_COLOR }]}>
                        Seeker-native mode · SKR mint: SKRbvo6…NPGZhW3
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.sheetLabel, { color: c.textSub, marginTop: 20 }]}>WHAT ARE YOU FOCUSING ON?</Text>
                  <TextInput
                    style={[styles.taskInput, { borderColor: c.inputBorder, backgroundColor: c.inputBg, color: c.text }]}
                    placeholder="e.g. Build the login page..."
                    placeholderTextColor={c.textMuted}
                    value={taskNote}
                    onChangeText={t => { setTaskNote(t); setErrorMsg(null); }}
                    maxLength={100}
                    returnKeyType="done"
                  />

                  <Text style={[styles.sheetLabel, { color: c.textSub }]}>DURATION</Text>
                  <View style={styles.durationGrid}>
                    {DURATIONS.map(d => (
                      <TouchableOpacity
                        key={d.mins}
                        onPress={() => setDuration(d.mins)}
                        style={[
                          styles.durationBtn,
                          { borderColor: c.cardBorder, backgroundColor: c.card },
                          duration === d.mins && { borderColor: activeTokenColor, backgroundColor: `${activeTokenColor}15` },
                        ]}
                      >
                        <Text style={[styles.durationNum, { color: c.textSub }, duration === d.mins && { color: activeTokenColor }]}>
                          {d.label}
                        </Text>
                        <Text style={[styles.durationSub, { color: c.textMuted }]}>{d.sub}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.sheetLabel, { color: c.textSub }]}>
                    STAKE AMOUNT ({stakeToken})
                  </Text>
                  <View style={styles.stakeRow}>
                    {stakeAmounts.map(amount => (
                      <TouchableOpacity
                        key={amount}
                        onPress={() => setStakeAmount(amount)}
                        style={[
                          styles.stakeBtn,
                          { borderColor: c.cardBorder },
                          stakeAmount === amount && { borderColor: activeTokenColor, backgroundColor: `${activeTokenColor}15` },
                        ]}
                      >
                        <Text style={[
                          styles.stakeBtnText,
                          { color: c.textSub },
                          stakeAmount === amount && { color: activeTokenColor },
                        ]}>
                          {amount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Begin button — disabled with explanatory banner when SKR selected */}
                  {skrComingSoon ? (
                    <View style={styles.skrComingSoonBtn}>
                      <Text style={styles.skrComingSoonTitle}>📱 SKR staking coming soon</Text>
                      <Text style={styles.skrComingSoonSub}>
                        {"Smart contract support is in development.\nSwitch to SOL to start a session now."}
                      </Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={['#2a7a5e', '#4dd9ac']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.beginBtn}
                    >
                      <TouchableOpacity onPress={handleBegin} style={styles.beginBtnInner} disabled={staking}>
                        {staking ? (
                          <View style={styles.stakingRow}>
                            <ActivityIndicator color="#060d12" size="small" />
                            <Text style={styles.beginBtnText}>Staking SOL...</Text>
                          </View>
                        ) : (
                          <Text style={styles.beginBtnText}>
                            Begin · {duration} min · {stakeAmount} SOL
                          </Text>
                        )}
                      </TouchableOpacity>
                    </LinearGradient>
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ─── Inline error box component ───────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <View style={[styles.errorBox, { backgroundColor: 'rgba(248,113,113,0.08)', borderColor: 'rgba(248,113,113,0.3)' }]}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{msg}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  topLeft: {
    position: 'absolute', top: 52, left: 20, zIndex: 10,
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  howItWorksBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 12,
  },
  howItWorksIcon: { fontSize: 14, fontWeight: '800' },
  howItWorksLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  topIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  topIconText: { fontSize: 15, fontWeight: '700' },
  topBar: { position: 'absolute', top: 52, right: 20, zIndex: 10 },
  walletBtn: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  walletBtnText: { fontSize: 12, fontWeight: '600' },
  walletConnected: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  walletDot: { width: 6, height: 6, borderRadius: 3 },
  walletText: { fontSize: 11 },
  walletBalance: { fontSize: 11, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -60 },
  appName: { fontSize: 52, fontWeight: '900', letterSpacing: 16, opacity: 0.95 },
  tagline: { fontSize: 16, marginTop: 12, letterSpacing: 2 },
  tagline2: { fontSize: 14, marginTop: 4, letterSpacing: 2 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginTop: 20,
  },
  streakText: { color: '#fb923c', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  bottomArea: { position: 'absolute', bottom: 48, left: 24, right: 24, alignItems: 'center' },
  poolBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginBottom: 16,
  },
  poolDot: { color: '#fbbf24', fontSize: 8 },
  poolText: { color: '#fbbf24', fontSize: 11, letterSpacing: 1, opacity: 0.8 },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 48, paddingVertical: 20, borderRadius: 50,
  },
  startIcon: { color: '#060d12', fontSize: 20 },
  startText: { color: '#060d12', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  hint: { fontSize: 11, marginTop: 14, textAlign: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
    borderTopWidth: 1, maxHeight: height * 0.92,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  sheetLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 12 },
  taskInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 24 },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  durationBtn: { width: '30%', padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  durationNum: { fontSize: 22, fontWeight: '300' },
  durationSub: { fontSize: 10, marginTop: 2 },
  stakeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 28 },
  stakeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  stakeBtnText: { fontSize: 14 },
  beginBtn: { borderRadius: 16 },
  beginBtnInner: { padding: 18, alignItems: 'center' },
  beginBtnText: { color: '#060d12', fontSize: 15, fontWeight: '700' },
  stakingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  // Token toggle
  tokenToggleWrap: {
    flexDirection: 'row', borderWidth: 1, borderRadius: 14,
    padding: 2, marginBottom: 12, position: 'relative', overflow: 'hidden',
  },
  togglePill: {
    position: 'absolute', top: 2, bottom: 2,
    width: '48%', borderRadius: 11, borderWidth: 1.5,
  },
  tokenTab: {
    flex: 1, paddingVertical: 11, alignItems: 'center', zIndex: 1,
  },
  tokenTabText: { fontSize: 14, letterSpacing: 0.5 },
  tokenTabActive: { fontWeight: '700' },
  // SKR context chip
  skrChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 4,
  },
  skrChipIcon: { fontSize: 12 },
  skrChipText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', flex: 1 },
  // Connect step
  connectStep: { alignItems: 'center', paddingVertical: 8, paddingBottom: 16 },
  connectEmoji: { fontSize: 44, marginBottom: 16 },
  connectSub: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 28, paddingHorizontal: 8 },
  cancelBtn: { marginTop: 16, padding: 12 },
  cancelText: { fontSize: 14 },
  // Coming soon
  comingSoonBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2,
    marginLeft: 4,
  },
  comingSoonText: {
    color: '#f59e0b', fontSize: 8, fontWeight: '800', letterSpacing: 0.8,
  },
  skrComingSoonBtn: {
    borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 16, padding: 20, alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderStyle: 'dashed',
  },
  skrComingSoonTitle: {
    color: '#f59e0b', fontSize: 15, fontWeight: '700', marginBottom: 8,
  },
  skrComingSoonSub: {
    color: 'rgba(245,158,11,0.6)', fontSize: 12, textAlign: 'center', lineHeight: 18,
  },
  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 20,
  },
  errorIcon: { fontSize: 15 },
  errorText: { flex: 1, color: '#f87171', fontSize: 13, lineHeight: 20 },
});