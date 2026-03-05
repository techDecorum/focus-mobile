import AsyncStorage from '@react-native-async-storage/async-storage';
import { PublicKey } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Modal, Animated, Dimensions, ScrollView, KeyboardAvoidingView,
  Platform, Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuroraBackground from './AuroraBackground';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import FirstSessionHint from './FirstSessionHint';
import { fetchPoolState } from '../mobileVaultClient';

const { height } = Dimensions.get('window');
const PROGRAM_ID = new PublicKey('2bsjJXARsoLH49Svs1pRw98rr1dctYHJHov43dLvqUjg');

const TWEET_TEXT = encodeURIComponent(
  `🧠 Just discovered Focus — the app that makes you stake SOL to stay focused.\n\nComplete your session → full refund.\nAbandon early → lose 20%.\n\nBuilt on @Solana ⚡\n\nhttps://focus-app-orpin.vercel.app`
);

interface Props {
  onStart: (duration: number, stakeAmount: number, taskNote: string) => void;
  onShowInfo: () => void;
  hintTrigger?: number;
}

const DURATIONS = [
  { mins: 1,  label: '1',  sub: 'Quick Start' },
  { mins: 5,  label: '5',  sub: 'Micro Focus' },
  { mins: 15, label: '15', sub: 'Power Block' },
  { mins: 30, label: '30', sub: 'Deep Focus' },
  { mins: 60, label: '60', sub: 'Flow State' },
  { mins: 90, label: '90', sub: 'Marathon' },
];

