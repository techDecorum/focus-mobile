import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const STORAGE_KEY = 'first_session_hint_dismissed';

interface Props {
  onPress: () => void;
  triggerKey?: number; // increment this from outside to force a re-check
}

export default function FirstSessionHint({ onPress, triggerKey = 0 }: Props) {
  const { colors } = useTheme();
  const c = colors;
  const [visible, setVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  const showHint = useCallback(() => {
    setVisible(true);
    slideAnim.setValue(-80);
    Animated.spring(slideAnim, {
      toValue: 0, tension: 60, friction: 12, useNativeDriver: true,
    }).start();
    pulseLoop.current?.stop();
    pulseAnim.setValue(1);
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  }, []);

  const hideHint = useCallback(() => {
    pulseLoop.current?.stop();
    setVisible(false);
    slideAnim.setValue(-80);
  }, []);

  // Re-runs whenever triggerKey changes (Settings reset) or on first mount
  useEffect(() => {
    const check = async () => {
      try {
        const [dismissed, history] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem('focus_history'),
        ]);
        if (dismissed === 'true') {
          hideHint();
          return;
        }
        const sessions = history ? JSON.parse(history) : [];
        const hasCompleted = sessions.some((s: any) => s.status === 'completed');
        if (!hasCompleted) {
          showHint();
        } else {
          hideHint();
        }
      } catch {}
    };
    check();
  }, [triggerKey]);

  const dismiss = async () => {
    Animated.timing(slideAnim, {
      toValue: -80, duration: 250, useNativeDriver: true,
    }).start(() => {
      pulseLoop.current?.stop();
      setVisible(false);
    });
    await AsyncStorage.setItem(STORAGE_KEY, 'true');
  };

  const handlePress = () => {
    dismiss();
    onPress();
  };

  if (!visible) return null;

  return (
    <Animated.View style={[
      styles.container,
      { backgroundColor: `${c.accent}12`, borderColor: `${c.accent}44` },
      { transform: [{ translateY: slideAnim }] },
    ]}>
      <TouchableOpacity style={styles.inner} onPress={handlePress} activeOpacity={0.8}>
        <View style={[styles.dot, { backgroundColor: c.accent }]} />
        <Text style={[styles.text, { color: c.accent }]}>
          Start here — tap to begin your first session
        </Text>
        <Animated.Text style={[styles.arrow, { color: c.accent, transform: [{ scale: pulseAnim }] }]}>
          →
        </Animated.Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={dismiss} style={styles.dismissBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={[styles.dismissText, { color: `${c.accent}55` }]}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 140,
    left: 20, right: 20,
    borderWidth: 1, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    zIndex: 20,
  },
  inner: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingLeft: 16, gap: 10,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  text: { flex: 1, fontSize: 13, fontWeight: '500' },
  arrow: { fontSize: 18, fontWeight: '600', marginRight: 4 },
  dismissBtn: { paddingHorizontal: 14, paddingVertical: 14 },
  dismissText: { fontSize: 13 },
});