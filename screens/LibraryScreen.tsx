import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Audio } from 'expo-av';

const BINAURAL_TRACKS = [
  { index: 0,  name: 'Deep Focus',    emoji: '🧠', description: 'Beta · 14Hz · Concentration',    file: require('../assets/audio/deep_focus.mp3') },
  { index: 1,  name: 'Flow State',    emoji: '🌊', description: 'Alpha · 10Hz · Creative flow',    file: require('../assets/audio/flow_state.mp3') },
  { index: 2,  name: 'Deep Work',     emoji: '⚡', description: 'Gamma · 40Hz · Peak performance', file: require('../assets/audio/deep_work.mp3') },
  { index: 3,  name: 'Calm Focus',    emoji: '🧘', description: 'Theta · 6Hz · Relaxed focus',     file: require('../assets/audio/calm_focus.mp3') },
  { index: 4,  name: 'Memory',        emoji: '💡', description: 'Beta · 12Hz · Memory retention',  file: require('../assets/audio/memory.mp3') },
  { index: 5,  name: 'Meditation',    emoji: '☯️', description: 'Delta · 4Hz · Deep meditation',   file: require('../assets/audio/meditation.mp3') },
  { index: 6,  name: 'Energy Boost',  emoji: '🚀', description: 'Beta · 20Hz · Mental energy',     file: require('../assets/audio/energy_boost.mp3') },
  { index: 7,  name: 'Sleep Prep',    emoji: '🌙', description: 'Delta · 2Hz · Wind down',         file: require('../assets/audio/sleep_prep.mp3') },
];

const PIANO_TRACKS = [
    { index: 8,  name: 'Dusty Jazz Piano',     emoji: '🎷', description: 'Jazz · 90s · Warm vibes',        file: require('../assets/audio/dusty_jazz_piano.mp3') },
    { index: 9,  name: 'Mellow Drift',         emoji: '🌿', description: 'Ambient · Relaxing study',       file: require('../assets/audio/mellow_drift.mp3') },
    { index: 10, name: 'Deep Long Study',      emoji: '📚', description: 'Deep · Long work sessions',      file: require('../assets/audio/deep_long_study.mp3') },
    { index: 11, name: 'Spacious Motifs',      emoji: '🌌', description: 'Ambient · Flow state',           file: require('../assets/audio/spacious_motifs.mp3') },
    { index: 12, name: 'Quiet Focus Motif',    emoji: '🕊️', description: 'Calm · Quiet concentration',     file: require('../assets/audio/quiet_focus_motif.mp3') },
    { index: 13, name: 'Deep Focus Piano',     emoji: '🖤', description: 'Piano · Deep focus',             file: require('../assets/audio/deep_focus_piano.mp3') },
    { index: 14, name: 'Mind Memory',          emoji: '🔮', description: 'Ambient · Memory retention',     file: require('../assets/audio/mind_memory.mp3') },
    { index: 15, name: 'Gentle Concentration', emoji: '🌸', description: 'Meditation · Gentle focus',      file: require('../assets/audio/gentle_concentration.mp3') },
    { index: 16, name: 'Moments Are Peaceful', emoji: '☁️', description: 'Ambient · Peaceful moments',     file: require('../assets/audio/moments_peaceful.mp3') },
    { index: 17, name: 'Glass Shore at Dusk',  emoji: '🌅', description: 'Ambient · Evening wind down',    file: require('../assets/audio/glass_shore.mp3') },
    { index: 18, name: 'Midnight Sleep Prep',  emoji: '🌃', description: 'Sleep · Midnight wind down',     file: require('../assets/audio/midnight_sleep_prep.mp3') },
  ];

const ALL_TRACKS = [...BINAURAL_TRACKS, ...PIANO_TRACKS];

