import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  stakeAmount: number;
  onReset: () => void;
}

export default function AbandonedScreen({ stakeAmount, onReset }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>◌</Text>
      <Text style={styles.title}>Session Ended</Text>
      <Text style={styles.subtitle}>Even Bond retreats to fight another day.</Text>

      <View style={styles.card}>
        {[
          { label: 'Penalty', value: `-${(stakeAmount * 0.2).toFixed(3)} SOL`, color: '#f87171' },
          { label: 'Returned', value: `+${(stakeAmount * 0.8).toFixed(3)} SOL`, color: '#4dd9ac' },
          { label: 'Streak', value: 'Reset to zero', color: '#2a7a5e' },
        ].map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={[styles.rowValue, { color: item.color }]}>{item.value}</Text>
          </View>
        ))}
      </View>

      <LinearGradient
        colors={['#2a7a5e', '#4dd9ac']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.button}
      >
        <TouchableOpacity onPress={onReset} style={styles.buttonInner}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#060d12',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  icon: { fontSize: 48, color: '#2a7a5e', marginBottom: 24 },
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
  rowValue: { fontSize: 14, fontWeight: '600' },
  button: { borderRadius: 16, width: '100%' },
  buttonInner: { padding: 20, alignItems: 'center' },
  buttonText: { color: '#060d12', fontSize: 16, fontWeight: '700' },
});