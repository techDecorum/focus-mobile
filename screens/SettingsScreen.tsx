import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRACKS = [
  { index: 0,  name: 'Deep Focus',    emoji: '🧠', description: 'Beta · 14Hz' },
  { index: 1,  name: 'Flow State',    emoji: '🌊', description: 'Alpha · 10Hz' },
  { index: 2,  name: 'Deep Work',     emoji: '⚡', description: 'Gamma · 40Hz' },
  { index: 3,  name: 'Calm Focus',    emoji: '🧘', description: 'Theta · 6Hz' },
  { index: 4,  name: 'Memory',        emoji: '💡', description: 'Beta · 12Hz' },
  { index: 5,  name: 'Meditation',    emoji: '☯️', description: 'Delta · 4Hz' },
  { index: 6,  name: 'Energy Boost',  emoji: '🚀', description: 'Beta · 20Hz' },
  { index: 7,  name: 'Sleep Prep',    emoji: '🌙', description: 'Delta · 2Hz' },
  { index: 8,  name: 'Dusty Jazz',    emoji: '🎷', description: 'Jazz · 90s' },
  { index: 9,  name: 'Mellow Drift',  emoji: '🌿', description: 'Ambient' },
  { index: 10, name: 'Deep Long Study', emoji: '📚', description: 'Deep' },
  { index: 11, name: 'Spacious Motifs', emoji: '🌌', description: 'Ambient' },
  { index: 12, name: 'Quiet Focus',   emoji: '🕊️', description: 'Calm' },
  { index: 13, name: 'Deep Focus Piano', emoji: '🖤', description: 'Piano' },
  { index: 14, name: 'Mind Memory',   emoji: '🔮', description: 'Ambient' },
  { index: 15, name: 'Gentle Concentration', emoji: '🌸', description: 'Meditation' },
  { index: 16, name: 'Moments Peaceful', emoji: '☁️', description: 'Ambient' },
  { index: 17, name: 'Glass Shore',   emoji: '🌅', description: 'Ambient' },
  { index: 18, name: 'Midnight Sleep', emoji: '🌃', description: 'Sleep' },
];

