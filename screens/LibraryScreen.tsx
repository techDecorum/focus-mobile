import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { Audio } from 'expo-av';
import TrackVisualizer, { getVibeFromDescription } from '../components/TrackVisualizer';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

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
type Track = typeof ALL_TRACKS[0];

export default function LibraryScreen() {
  const { colors } = useTheme();
  const c = colors;
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const stopAudio = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
    setIsPlaying(false);
  };

  const loadAndPlay = async (track: Track) => {
    await stopAudio();
    try {
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
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (err) {
      console.log('Playback error:', err);
    }
  };

  const handlePauseResume = async () => {
    if (!soundRef.current) return;
    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch {}
  };

  const handleTrackTap = (track: Track) => {
    setPlayerOpen(true);
    if (currentTrack?.index !== track.index) {
      loadAndPlay(track);
    }
  };

  const handlePrev = () => {
    if (!currentTrack) return;
    const idx = ALL_TRACKS.findIndex(t => t.index === currentTrack.index);
    loadAndPlay(ALL_TRACKS[(idx - 1 + ALL_TRACKS.length) % ALL_TRACKS.length]);
  };

  const handleNext = () => {
    if (!currentTrack) return;
    const idx = ALL_TRACKS.findIndex(t => t.index === currentTrack.index);
    loadAndPlay(ALL_TRACKS[(idx + 1) % ALL_TRACKS.length]);
  };

  const handleClosePlayer = async () => {
    await stopAudio();
    setCurrentTrack(null);
    setPlayerOpen(false);
  };

  const renderTrack = (track: Track) => {
    const isActive = currentTrack?.index === track.index;
    return (
      <TouchableOpacity
        key={track.index}
        style={[
          styles.trackCard,
          { backgroundColor: c.card, borderColor: c.cardBorder },
          isActive && { borderColor: `${c.accent}55`, backgroundColor: `${c.accent}10` },
        ]}
        onPress={() => handleTrackTap(track)}
      >
        <Text style={styles.trackEmoji}>{track.emoji}</Text>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, { color: c.textMuted }, isActive && { color: c.accent }]}>
            {track.name}
          </Text>
          <Text style={[styles.trackDesc, { color: c.textMuted }]}>{track.description}</Text>
        </View>
        <View style={[
          styles.playBtn,
          { borderColor: c.cardBorder },
          isActive && { borderColor: c.accent, backgroundColor: `${c.accent}22` },
        ]}>
          <Text style={[styles.playBtnText, { color: c.accent }]}>
            {isActive && isPlaying ? '❚❚' : '▶'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={styles.content}>
        <Text style={[styles.pageLabel, { color: c.textSub }]}>MUSIC LIBRARY</Text>
        <Text style={[styles.pageTitle, { color: c.text }]}>Focus Sounds</Text>
        <Text style={[styles.pageSub, { color: c.textSub }]}>{ALL_TRACKS.length} tracks · Tap to open visual player</Text>

        {/* Now Playing Bar */}
        {currentTrack && !playerOpen && (
          <TouchableOpacity
            style={[styles.nowPlaying, { backgroundColor: `${c.accent}10`, borderColor: `${c.accent}44` }]}
            onPress={() => setPlayerOpen(true)}
          >
            <Text style={styles.nowPlayingEmoji}>{currentTrack.emoji}</Text>
            <View style={styles.nowPlayingInfo}>
              <Text style={[styles.nowPlayingLabel, { color: c.textSub }]}>NOW PLAYING · TAP TO OPEN</Text>
              <Text style={[styles.nowPlayingName, { color: c.accent }]}>{currentTrack.name}</Text>
            </View>
            <TouchableOpacity onPress={handleClosePlayer} style={styles.stopButton}>
              <Text style={[styles.stopButtonText, { color: c.accent }]}>■</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        <Text style={[styles.sectionLabel, { color: c.textSub }]}>BINAURAL BEATS</Text>
        {BINAURAL_TRACKS.map(renderTrack)}

        <Text style={[styles.sectionLabel, { color: c.textSub, marginTop: 24 }]}>PIANO & AMBIENT</Text>
        {PIANO_TRACKS.map(renderTrack)}

        <Text style={[styles.footer, { color: c.textMuted }]}>🎧 Use headphones for best binaural beat experience</Text>
      </ScrollView>

      {/* Full Screen Visual Player */}
      <Modal visible={playerOpen} animationType="slide" statusBarTranslucent>
        <View style={styles.player}>
          {currentTrack && (
            <TrackVisualizer vibe={getVibeFromDescription(currentTrack.description)} />
          )}
          <View style={styles.playerOverlay}>
            <TouchableOpacity style={styles.closeBtn} onPress={handleClosePlayer}>
              <Text style={styles.closeBtnText}>↓</Text>
            </TouchableOpacity>
            <View style={styles.playerInfo}>
              <Text style={styles.playerEmoji}>{currentTrack?.emoji}</Text>
              <Text style={styles.playerName}>{currentTrack?.name}</Text>
              <Text style={styles.playerDesc}>{currentTrack?.description}</Text>
              <View style={styles.controls}>
                <TouchableOpacity style={styles.prevBtn} onPress={handlePrev}>
                  <Text style={styles.controlText}>⏮</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.playPauseBtn} onPress={handlePauseResume}>
                  <Text style={styles.playPauseText}>{isPlaying ? '❚❚' : '▶'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                  <Text style={styles.controlText}>⏭</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  pageLabel: { fontSize: 11, letterSpacing: 3, marginBottom: 8 },
  pageTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  pageSub: { fontSize: 13, marginBottom: 24 },
  nowPlaying: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 24,
  },
  nowPlayingEmoji: { fontSize: 24, marginRight: 12 },
  nowPlayingInfo: { flex: 1 },
  nowPlayingLabel: { fontSize: 9, letterSpacing: 2 },
  nowPlayingName: { fontSize: 15, fontWeight: '600', marginTop: 2 },
  stopButton: { padding: 8 },
  stopButtonText: { fontSize: 16 },
  sectionLabel: { fontSize: 10, letterSpacing: 3, marginBottom: 12 },
  trackCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 10,
  },
  trackEmoji: { fontSize: 24, marginRight: 14 },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 15, fontWeight: '500' },
  trackDesc: { fontSize: 11, marginTop: 3 },
  playBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  playBtnText: { fontSize: 12 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 24 },
  player: { flex: 1, backgroundColor: '#060d12' },
  playerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 24, paddingTop: 50,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  closeBtnText: { color: '#4dd9ac', fontSize: 22 },
  playerInfo: { alignItems: 'center', paddingBottom: 40 },
  playerEmoji: { fontSize: 56, marginBottom: 16 },
  playerName: { color: '#f0faf6', fontSize: 26, fontWeight: 'bold', textAlign: 'center' },
  playerDesc: { color: '#2a7a5e', fontSize: 13, marginTop: 8, marginBottom: 32, textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 24 },
  prevBtn: { padding: 12 },
  nextBtn: { padding: 12 },
  controlText: { color: '#4dd9ac', fontSize: 28 },
  playPauseBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(77,217,172,0.15)',
    borderWidth: 1, borderColor: '#4dd9ac',
    alignItems: 'center', justifyContent: 'center',
  },
  playPauseText: { color: '#4dd9ac', fontSize: 24 },
});