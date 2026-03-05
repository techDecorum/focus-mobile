import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking,
  Animated, Share, Dimensions, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Props {
  duration: number;
  stakeAmount: number;
  poolReward: number;
  txSignature: string | null;
  taskNote: string;
  onReset: () => void;
}

function ConfettiParticle({ delay, x }: { delay: number; x: number }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  const colorList = ['#4dd9ac', '#fbbf24', '#f87171', '#60a5fa', '#a78bfa', '#34d399'];
  const color = colorList[Math.floor(x * colorList.length) % colorList.length];
  const shapes = ['■', '●', '▲', '◆'];
  const shape = shapes[Math.floor(delay * 10) % shapes.length];

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: height * 0.75, duration: 2400 + delay * 300, useNativeDriver: true }),
        Animated.timing(translateX, { toValue: (Math.random() - 0.5) * 130, duration: 2400 + delay * 300, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: (Math.random() > 0.5 ? 1 : -1) * 8, duration: 2400 + delay * 300, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(1600 + delay * 150),
          Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]),
      ]).start();
    }, delay * 55);
    return () => clearTimeout(timeout);
  }, []);

  const spin = rotate.interpolate({ inputRange: [-8, 8], outputRange: ['-720deg', '720deg'] });

  return (
    <Animated.Text style={{
      position: 'absolute', top: 0, left: x * width,
      color, fontSize: 9 + (delay % 3) * 4,
      opacity, transform: [{ translateY }, { translateX }, { rotate: spin }, { scale }],
    }}>
      {shape}
    </Animated.Text>
  );
}

