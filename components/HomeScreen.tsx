import {
    transact,
    Web3MobileWallet,
  } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
 
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
    onStart: (duration: number, stakeAmount: number) => void;
  }

export default function HomeScreen({ onStart }: Props) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [duration, setDuration] = useState(25);
  const [stakeAmount, setStakeAmount] = useState(0.01);

  const handleConnect = async () => {
    try {
      const authResult = await transact(async (wallet: Web3MobileWallet) => {
        const authorizationResult = await wallet.authorize({
          cluster: 'devnet',
          identity: {
            name: 'Focus',
            uri: 'https://focus-app-orpin.vercel.app',
            icon: '/favicon.ico',
          },
        });
        return authorizationResult;
      });
      setWalletAddress(authResult.accounts[0].address);
    } catch (err: any) {
      console.log('Wallet connection cancelled:', err.message);
    }
  };

  const DURATIONS = [
    { mins: 1, label: '1', sub: 'Quick Start' },
    { mins: 3, label: '3', sub: 'Quick Reset' },
    { mins: 5, label: '5', sub: 'Micro Focus' },
    { mins: 15, label: '15', sub: 'Power Block' },
    { mins: 25, label: '25', sub: 'Pomodoro' },
    { mins: 50, label: '50', sub: 'Deep Work' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.label}>READY TO FOCUS</Text>
        <Text style={styles.title}>Begin your session</Text>
        <Text style={styles.subtitle}>Stake SOL. Focus. Earn it back.</Text>
      </View>

      {/* Wallet */}
      {!walletAddress ? (
        <TouchableOpacity style={styles.walletButton} onPress={handleConnect}>
          <Text style={styles.walletButtonText}>Connect Phantom Wallet</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.walletConnected}>
          <Text style={styles.walletAddress}>
            {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
          </Text>
        </View>
      )}

      {/* Duration */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>SESSION DURATION</Text>
        <View style={styles.durationGrid}>
          {DURATIONS.map(d => (
            <TouchableOpacity
              key={d.mins}
              onPress={() => setDuration(d.mins)}
              style={[
                styles.durationButton,
                duration === d.mins && styles.durationButtonActive,
              ]}
            >
              <Text style={[
                styles.durationLabel,
                duration === d.mins && styles.durationLabelActive,
              ]}>{d.label}</Text>
              <Text style={styles.durationSub}>{d.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stake */}
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>STAKE AMOUNT</Text>
          <Text style={styles.stakeValue}>{stakeAmount} SOL</Text>
        </View>
        <View style={styles.stakeButtons}>
          {[0.01, 0.05, 0.1, 0.25, 0.5].map(amount => (
            <TouchableOpacity
              key={amount}
              onPress={() => setStakeAmount(amount)}
              style={[
                styles.stakeButton,
                stakeAmount === amount && styles.stakeButtonActive,
              ]}
            >
              <Text style={[
                styles.stakeButtonText,
                stakeAmount === amount && styles.stakeButtonTextActive,
              ]}>{amount}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Start Button */}
      <LinearGradient
        colors={['#2a7a5e', '#4dd9ac']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.startButton}
      >
        <TouchableOpacity onPress={() => onStart(duration, stakeAmount)} style={styles.startButtonInner}>
  <Text style={styles.startButtonText}>Begin Focus Session</Text>
</TouchableOpacity>
      </LinearGradient>

      <Text style={styles.disclaimer}>
        1 min minimum · Complete → full refund · Abandon → lose 20%
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12' },
  content: { padding: 24, paddingTop: 60 },
  hero: { marginBottom: 32 },
  label: { color: '#2a7a5e', fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  title: { color: '#f0faf6', fontSize: 36, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#2a7a5e', fontSize: 14 },
  walletButton: {
    borderWidth: 1, borderColor: '#2a7a5e', borderRadius: 12,
    padding: 16, alignItems: 'center', marginBottom: 24,
  },
  walletButtonText: { color: '#4dd9ac', fontSize: 14, fontWeight: '600' },
  walletConnected: {
    borderWidth: 1, borderColor: '#2a7a5e', borderRadius: 12,
    padding: 12, alignItems: 'center', marginBottom: 24,
    backgroundColor: 'rgba(77,217,172,0.05)',
  },
  walletAddress: { color: '#4dd9ac', fontSize: 12 },
  card: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 20, marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: '#2a7a5e', fontSize: 11, letterSpacing: 2, marginBottom: 16 },
  durationGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  durationButton: {
    width: '30%', padding: 16, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  durationButtonActive: {
    borderColor: '#4dd9ac', backgroundColor: 'rgba(77,217,172,0.1)',
  },
  durationLabel: { color: '#2a7a5e', fontSize: 24, fontWeight: '300' },
  durationLabelActive: { color: '#4dd9ac' },
  durationSub: { color: '#2a7a5e', fontSize: 10, marginTop: 2 },
  stakeValue: { color: '#4dd9ac', fontSize: 16, fontWeight: '600' },
  stakeButtons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  stakeButton: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  stakeButtonActive: { borderColor: '#4dd9ac', backgroundColor: 'rgba(77,217,172,0.1)' },
  stakeButtonText: { color: '#2a7a5e', fontSize: 14 },
  stakeButtonTextActive: { color: '#4dd9ac' },
  startButton: { borderRadius: 16, marginTop: 8 },
  startButtonInner: { padding: 20, alignItems: 'center' },
  startButtonText: { color: '#060d12', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  disclaimer: { color: '#1a4a35', fontSize: 11, textAlign: 'center', marginTop: 16 },
});