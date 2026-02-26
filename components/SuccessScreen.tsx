import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  duration: number;
  stakeAmount: number;
  poolReward: number;
  txSignature: string | null;
  onReset: () => void;
}

export default function SuccessScreen({ duration, stakeAmount, poolReward, txSignature, onReset }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.star}>✦</Text>
      <Text style={styles.title}>Well done, Agent.</Text>
      <Text style={styles.subtitle}>Mission complete. Your SOL is returned.</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Duration</Text>
          <Text style={styles.rowValue}>{duration} minutes</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>SOL Returned</Text>
          <Text style={[styles.rowValue, { color: '#4dd9ac' }]}>{stakeAmount} SOL</Text>
        </View>
        {poolReward > 0 && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Pool Bonus</Text>
            <Text style={[styles.rowValue, { color: '#fbbf24' }]}>+{poolReward.toFixed(4)} SOL 🎉</Text>
          </View>
        )}
      </View>

      <LinearGradient
        colors={['#2a7a5e', '#4dd9ac']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <TouchableOpacity onPress={onReset} style={styles.buttonInner}>
          <Text style={styles.buttonText}>Begin Another Session</Text>
        </TouchableOpacity>
      </LinearGradient>

      {txSignature && (
        <TouchableOpacity onPress={() =>
          Linking.openURL(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)
        }>
          <Text style={styles.explorerLink}>View transaction on Solana Explorer →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#060d12',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  star: { fontSize: 48, color: '#4dd9ac', marginBottom: 24 },
  title: { color: '#f0faf6', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#2a7a5e', fontSize: 14, marginBottom: 32 },
  card: {
    width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 20, marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  rowLabel: { color: '#2a7a5e', fontSize: 14 },
  rowValue: { color: '#f0faf6', fontSize: 14, fontWeight: '600' },
  button: { borderRadius: 16, width: '100%' },
  buttonInner: { padding: 20, alignItems: 'center' },
  buttonText: { color: '#060d12', fontSize: 16, fontWeight: '700' },
  explorerLink: { color: '#2a7a5e', fontSize: 12, marginTop: 16 },
});