import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Switch, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';

const TWEET_TEXT = encodeURIComponent(
  `🧠 Just discovered Focus — the app that makes you stake SOL to stay focused.\n\nComplete your session → full refund.\nAbandon early → lose 20%.\n\nBuilt on @Solana ⚡\n\nhttps://focus-app-orpin.vercel.app`
);

const TRACKS = [
  { index: 0,  name: 'Deep Focus',          emoji: '🧠', description: 'Beta · 14Hz' },
  { index: 1,  name: 'Flow State',           emoji: '🌊', description: 'Alpha · 10Hz' },
  { index: 2,  name: 'Deep Work',            emoji: '⚡', description: 'Gamma · 40Hz' },
  { index: 3,  name: 'Calm Focus',           emoji: '🧘', description: 'Theta · 6Hz' },
  { index: 4,  name: 'Memory',               emoji: '💡', description: 'Beta · 12Hz' },
  { index: 5,  name: 'Meditation',           emoji: '☯️', description: 'Delta · 4Hz' },
  { index: 6,  name: 'Energy Boost',         emoji: '🚀', description: 'Beta · 20Hz' },
  { index: 7,  name: 'Sleep Prep',           emoji: '🌙', description: 'Delta · 2Hz' },
  { index: 8,  name: 'Dusty Jazz',           emoji: '🎷', description: 'Jazz · 90s' },
  { index: 9,  name: 'Mellow Drift',         emoji: '🌿', description: 'Ambient' },
  { index: 10, name: 'Deep Long Study',      emoji: '📚', description: 'Deep' },
  { index: 11, name: 'Spacious Motifs',      emoji: '🌌', description: 'Ambient' },
  { index: 12, name: 'Quiet Focus',          emoji: '🕊️', description: 'Calm' },
  { index: 13, name: 'Deep Focus Piano',     emoji: '🖤', description: 'Piano' },
  { index: 14, name: 'Mind Memory',          emoji: '🔮', description: 'Ambient' },
  { index: 15, name: 'Gentle Concentration', emoji: '🌸', description: 'Meditation' },
  { index: 16, name: 'Moments Peaceful',     emoji: '☁️', description: 'Ambient' },
  { index: 17, name: 'Glass Shore',          emoji: '🌅', description: 'Ambient' },
  { index: 18, name: 'Midnight Sleep',       emoji: '🌃', description: 'Sleep' },
];

interface Props {
  onShowInfo: () => void;
}

