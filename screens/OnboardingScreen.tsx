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
    body: 'Focus uses Solana blockchain to hold you accountable. Stake real SOL before every session — complete it and get it all back. Simple. Powerful.',
    accent: '#4dd9ac',
  },
  {
    emoji: '💎',
    title: 'Stake to Focus',
    subtitle: 'Skin in the game changes everything.',
    body: 'Before each session you choose a duration and stake amount. Your SOL is locked in a secure on-chain vault. Finish the session — every lamport comes back to you.',
    accent: '#4dd9ac',
  },
  {
    emoji: '🎯',
    title: 'Complete or Abandon',
    subtitle: 'The choice is yours. So are the consequences.',
    body: 'Complete your session → full refund + a share of the penalty pool from others who gave up.\n\nAbandon early → 20% of your stake goes to the pool. The rest is returned.',
    accent: '#f59e0b',
  },
  {
    emoji: '🎧',
    title: 'Sound for Deep Focus',
    subtitle: 'Science-backed audio to keep you in the zone.',
    body: 'Choose from 8 binaural beat tracks tuned to different brain states — Beta for concentration, Alpha for flow, Theta for calm focus. Or pick from our ambient piano library.',
    accent: '#a78bfa',
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
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentIndex(index);
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
    setCurrentIndex(index);
  };

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;
  const lightBg = theme === 'light';

  return (
    <View style={styles.container}>
      {/* Background */}
      {lightBg ? (
        <LinearGradient
          colors={['#c8ede0', '#e8f5f0', '#f0faf6']}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <AuroraBackground />
      )}

      {/* Dark overlay for readability */}
      {!lightBg && (
        <View style={styles.overlay} />
      )}

      {/* Skip button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={onDone}>
          <Text style={[styles.skipText, { color: lightBg ? c.textSub : 'rgba(77,217,172,0.6)' }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((s, i) => (
          <View key={i} style={styles.slide}>
            {/* Emoji */}
            <View style={[styles.emojiContainer, { borderColor: `${s.accent}33`, backgroundColor: `${s.accent}15` }]}>
              <Text style={styles.emoji}>{s.emoji}</Text>
            </View>

            {/* Text */}
            <Text style={[styles.title, { color: lightBg ? c.text : '#f0faf6' }]}>{s.title}</Text>
            <Text style={[styles.subtitle, { color: s.accent }]}>{s.subtitle}</Text>
            <Text style={[styles.body, { color: lightBg ? c.textSub : 'rgba(240,250,246,0.7)' }]}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom controls */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <Animated.View style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? slide.accent : (lightBg ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)'),
                  width: i === currentIndex ? 24 : 8,
                },
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Next / Get Started button */}
        <LinearGradient
          colors={isLast ? ['#2a7a5e', '#4dd9ac'] : [`${slide.accent}99`, slide.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.nextBtn}
        >
          <TouchableOpacity onPress={handleNext} style={styles.nextBtnInner}>
            <Text style={styles.nextBtnText}>
              {isLast ? '🚀  Get Started' : 'Next  →'}
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,8,20,0.45)',
  },
  skipBtn: {
    position: 'absolute', top: 52, right: 24, zIndex: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  skipText: { fontSize: 14, fontWeight: '500' },
  scrollView: { flex: 1 },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingTop: 60,
  },
  emojiContainer: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  emoji: { fontSize: 44 },
  title: {
    fontSize: 32, fontWeight: '800',
    textAlign: 'center', marginBottom: 12, letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15, textAlign: 'center',
    marginBottom: 24, fontWeight: '500', letterSpacing: 0.3,
  },
  body: {
    fontSize: 15, textAlign: 'center',
    lineHeight: 24, letterSpacing: 0.2,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 52,
    alignItems: 'center',
    gap: 24,
  },
  dots: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: { borderRadius: 50, width: '100%' },
  nextBtnInner: { padding: 20, alignItems: 'center' },
  nextBtnText: { color: '#060d12', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
});