import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  stakeAmount: number;
  txSignature: string | null;
  taskNote: string;
  onReset: () => void;
}

export default function AbandonedScreen({ stakeAmount, txSignature, taskNote, onReset }: Props) {
  const { colors } = useTheme();
  const c = colors;

  useEffect(() => { saveToHistory(); }, []);

  const saveToHistory = async () => {
    try {
      const entry = {
        id: Date.now().toString(),
        taskNote, duration: 0, stakeAmount,
        reward: 0, status: 'abandoned',
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
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.title, { color: c.text }]}>Session Abandoned</Text>
      <Text style={[styles.subtitle, { color: c.textSub }]}>You forfeited 20% to the penalty pool.</Text>

      {taskNote ? (
        <View style={styles.taskContainer}>
          <Text style={styles.taskEmoji}>❌</Text>
          <Text style={styles.taskNote}>{taskNote}</Text>
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <View style={[styles.row, { borderBottomColor: c.cardBorder }]}>
          <Text style={[styles.rowLabel, { color: c.textSub }]}>Forfeited</Text>
          <Text style={[styles.rowValue, { color: '#f87171' }]}>{(stakeAmount * 0.2).toFixed(3)} SOL</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: c.cardBorder }]}>
          <Text style={[styles.rowLabel, { color: c.textSub }]}>Returned</Text>
          <Text style={[styles.rowValue, { color: c.text }]}>{(stakeAmount * 0.8).toFixed(3)} SOL</Text>
        </View>
      </View>

      <TouchableOpacity style={[styles.button, { borderColor: c.accentDark }]} onPress={onReset}>
        <Text style={[styles.buttonText, { color: c.accent }]}>Try Again</Text>
      </TouchableOpacity>

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
  icon: { fontSize: 48, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  taskContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(248,113,113,0.06)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.15)', borderRadius: 10, padding: 10, marginBottom: 24, width: '100%' },
  taskEmoji: { fontSize: 16, marginRight: 8 },
  taskNote: { color: '#f87171', fontSize: 13, flex: 1 },
  card: { width: '100%', borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 32 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 14, fontWeight: '600' },
  button: { borderWidth: 1, borderRadius: 16, width: '100%', padding: 20, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '700' },
  explorerLink: { fontSize: 12, marginTop: 16 },
});