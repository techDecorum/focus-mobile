import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  stakeAmount: number;
  txSignature: string | null;
  taskNote: string;
  onReset: () => void;
}

export default function AbandonedScreen({ stakeAmount, txSignature, taskNote, onReset }: Props) {

  useEffect(() => {
    saveToHistory();
  }, []);

  const saveToHistory = async () => {
    try {
      const entry = {
        id: Date.now().toString(),
        taskNote,
        duration: 0,
        stakeAmount,
        reward: 0,
        status: 'abandoned',
        date: new Date().toISOString(),
        txSignature,
      };
      const existing = await AsyncStorage.getItem('focus_history');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(entry);
      await AsyncStorage.setItem('focus_history', JSON.stringify(history.slice(0, 100)));
    } catch (err) {
      console.log('History save failed:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Session Abandoned</Text>
      <Text style={styles.subtitle}>You forfeited 20% to the penalty pool.</Text>

      {taskNote ? (
        <View style={styles.taskContainer}>
          <Text style={styles.taskEmoji}>❌</Text>
          <Text style={styles.taskNote}>{taskNote}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Forfeited</Text>
          <Text style={[styles.rowValue, { color: '#f87171' }]}>{(stakeAmount * 0.2).toFixed(3)} SOL</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Returned</Text>
          <Text style={styles.rowValue}>{(stakeAmount * 0.8).toFixed(3)} SOL</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={onReset}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>

      {txSignature && (
        <TouchableOpacity onPress={() => Linking.openURL(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)}>
          <Text style={styles.explorerLink}>View transaction on Solana Explorer →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12', alignItems: 'center', justifyContent: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 24 },
  title: { color: '#f0faf6', fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#2a7a5e', fontSize: 14, marginBottom: 16 },
  taskContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.06)',
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.15)',
    borderRadius: 10, padding: 10, marginBottom: 24, width: '100%',
  },
  taskEmoji: { fontSize: 16, marginRight: 8 },
  taskNote: { color: '#f87171', fontSize: 13, flex: 1 },
  card: { width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginBottom: 32, backgroundColor: 'rgba(255,255,255,0.02)' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  rowLabel: { color: '#2a7a5e', fontSize: 14 },
  rowValue: { color: '#f0faf6', fontSize: 14, fontWeight: '600' },
  button: { borderWidth: 1, borderColor: '#2a7a5e', borderRadius: 16, width: '100%', padding: 20, alignItems: 'center' },
  buttonText: { color: '#4dd9ac', fontSize: 16, fontWeight: '700' },
  explorerLink: { color: '#2a7a5e', fontSize: 12, marginTop: 16 },
});