export default function LibraryScreen() {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const handlePlay = async (track: typeof ALL_TRACKS[0]) => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (playingIndex === track.index) {
        setPlayingIndex(null);
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        track.file,
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      setPlayingIndex(track.index);
    } catch (err) {
      console.log('Playback error:', err);
    }
  };

  const handleStop = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setPlayingIndex(null);
    } catch (err) {
      console.log('Stop error:', err);
    }
  };

  const currentTrack = playingIndex !== null ? ALL_TRACKS.find(t => t.index === playingIndex) : null;

  const renderTrack = (track: typeof ALL_TRACKS[0]) => (
    <TouchableOpacity
      key={track.index}
      style={[styles.trackCard, playingIndex === track.index && styles.trackCardActive]}
      onPress={() => handlePlay(track)}
    >
      <Text style={styles.trackEmoji}>{track.emoji}</Text>
      <View style={styles.trackInfo}>
        <Text style={[styles.trackName, playingIndex === track.index && styles.trackNameActive]}>
          {track.name}
        </Text>
        <Text style={styles.trackDesc}>{track.description}</Text>
      </View>
      <View style={[styles.playBtn, playingIndex === track.index && styles.playBtnActive]}>
        <Text style={styles.playBtnText}>
          {playingIndex === track.index ? '❚❚' : '▶'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageLabel}>MUSIC LIBRARY</Text>
      <Text style={styles.pageTitle}>Focus Sounds</Text>
      <Text style={styles.pageSub}>{ALL_TRACKS.length} tracks · Binaural beats & focus music</Text>

      {/* Now Playing Bar */}
      {currentTrack && (
        <View style={styles.nowPlaying}>
          <Text style={styles.nowPlayingEmoji}>{currentTrack.emoji}</Text>
          <View style={styles.nowPlayingInfo}>
            <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
            <Text style={styles.nowPlayingName}>{currentTrack.name}</Text>
          </View>
          <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
            <Text style={styles.stopButtonText}>■ Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Binaural Beats */}
      <Text style={styles.sectionLabel}>BINAURAL BEATS</Text>
      {BINAURAL_TRACKS.map(renderTrack)}

      {/* Piano & Ambient */}
      <Text style={[styles.sectionLabel, { marginTop: 24 }]}>PIANO & AMBIENT</Text>
      {PIANO_TRACKS.map(renderTrack)}

      <Text style={styles.footer}>
        🎧 Use headphones for best binaural beat experience
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12' },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  pageLabel: { color: '#2a7a5e', fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { color: '#f0faf6', fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  pageSub: { color: '#2a7a5e', fontSize: 13, marginBottom: 24 },
  nowPlaying: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(77,217,172,0.08)',
    borderWidth: 1, borderColor: 'rgba(77,217,172,0.3)',
    borderRadius: 14, padding: 14, marginBottom: 24,
  },
  nowPlayingEmoji: { fontSize: 24, marginRight: 12 },
  nowPlayingInfo: { flex: 1 },
  nowPlayingLabel: { color: '#2a7a5e', fontSize: 9, letterSpacing: 2 },
  nowPlayingName: { color: '#4dd9ac', fontSize: 15, fontWeight: '600', marginTop: 2 },
  stopButton: {
    borderWidth: 1, borderColor: 'rgba(77,217,172,0.3)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  stopButtonText: { color: '#4dd9ac', fontSize: 12 },
  sectionLabel: { color: '#2a7a5e', fontSize: 10, letterSpacing: 3, marginBottom: 12 },
  trackCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, padding: 16, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  trackCardActive: {
    borderColor: 'rgba(77,217,172,0.3)',
    backgroundColor: 'rgba(77,217,172,0.06)',
  },
  trackEmoji: { fontSize: 24, marginRight: 14 },
  trackInfo: { flex: 1 },
  trackName: { color: '#6b7280', fontSize: 15, fontWeight: '500' },
  trackNameActive: { color: '#4dd9ac' },
  trackDesc: { color: '#1a4a35', fontSize: 11, marginTop: 3 },
  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: {
    borderColor: '#4dd9ac',
    backgroundColor: 'rgba(77,217,172,0.15)',
  },
  playBtnText: { color: '#4dd9ac', fontSize: 12 },
  footer: { color: '#1a4a35', fontSize: 12, textAlign: 'center', marginTop: 24 },
});