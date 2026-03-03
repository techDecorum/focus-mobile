import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  duration: number;
  stakeAmount: number;
  poolReward: number;
  txSignature: string | null;
  taskNote: string;
  onReset: () => void;
}

export default function SuccessScreen({ duration, stakeAmount, poolReward, txSignature, taskNote, onReset }: Props) {
  const { colors } = useTheme();
  const c = colors;

  useEffect(() => { saveToHistory(); }, []);

  const saveToHistory = async () => {
    try {
      const entry = {
        id: Date.now().toString(),
        taskNote, duration, stakeAmount,
        reward: poolReward, status: 'completed',
        date: new Date().toISOString(), txSignature,
      };
      const existing = await AsyncStorage.getItem('focus_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(entry);
      await AsyncStorage.setItem('focus_history', JSON.stringify(history.slice(0, 100)));
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Text style={styles.star}>✦</Text>
      <Text style={[styles.title, { color: c.text }]}>Well done, Agent.</Text>
      <Text style={[styles.subtitle, { color: c.textSub }]}>Mission complete. Your SOL is returned.</Text>

      {taskNote ? (
        <View style={[styles.taskContainer, { backgroundColor: `${c.accent}0d`, borderColor: `${c.accent}26` }]}>
          <Text style={styles.taskEmoji}>✅</Text>
          <Text style={[styles.taskNote, { color: c.accent }]}>{taskNote}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <View style={[styles.row, { borderBottomColor: c.cardBorder }]}>
          <Text style={[styles.rowLabel, { color: c.textSub }]}>Duration</Text>
          <Text style={[styles.rowValue, { color: c.text }]}>{duration} minutes</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: c.cardBorder }]}>
          <Text style={[styles.rowLabel, { color: c.textSub }]}>SOL Returned</Text>
          <Text style={[styles.rowValue, { color: c.accent }]}>{stakeAmount} SOL</Text>
        </View>
        {poolReward > 0 && (
          <View style={[styles.row, { borderBottomColor: c.cardBorder }]}>
            <Text style={[styles.rowLabel, { color: c.textSub }]}>Pool Bonus</Text>
            <Text style={[styles.rowValue, { color: '#fbbf24' }]}>+{poolReward.toFixed(4)} SOL 🎉</Text>
          </View>
        )}
      </View>

      <LinearGradient colors={['#2a7a5e', '#4dd9ac']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.button}>
        <TouchableOpacity onPress={onReset} style={styles.buttonInner}>
          <Text style={styles.buttonText}>Begin Another Session</Text>
        </TouchableOpacity>
      </LinearGradient>

      {txSignature && (
        <TouchableOpacity onPress={() => Linking.openURL(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)}>
          <Text style={[styles.explorerLink, { color: c.textSub }]}>View transaction on Solana Explorer →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  star: { fontSize: 48, color: '#4dd9ac', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  taskContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 24, width: '100%' },
  taskEmoji: { fontSize: 16, marginRight: 8 },
  taskNote: { fontSize: 13, flex: 1 },
  card: { width: '100%', borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 32 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  button: { borderRadius: 16, width: '100%' },
  buttonInner: { padding: 20, alignItems: 'center' },
  buttonText: { color: '#060d12', fontSize: 16, fontWeight: '700' },
  explorerLink: { fontSize: 12, marginTop: 16 },
});