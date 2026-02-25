import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  duration: number;
  stakeAmount: number;
  onComplete: () => void;
  onAbandon: () => void;
}

export default function ActiveScreen({ duration, stakeAmount, onComplete, onAbandon }: Props) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  useEffect(() => {
    if (timeLeft <= 0) { onComplete(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SESSION ACTIVE</Text>
      <Text style={styles.locked}>🔒 {stakeAmount} SOL committed to vault</Text>

      <View style={styles.timerContainer}>
        <Text style={[styles.timer, timeLeft < 60 && styles.timerRed]}>
          {formatTime(timeLeft)}
        </Text>
        <Text style={styles.timerSub}>{duration} min session</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.quote}>
        "The successful warrior is the average person,{'\n'}with laser-like focus."
      </Text>

      <TouchableOpacity onPress={onAbandon} style={styles.abandonButton}>
        <Text style={styles.abandonText}>
          Abandon — forfeit {(stakeAmount * 0.2).toFixed(3)} SOL
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#060d12',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  label: { color: '#2a7a5e', fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  locked: { color: '#1a4a35', fontSize: 13, marginBottom: 48 },
  timerContainer: { alignItems: 'center', marginBottom: 32 },
  timer: { color: '#f0faf6', fontSize: 72, fontWeight: '200', letterSpacing: -2 },
  timerRed: { color: '#f87171' },
  timerSub: { color: '#2a7a5e', fontSize: 13, marginTop: 8 },
  progressBar: {
    width: '100%', height: 2, backgroundColor: 'rgba(77,217,172,0.1)',
    borderRadius: 1, marginBottom: 48,
  },
  progressFill: {
    height: '100%', backgroundColor: '#4dd9ac', borderRadius: 1,
  },
  quote: {
    color: '#1a4a35', fontSize: 13, textAlign: 'center',
    fontStyle: 'italic', marginBottom: 48, lineHeight: 20,
  },
  abandonButton: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 16, width: '100%', alignItems: 'center',
  },
  abandonText: { color: '#374151', fontSize: 14 },
});