export default function SettingsScreen({ onShowInfo }: Props) {
  const { theme, colors, toggleTheme } = useTheme();
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
      const settings = { displayName, defaultTrack, sessionReminders, ...overrides };
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
        { text: 'Clear', style: 'destructive', onPress: async () => {
          await AsyncStorage.removeItem('focus_history');
          Alert.alert('Done', 'Session history cleared.');
        }},
      ]
    );
  };

  const selectedTrack = TRACKS[defaultTrack] || TRACKS[0];
  const c = colors;

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.pageLabel, { color: c.textSub }]}>SETTINGS</Text>
      <Text style={[styles.pageTitle, { color: c.text }]}>Preferences</Text>

      {/* Profile */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textSub }]}>PROFILE</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <Text style={[styles.fieldLabel, { color: c.textSub }]}>Display Name</Text>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={[styles.nameInput, { color: c.text, borderBottomColor: c.accent }]}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Enter your name..."
                placeholderTextColor={c.textMuted}
                autoFocus
                maxLength={30}
                returnKeyType="done"
                onSubmitEditing={() => { setEditingName(false); saveSettings(); }}
              />
              <TouchableOpacity
                style={[styles.saveNameBtn, { backgroundColor: `${c.accent}22`, borderColor: c.accent }]}
                onPress={() => { setEditingName(false); saveSettings(); }}
              >
                <Text style={[styles.saveNameBtnText, { color: c.accent }]}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => setEditingName(true)}>
              <Text style={[styles.nameValue, { color: c.text }]}>{displayName || 'Tap to set name...'}</Text>
              <Text style={[styles.editHint, { color: c.textSub }]}>✎</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Default Track */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textSub }]}>DEFAULT FOCUS TRACK</Text>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}
          onPress={() => setTrackExpanded(!trackExpanded)}
        >
          <View style={styles.trackRow}>
            <Text style={styles.trackEmoji}>{selectedTrack.emoji}</Text>
            <View style={styles.trackInfo}>
              <Text style={[styles.trackName, { color: c.text }]}>{selectedTrack.name}</Text>
              <Text style={[styles.trackDesc, { color: c.textSub }]}>{selectedTrack.description}</Text>
            </View>
            <Text style={[styles.chevron, { color: c.textSub }]}>{trackExpanded ? '▲' : '▼'}</Text>
          </View>
        </TouchableOpacity>
        {trackExpanded && (
          <View style={[styles.trackList, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
            {TRACKS.map(track => (
              <TouchableOpacity
                key={track.index}
                style={[styles.trackOption, { borderBottomColor: c.cardBorder }, defaultTrack === track.index && { backgroundColor: `${c.accent}15` }]}
                onPress={() => { setDefaultTrack(track.index); setTrackExpanded(false); saveSettings({ defaultTrack: track.index }); }}
              >
                <Text style={styles.trackOptionEmoji}>{track.emoji}</Text>
                <Text style={[styles.trackOptionName, { color: c.textMuted }, defaultTrack === track.index && { color: c.accent }]}>
                  {track.name}
                </Text>
                {defaultTrack === track.index && <Text style={[styles.checkmark, { color: c.accent }]}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textSub }]}>NOTIFICATIONS</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: c.text }]}>Session Reminders</Text>
              <Text style={[styles.switchDesc, { color: c.textSub }]}>Remind me to focus daily</Text>
            </View>
            <Switch
              value={sessionReminders}
              onValueChange={(val) => { setSessionReminders(val); saveSettings({ sessionReminders: val }); }}
              trackColor={{ false: 'rgba(128,128,128,0.2)', true: `${c.accent}66` }}
              thumbColor={sessionReminders ? c.accent : '#888'}
            />
          </View>
        </View>
      </View>

      {/* Appearance */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textSub }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: c.text }]}>
                {theme === 'dark' ? '🌙 Dark Theme' : '☀️ Light Theme'}
              </Text>
              <Text style={[styles.switchDesc, { color: c.textSub }]}>
                {theme === 'dark' ? 'Easy on the eyes at night' : 'Clean and bright'}
              </Text>
            </View>
            <Switch
              value={theme === 'light'}
              onValueChange={toggleTheme}
              trackColor={{ false: 'rgba(128,128,128,0.2)', true: `${c.accent}66` }}
              thumbColor={theme === 'light' ? c.accent : '#888'}
            />
          </View>
        </View>
      </View>

      {/* Help */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textSub }]}>HELP</Text>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder, marginBottom: 10 }]}
          onPress={onShowInfo}
        >
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: c.text }]}>ℹ  How Focus Works</Text>
              <Text style={[styles.switchDesc, { color: c.textSub }]}>Replay the onboarding guide</Text>
            </View>
            <Text style={[styles.chevron, { color: c.textSub }]}>›</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}
          onPress={() => Linking.openURL(`https://twitter.com/intent/tweet?text=${TWEET_TEXT}`)}
        >
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={[styles.switchLabel, { color: c.text }]}>𝕏  Share on X</Text>
              <Text style={[styles.switchDesc, { color: c.textSub }]}>Tell your friends about Focus</Text>
            </View>
            <Text style={[styles.chevron, { color: 'rgb(29,161,242)' }]}>›</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Data */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textSub }]}>DATA</Text>
        <TouchableOpacity style={styles.dangerCard} onPress={handleClearHistory}>
          <Text style={styles.dangerText}>🗑 Clear Session History</Text>
          <Text style={styles.dangerDesc}>Permanently delete all past sessions</Text>
        </TouchableOpacity>
      </View>

      {saved && (
        <View style={[styles.savedToast, { backgroundColor: `${c.accent}22`, borderColor: c.accent }]}>
          <Text style={[styles.savedToastText, { color: c.accent }]}>✓ Settings saved</Text>
        </View>
      )}

      <Text style={[styles.version, { color: c.textMuted }]}>Focus v1.1.0 · Built on Solana Devnet</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 60 },
  pageLabel: { fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 32 },
  section: { marginBottom: 28 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18 },
  fieldLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 10 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  nameValue: { fontSize: 16 },
  editHint: { fontSize: 18 },
  nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameInput: { flex: 1, fontSize: 16, borderBottomWidth: 1, paddingVertical: 4 },
  saveNameBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  saveNameBtnText: { fontSize: 13, fontWeight: '600' },
  trackRow: { flexDirection: 'row', alignItems: 'center' },
  trackEmoji: { fontSize: 22, marginRight: 12 },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 15, fontWeight: '500' },
  trackDesc: { fontSize: 11, marginTop: 2 },
  chevron: { fontSize: 12 },
  trackList: { borderWidth: 1, borderRadius: 16, marginTop: 8, overflow: 'hidden' },
  trackOption: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1 },
  trackOptionEmoji: { fontSize: 18, marginRight: 12, width: 28 },
  trackOptionName: { flex: 1, fontSize: 14 },
  checkmark: { fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchInfo: { flex: 1 },
  switchLabel: { fontSize: 15, fontWeight: '500' },
  switchDesc: { fontSize: 11, marginTop: 3 },
  dangerCard: {
    borderWidth: 1, borderColor: 'rgba(248,113,113,0.2)',
    borderRadius: 16, padding: 18, backgroundColor: 'rgba(248,113,113,0.04)',
  },
  dangerText: { color: '#f87171', fontSize: 15, fontWeight: '500' },
  dangerDesc: { color: 'rgba(248,113,113,0.5)', fontSize: 11, marginTop: 4 },
  savedToast: {
    position: 'absolute', bottom: 80, alignSelf: 'center',
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  savedToastText: { fontSize: 13, fontWeight: '600' },
  version: { fontSize: 11, textAlign: 'center', marginTop: 16 },
});