export default function SuccessScreen({ duration, stakeAmount, poolReward, txSignature, taskNote, onReset }: Props) {
  const { colors } = useTheme();
  const c = colors;

  const starScale = useRef(new Animated.Value(0)).current;
  const starOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(40)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const btnY = useRef(new Animated.Value(30)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [confetti] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({ id: i, delay: i * 0.7, x: Math.random() }))
  );

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(starScale, { toValue: 1, tension: 100, friction: 6, useNativeDriver: true }),
        Animated.timing(starOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(titleY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(cardY, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(btnY, { toValue: 0, tension: 70, friction: 12, useNativeDriver: true }),
        Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleShare = async () => {
    const lines = [
      '✦ Mission complete.',
      '',
      taskNote ? `🎯 "${taskNote}"` : null,
      `⏱ ${duration} minutes of deep focus`,
      `💎 ${stakeAmount} SOL staked & returned`,
      poolReward > 0 ? `🏆 +${poolReward.toFixed(4)} SOL earned from penalty pool` : null,
      '',
      'Stake SOL to stay focused. Built on @Solana ⚡',
      'https://focus-app-orpin.vercel.app',
    ].filter(Boolean).join('\n');
    await Share.share({ message: lines });
  };

  const totalReturn = stakeAmount + poolReward;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {confetti.map(p => <ConfettiParticle key={p.id} delay={p.delay} x={p.x} />)}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: starOpacity, transform: [{ scale: Animated.multiply(starScale, pulseAnim) }], marginBottom: 24 }}>
          <LinearGradient colors={['#2a7a5e', '#4dd9ac']} style={styles.starCircle}>
            <Text style={styles.starEmoji}>✦</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], alignItems: 'center', marginBottom: 8 }}>
          <Text style={[styles.title, { color: c.text }]}>Mission Complete.</Text>
          <Text style={[styles.subtitle, { color: c.textSub }]}>
            {poolReward > 0 ? "You stayed the course — and earned a bonus." : "Discipline executed. Your SOL is returned."}
          </Text>
        </Animated.View>

        {taskNote ? (
          <Animated.View style={{ opacity: titleOpacity, width: '100%', marginBottom: 20 }}>
            <View style={[styles.taskContainer, { backgroundColor: `${c.accent}0d`, borderColor: `${c.accent}26` }]}>
              <Text style={styles.taskEmoji}>🎯</Text>
              <Text style={[styles.taskNote, { color: c.accent }]}>{taskNote}</Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardY }], width: '100%', marginBottom: 16 }}>
          <LinearGradient colors={['#0d2b1f', '#0a1f17']} style={styles.card}>
            <LinearGradient colors={['#2a7a5e', '#4dd9ac']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cardBar} />
            <View style={styles.cardBody}>
              <View style={styles.returnRow}>
                <View>
                  <Text style={styles.returnLabel}>TOTAL RETURNED</Text>
                  <Text style={styles.returnValue}>{totalReturn.toFixed(4)}</Text>
                  <Text style={styles.returnUnit}>SOL</Text>
                </View>
                {poolReward > 0 && (
                  <View style={styles.bonusBadge}>
                    <Text style={styles.bonusText}>+{poolReward.toFixed(4)}</Text>
                    <Text style={styles.bonusLabel}>pool bonus</Text>
                  </View>
                )}
              </View>
              <View style={styles.divider} />
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{duration}</Text>
                  <Text style={styles.statLabel}>minutes</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stakeAmount}</Text>
                  <Text style={styles.statLabel}>SOL staked</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: '#4dd9ac' }]}>100%</Text>
                  <Text style={styles.statLabel}>returned</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={{ opacity: btnOpacity, transform: [{ translateY: btnY }], width: '100%', gap: 12 }}>
          <TouchableOpacity onPress={handleShare} style={[styles.shareBtn, { borderColor: `${c.accent}44`, backgroundColor: `${c.accent}0f` }]}>
            <Text style={[styles.shareBtnText, { color: c.accent }]}>↗  Share this session</Text>
          </TouchableOpacity>

          <LinearGradient colors={['#2a7a5e', '#4dd9ac']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.mainBtn}>
            <TouchableOpacity onPress={onReset} style={styles.mainBtnInner}>
              <Text style={styles.mainBtnText}>Begin Another Session</Text>
            </TouchableOpacity>
          </LinearGradient>

          {txSignature && (
            <TouchableOpacity onPress={() => Linking.openURL(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)} style={styles.explorerBtn}>
              <Text style={[styles.explorerText, { color: c.textMuted }]}>View on Solana Explorer →</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60, paddingBottom: 48 },
  starCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  starEmoji: { fontSize: 40, color: '#060d12' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  taskContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 14 },
  taskEmoji: { fontSize: 16, marginRight: 10 },
  taskNote: { fontSize: 14, flex: 1, fontStyle: 'italic' },
  card: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(77,217,172,0.12)' },
  cardBar: { height: 2 },
  cardBody: { padding: 24 },
  returnRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 },
  returnLabel: { color: 'rgba(77,217,172,0.5)', fontSize: 9, letterSpacing: 2, marginBottom: 4 },
  returnValue: { color: '#f0faf6', fontSize: 44, fontWeight: '200', letterSpacing: -1 },
  returnUnit: { color: 'rgba(77,217,172,0.6)', fontSize: 14, marginTop: 2 },
  bonusBadge: { backgroundColor: 'rgba(251,191,36,0.1)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.25)', borderRadius: 12, padding: 12, alignItems: 'flex-end' },
  bonusText: { color: '#fbbf24', fontSize: 16, fontWeight: '600' },
  bonusLabel: { color: 'rgba(251,191,36,0.6)', fontSize: 10, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(77,217,172,0.08)', marginBottom: 20 },
  statsRow: { flexDirection: 'row' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#f0faf6', fontSize: 18, fontWeight: '500' },
  statLabel: { color: 'rgba(77,217,172,0.4)', fontSize: 10, letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: 'rgba(77,217,172,0.08)' },
  shareBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  shareBtnText: { fontSize: 15, fontWeight: '600' },
  mainBtn: { borderRadius: 16 },
  mainBtnInner: { padding: 18, alignItems: 'center' },
  mainBtnText: { color: '#060d12', fontSize: 16, fontWeight: '700' },
  explorerBtn: { alignItems: 'center', paddingVertical: 8 },
  explorerText: { fontSize: 12 },
});