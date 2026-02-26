import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  initializeVault,
  startSession,
  completeSession,
  abandonSession,
  fetchVaultState,
} from '../mobileVaultClient';

interface Props {
  duration: number;
  stakeAmount: number;
  publicKey: PublicKey;
  connection: Connection;
  onComplete: (sig: string, reward: number) => void;
  onAbandon: (sig: string) => void;
}

export default function ActiveScreen({
  duration, stakeAmount, publicKey, connection, onComplete, onAbandon
}: Props) {
  const [timeLeft, setTimeLeft] = useState(duration * 60);
  const [loading, setLoading] = useState(true);
  const [sessionStarted, setSessionStarted] = useState(false);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const progress = ((duration * 60 - timeLeft) / (duration * 60)) * 100;

  useEffect(() => {
    handleStart();
  }, []);

  useEffect(() => {
    if (!sessionStarted) return;
    if (timeLeft <= 0) { handleComplete(); return; }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [sessionStarted, timeLeft]);

  const handleStart = async () => {
    setLoading(true);
    try {
      // Try to initialize vault, ignore error if already exists
      try {
        const vaultState = await fetchVaultState(connection, publicKey);
        if (!vaultState) {
          await initializeVault(connection, publicKey);
        }
      } catch (initErr: any) {
        console.log('Vault init skipped:', initErr.message);
      }
      // Start session
      await startSession(connection, publicKey, stakeAmount, duration * 60);
      setSessionStarted(true);
    } catch (err: any) {
      console.log('Start error:', err.message);
      Alert.alert('Error', `Failed to start: ${err.message}`, [
        { text: 'Go Back', onPress: () => onAbandon('cancelled') }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      const sig = await completeSession(connection, publicKey);
      const vaultState = await fetchVaultState(connection, publicKey);
      const reward = vaultState
        ? ((vaultState as any).totalEarnedFromPool?.toNumber() ?? 0) / 1e9
        : 0;
      onComplete(sig, reward);
    } catch (err: any) {
      Alert.alert('Error', `Failed to complete: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAbandon = async () => {
    Alert.alert(
      'Abandon Session?',
      `You will forfeit ${(stakeAmount * 0.2).toFixed(3)} SOL`,
      [
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
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>SESSION ACTIVE</Text>
      <Text style={styles.locked}>🔒 {stakeAmount} SOL committed to vault</Text>

      {loading && (
        <Text style={styles.loading}>
          {!sessionStarted ? '⏳ Starting session...' : '⏳ Processing...'}
        </Text>
      )}

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

      <TouchableOpacity
        onPress={handleAbandon}
        disabled={loading || !sessionStarted}
        style={[styles.abandonButton, (loading || !sessionStarted) && styles.abandonButtonDisabled]}
      >
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
  locked: { color: '#1a4a35', fontSize: 13, marginBottom: 24 },
  loading: { color: '#4dd9ac', fontSize: 13, marginBottom: 16 },
  timerContainer: { alignItems: 'center', marginBottom: 32 },
  timer: { color: '#f0faf6', fontSize: 72, fontWeight: '200', letterSpacing: -2 },
  timerRed: { color: '#f87171' },
  timerSub: { color: '#2a7a5e', fontSize: 13, marginTop: 8 },
  progressBar: {
    width: '100%', height: 2, backgroundColor: 'rgba(77,217,172,0.1)',
    borderRadius: 1, marginBottom: 48,
  },
  progressFill: { height: '100%', backgroundColor: '#4dd9ac', borderRadius: 1 },
  quote: {
    color: '#1a4a35', fontSize: 13, textAlign: 'center',
    fontStyle: 'italic', marginBottom: 48, lineHeight: 20,
  },
  abandonButton: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 16, width: '100%', alignItems: 'center',
  },
  abandonButtonDisabled: { opacity: 0.4 },
  abandonText: { color: '#374151', fontSize: 14 },
});