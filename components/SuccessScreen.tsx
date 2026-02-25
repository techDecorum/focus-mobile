import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  duration: number;
  stakeAmount: number;
  onReset: () => void;
}

export default function SuccessScreen({ duration, stakeAmount, onReset }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.star}>✦</Text>
      <Text style={styles.title}>Well done, Agent.</Text>
      <Text style={styles.subtitle}>Mission complete. Your SOL is returned.</Text>

      <View style={styles.card}>
        {[
          { label: 'Duration', value: `${duration} minutes` },
          { label: 'SOL Returned', value: `${stakeAmount} SOL`, color: '#4dd9ac' },
        ].map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={[styles.rowValue, item.color ? { color: item.color } : {}]}>
              {item.value}
            </Text>
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
          <Text style={styles.buttonText}>Begin Another Session</Text>
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
});