export default function SettingsScreen() {
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [defaultTrack, setDefaultTrack] = useState(0);
  const [sessionReminders, setSessionReminders] = useState(false);
  const [trackExpanded, setTrackExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem('focus_settings');
      if (data) {
        const s = JSON.parse(data);
        setDisplayName(s.displayName || '');
        setDefaultTrack(s.defaultTrack ?? 0);
        setSessionReminders(s.sessionReminders ?? false);
      }
    } catch {}
  };

  const saveSettings = async (overrides = {}) => {
    try {
      const settings = {
        displayName,
        defaultTrack,
        sessionReminders,
        ...overrides,
      };
      await AsyncStorage.setItem('focus_settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'This will permanently delete all your session history. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('focus_history');
            Alert.alert('Done', 'Session history cleared.');
          },
        },
      ]
    );
  };

  const selectedTrack = TRACKS[defaultTrack] || TRACKS[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageLabel}>SETTINGS</Text>
      <Text style={styles.pageTitle}>Preferences</Text>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PROFILE</Text>
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Display Name</Text>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name..."
                placeholderTextColor="#1a4a35"
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={() => { setEditingName(false); saveSettings(); }}
              />
              <TouchableOpacity
                style={styles.saveNameBtn}
                onPress={() => { setEditingName(false); saveSettings(); }}
              >
                <Text style={styles.saveNameBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => setEditingName(true)}>
              <Text style={styles.nameValue}>{displayName || 'Tap to set name...'}</Text>
              <Text style={styles.editHint}>✎</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Default Track */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DEFAULT FOCUS TRACK</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => setTrackExpanded(!trackExpanded)}
        >
          <View style={styles.trackRow}>
            <Text style={styles.trackEmoji}>{selectedTrack.emoji}</Text>
            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>{selectedTrack.name}</Text>
              <Text style={styles.trackDesc}>{selectedTrack.description}</Text>
            </View>
            <Text style={styles.chevron}>{trackExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>

        {trackExpanded && (
          <View style={styles.trackList}>
            {TRACKS.map(track => (
              <TouchableOpacity
                key={track.index}
                style={[styles.trackOption, defaultTrack === track.index && styles.trackOptionActive]}
                onPress={() => {
                  setDefaultTrack(track.index);
                  setTrackExpanded(false);
                  saveSettings({ defaultTrack: track.index });
                }}
              >
                <Text style={styles.trackOptionEmoji}>{track.emoji}</Text>
                <Text style={[styles.trackOptionName, defaultTrack === track.index && styles.trackOptionNameActive]}>
                  {track.name}
                </Text>
                {defaultTrack === track.index && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Session Reminders</Text>
              <Text style={styles.switchDesc}>Remind me to focus daily</Text>
            </View>
            <Switch
              value={sessionReminders}
              onValueChange={(val) => {
                setSessionReminders(val);
                saveSettings({ sessionReminders: val });
              }}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(77,217,172,0.4)' }}
              thumbColor={sessionReminders ? '#4dd9ac' : '#2a7a5e'}
            />
          </View>
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>DATA</Text>
        <TouchableOpacity style={styles.dangerCard} onPress={handleClearHistory}>
          <Text style={styles.dangerText}>🗑 Clear Session History</Text>
          <Text style={styles.dangerDesc}>Permanently delete all past sessions</Text>
        </TouchableOpacity>
      </View>

      {/* Saved toast */}
      {saved && (
        <View style={styles.savedToast}>
          <Text style={styles.savedToastText}>✓ Settings saved</Text>
        </View>
      )}

      <Text style={styles.version}>Focus · Built on Solana Devnet</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  pageLabel: { color: '#2a7a5e', fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { color: '#f0faf6', fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  section: { marginBottom: 28 },
  sectionLabel: { color: '#2a7a5e', fontSize: 10, letterSpacing: 3, marginBottom: 10 },
  card: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, padding: 18,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  fieldLabel: { color: '#2a7a5e', fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameValue: { color: '#f0faf6', fontSize: 16 },
  editHint: { color: '#2a7a5e', fontSize: 18 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameInput: {
    flex: 1, color: '#f0faf6', fontSize: 16,
    borderBottomWidth: 1, borderBottomColor: '#4dd9ac',
    paddingVertical: 4,
  },
  saveNameBtn: {
    backgroundColor: 'rgba(77,217,172,0.15)',
    borderWidth: 1, borderColor: '#4dd9ac',
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
  },
  saveNameBtnText: { color: '#4dd9ac', fontSize: 13, fontWeight: '600' },
  trackRow: { flexDirection: 'row', alignItems: 'center' },
  trackEmoji: { fontSize: 22, marginRight: 12 },
  trackInfo: { flex: 1 },
  trackName: { color: '#f0faf6', fontSize: 15, fontWeight: '500' },
  trackDesc: { color: '#2a7a5e', fontSize: 11, marginTop: 2 },
  chevron: { color: '#2a7a5e', fontSize: 12 },
  trackList: {
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, marginTop: 8, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  trackOption: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  trackOptionActive: { backgroundColor: 'rgba(77,217,172,0.08)' },
  trackOptionEmoji: { fontSize: 18, marginRight: 12, width: 28 },
  trackOptionName: { flex: 1, color: '#6b7280', fontSize: 14 },
  trackOptionNameActive: { color: '#4dd9ac' },
  checkmark: { color: '#4dd9ac', fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchInfo: { flex: 1 },
  switchLabel: { color: '#f0faf6', fontSize: 15, fontWeight: '500' },
  switchDesc: { color: '#2a7a5e', fontSize: 11, marginTop: 3 },
  dangerCard: {
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 16, padding: 18,
    backgroundColor: 'rgba(248,113,113,0.04)',
  },
  dangerText: { color: '#f87171', fontSize: 15, fontWeight: '500' },
  dangerDesc: { color: 'rgba(248,113,113,0.5)', fontSize: 11, marginTop: 4 },
  savedToast: {
    position: 'absolute', bottom: 80, alignSelf: 'center',
    backgroundColor: 'rgba(77,217,172,0.15)',
    borderWidth: 1, borderColor: '#4dd9ac',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  savedToastText: { color: '#4dd9ac', fontSize: 13, fontWeight: '600' },
  version: { color: '#1a4a35', fontSize: 11, textAlign: 'center', marginTop: 16 },
});