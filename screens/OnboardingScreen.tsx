import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  ScrollView, NativeSyntheticEvent, NativeScrollEvent, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuroraBackground from '../components/AuroraBackground';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '⚡',
    title: 'Welcome to Focus',
    subtitle: 'The app that puts your money where your attention is.',
    body: 'Focus uses the Solana blockchain to hold you accountable. Stake real SOL before every session — complete it and get it all back.',
    accent: '#4dd9ac',
    highlight: null,
  },
  {
    emoji: '💎',
    title: 'Stake. Focus. Earn.',
    subtitle: 'Skin in the game changes everything.',
    body: 'Lock SOL in a secure on-chain vault before each session. Finish the session and every lamport comes back. Others who quit? Their penalty goes into a shared pool — completers split it.',
    accent: '#4dd9ac',
    highlight: { label: 'COMPLETE SESSION', value: '+0.0041 SOL bonus earned' },
  },
  {
    emoji: '🎧',
    title: '19 Focus Tracks',
    subtitle: 'Science-backed audio, always playing.',
    body: 'Pick from 8 binaural beat frequencies tuned to different brain states, or 11 ambient piano and jazz tracks. Start playing from the Library — music follows you across every screen.',
    accent: '#a78bfa',
    highlight: { label: 'NOW PLAYING', value: '🧠 Deep Focus · Beta · 14Hz' },
  },
  {
    emoji: '🔥',
    title: 'Build Your Streak',
    subtitle: 'Consistency compounds.',
    body: 'Every completed session extends your daily streak. Hit 7 days and earn a Streak Shield — a free pass that protects your streak on days you miss. Check the leaderboard to see where you rank.',
    accent: '#fb923c',
    highlight: { label: 'YOUR STREAK', value: '🔥 7 days  ·  🛡 Shield earned' },
  },
  {
    emoji: '🚀',
    title: 'You\'re Ready.',
    subtitle: 'One session changes the habit.',
    body: 'Connect your Phantom wallet, set your task, choose a duration, and stake. The timer starts — your SOL is on the line. Finish what you started.',
    accent: '#4dd9ac',
    highlight: null,
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingScreen({ onDone }: Props) {
  const { theme, colors } = useTheme();
  const c = colors;
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Per-slide entrance animations
  const slideAnims = useRef(
    SLIDES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(20),
    }))
  ).current;

  const animateSlideIn = (index: number) => {
    const anim = slideAnims[index];
    anim.opacity.setValue(0);
    anim.translateY.setValue(24);
    Animated.parallel([
      Animated.timing(anim.opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(anim.translateY, { toValue: 0, tension: 70, friction: 11, useNativeDriver: true }),
    ]).start();
  };

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
    animateSlideIn(index);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      goToSlide(currentIndex + 1);
    } else {
      onDone();
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      animateSlideIn(index);
    }
  };

  // Kick off first slide animation on mount
  React.useEffect(() => { animateSlideIn(0); }, []);

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;
  const lightBg = theme === 'light';

  return (
    <View style={styles.container}>
      {lightBg ? (
        <LinearGradient colors={['#c8ede0', '#e8f5f0', '#f0faf6']} style={StyleSheet.absoluteFill} />
      ) : (
        <AuroraBackground />
      )}
      {!lightBg && <View style={styles.overlay} />}

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
          <Text style={[styles.skipText, { color: lightBg ? c.textSub : 'rgba(77,217,172,0.5)' }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      {/* Slide counter */}
      <Text style={[styles.counter, { color: lightBg ? c.textMuted : 'rgba(77,217,172,0.35)' }]}>
        {currentIndex + 1} / {SLIDES.length}
      </Text>

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        scrollEnabled
      >
        {SLIDES.map((s, i) => {
          const anim = slideAnims[i];
          return (
            <View key={i} style={styles.slide}>
              <Animated.View style={[
                styles.slideInner,
                { opacity: anim.opacity, transform: [{ translateY: anim.translateY }] },
              ]}>
                {/* Emoji bubble */}
                <LinearGradient
                  colors={[`${s.accent}22`, `${s.accent}08`]}
                  style={[styles.emojiContainer, { borderColor: `${s.accent}33` }]}
                >
                  <Text style={styles.emoji}>{s.emoji}</Text>
                </LinearGradient>

                {/* Text */}
                <Text style={[styles.title, { color: lightBg ? c.text : '#f0faf6' }]}>
                  {s.title}
                </Text>
                <Text style={[styles.subtitle, { color: s.accent }]}>{s.subtitle}</Text>
                <Text style={[styles.body, { color: lightBg ? c.textSub : 'rgba(240,250,246,0.65)' }]}>
                  {s.body}
                </Text>

                {/* Feature highlight card */}
                {s.highlight && (
                  <View style={[styles.highlightCard, {
                    backgroundColor: `${s.accent}0f`,
                    borderColor: `${s.accent}2a`,
                  }]}>
                    <Text style={[styles.highlightLabel, { color: `${s.accent}88` }]}>
                      {s.highlight.label}
                    </Text>
                    <Text style={[styles.highlightValue, { color: s.accent }]}>
                      {s.highlight.value}
                    </Text>
                  </View>
                )}
              </Animated.View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Progress dots */}
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)} hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
              <View style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex
                    ? slide.accent
                    : (lightBg ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'),
                  width: i === currentIndex ? 28 : 8,
                },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started */}
        <LinearGradient
          colors={isLast ? ['#2a7a5e', '#4dd9ac'] : [`${slide.accent}bb`, slide.accent]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.nextBtn}
        >
          <TouchableOpacity onPress={handleNext} style={styles.nextBtnInner}>
            <Text style={styles.nextBtnText}>
              {isLast ? '🚀  Start Your First Session' : 'Next  →'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,8,20,0.48)' },
  skipBtn: { position: 'absolute', top: 54, right: 24, zIndex: 10, paddingHorizontal: 16, paddingVertical: 8 },
  skipText: { fontSize: 14, fontWeight: '500' },
  counter: { position: 'absolute', top: 58, left: 24, zIndex: 10, fontSize: 12, letterSpacing: 2 },
  scrollView: { flex: 1 },
  slide: { width, flex: 1, alignItems: 'center', justifyContent: 'center' },
  slideInner: { alignItems: 'center', paddingHorizontal: 36, paddingTop: 40 },
  emojiContainer: {
    width: 108, height: 108, borderRadius: 54,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  emoji: { fontSize: 48 },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 10, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 20, fontWeight: '500', letterSpacing: 0.2 },
  body: { fontSize: 15, textAlign: 'center', lineHeight: 24, letterSpacing: 0.1 },
  highlightCard: {
    marginTop: 28, borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center', width: '100%',
  },
  highlightLabel: { fontSize: 9, letterSpacing: 3, marginBottom: 6 },
  highlightValue: { fontSize: 15, fontWeight: '600' },
  bottom: { paddingHorizontal: 24, paddingBottom: 52, alignItems: 'center', gap: 24 },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { borderRadius: 50, width: '100%' },
  nextBtnInner: { padding: 20, alignItems: 'center' },
  nextBtnText: { color: '#060d12', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});