export default function HomeScreen({ onStart, onShowInfo, hintTrigger = 0 }: Props) {
  const { theme, colors } = useTheme();
  const c = colors;
  const { connection } = useConnection();
  const { walletAddress, solBalance, publicKey, connect } = useWallet();
  const [poolBalance, setPoolBalance] = useState<number>(0);
  const [streak, setStreak] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [duration, setDuration] = useState(25);
  const [stakeAmount, setStakeAmount] = useState(0.01);
  const [taskNote, setTaskNote] = useState('');
  const slideAnim = useRef(new Animated.Value(height)).current;

  // Fetch pool balance once on mount
  useEffect(() => {
    if (!connection) return;
    fetchPoolState(connection, PROGRAM_ID)
      .then((pool: any) => {
        if (pool?.totalBalance) {
          setPoolBalance(pool.totalBalance.toNumber() / 1e9);
        }
      })
      .catch((err) => console.log('=== POOL ERROR ===', err));
  }, [connection]);

  // Load streak from history
  useEffect(() => {
    const loadStreak = async () => {
      try {
        const data = await AsyncStorage.getItem('focus_history');
        if (!data) return;
        const history = JSON.parse(data);
        const completedDates = history
          .filter((h: any) => h.status === 'completed')
          .map((h: any) => new Date(h.completedAt).toDateString());
        const uniqueDates = [...new Set(completedDates)] as string[];
        let count = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          if (uniqueDates.includes(d.toDateString())) {
            count++;
          } else {
            break;
          }
        }
        setStreak(count);
      } catch {}
    };
    loadStreak();
  }, []);

  const openSheet = () => {
    setSheetOpen(true);
    Animated.spring(slideAnim, {
      toValue: 0, tension: 65, friction: 11, useNativeDriver: true,
    }).start();
  };

  const closeSheet = () => {
    Animated.timing(slideAnim, {
      toValue: height, duration: 300, useNativeDriver: true,
    }).start(() => setSheetOpen(false));
  };

  const handleConnect = connect;

  const handleBegin = () => {
    if (!walletAddress || !publicKey) return alert('Connect your Phantom wallet first!');
    if (!taskNote.trim()) return alert('What are you focusing on?');
    closeSheet();
    setTimeout(() => onStart(duration, stakeAmount, taskNote.trim()), 350);
  };

  const lightBg = theme === 'light';

  return (
    <View style={[styles.container, { backgroundColor: lightBg ? '#e8f5f0' : '#020814' }]}>

      {/* Background */}
      {lightBg ? (
        <LinearGradient
          colors={['#c8ede0', '#e8f5f0', '#f0faf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <AuroraBackground />
      )}

      {/* Top left — ℹ and 𝕏 */}
      <View style={styles.topLeft}>
        <TouchableOpacity
          style={[styles.topIconBtn, {
            borderColor: `${c.accent}44`,
            backgroundColor: lightBg ? 'rgba(255,255,255,0.8)' : 'rgba(6,13,18,0.7)',
          }]}
          onPress={onShowInfo}
        >
          <Text style={[styles.topIconText, { color: c.accent }]}>ℹ</Text>
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

      {/* Wallet - top right */}
      <View style={styles.topBar}>
        {!walletAddress ? (
          <TouchableOpacity
            style={[styles.walletBtn, {
              borderColor: `${c.accent}55`,
              backgroundColor: lightBg ? 'rgba(255,255,255,0.8)' : 'rgba(6,13,18,0.7)',
            }]}
            onPress={handleConnect}
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

      {/* Center Content */}
      <View style={styles.center}>
        <Text style={[styles.appName, { color: lightBg ? '#0a2018' : '#f0faf6' }]}>FOCUS</Text>
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

      {/* Guided first session hint */}
      <FirstSessionHint onPress={openSheet} triggerKey={hintTrigger} />

      {/* Bottom Area */}
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
          <LinearGradient
            colors={['#2a7a5e', '#4dd9ac']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startBtn}
          >
            <Text style={styles.startIcon}>◈</Text>
            <Text style={styles.startText}>Start Focus</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={[styles.hint, { color: lightBg ? `${c.accentDark}99` : 'rgba(42,122,94,0.6)' }]}>
          Complete → full refund · Abandon → lose 20%
        </Text>
      </View>

      {/* Bottom Sheet */}
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
              <Text style={[styles.sheetTitle, { color: c.text }]}>New Session</Text>

              <Text style={[styles.sheetLabel, { color: c.textSub }]}>WHAT ARE YOU FOCUSING ON?</Text>
              <TextInput
                style={[styles.taskInput, {
                  borderColor: c.inputBorder,
                  backgroundColor: c.inputBg,
                  color: c.text,
                }]}
                placeholder="e.g. Build the login page..."
                placeholderTextColor={c.textMuted}
                value={taskNote}
                onChangeText={setTaskNote}
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
                      duration === d.mins && { borderColor: c.accent, backgroundColor: `${c.accent}15` },
                    ]}
                  >
                    <Text style={[
                      styles.durationNum,
                      { color: c.textSub },
                      duration === d.mins && { color: c.accent },
                    ]}>
                      {d.label}
                    </Text>
                    <Text style={[styles.durationSub, { color: c.textMuted }]}>{d.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sheetLabel, { color: c.textSub }]}>STAKE AMOUNT</Text>
              <View style={styles.stakeRow}>
                {[0.01, 0.05, 0.1, 0.25, 0.5].map(amount => (
                  <TouchableOpacity
                    key={amount}
                    onPress={() => setStakeAmount(amount)}
                    style={[
                      styles.stakeBtn,
                      { borderColor: c.cardBorder },
                      stakeAmount === amount && { borderColor: c.accent, backgroundColor: `${c.accent}15` },
                    ]}
                  >
                    <Text style={[
                      styles.stakeBtnText,
                      { color: c.textSub },
                      stakeAmount === amount && { color: c.accent },
                    ]}>
                      {amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <LinearGradient
                colors={['#2a7a5e', '#4dd9ac']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.beginBtn}
              >
                <TouchableOpacity onPress={handleBegin} style={styles.beginBtnInner}>
                  <Text style={styles.beginBtnText}>
                    Begin Session · {duration} min · {stakeAmount} SOL
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </ScrollView>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topLeft: {
    position: 'absolute', top: 52, left: 20, zIndex: 10,
    flexDirection: 'row', gap: 8,
  },
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
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 8,
    marginTop: 20,
  },
  streakText: { color: '#fb923c', fontSize: 13, fontWeight: '600', letterSpacing: 1 },
  bottomArea: {
    position: 'absolute', bottom: 48, left: 24, right: 24, alignItems: 'center', gap: 0,
  },
  poolBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
    marginBottom: 16,
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
    borderTopWidth: 1, maxHeight: height * 0.85,
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 24 },
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
});