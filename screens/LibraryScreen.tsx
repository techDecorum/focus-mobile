import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, StatusBar,
} from 'react-native';
import TrackVisualizer, { getVibeFromDescription } from '../components/TrackVisualizer';
import { useTheme } from '../contexts/ThemeContext';
import { useMusic, TRACKS } from '../contexts/MusicContext';
import PageHeader from '../components/PageHeader';

const BINAURAL_TRACKS = TRACKS.slice(0, 8);
const PIANO_TRACKS    = TRACKS.slice(8);

export default function LibraryScreen() {
  const { colors } = useTheme();
  const c = colors;
  const {
    isPlaying, trackIndex, userStartedPlayback,
    play, pause, stop, next, prev, setTrackIndex,
  } = useMusic();

  const [playerOpen, setPlayerOpen] = useState(false);

  const currentTrack = TRACKS[trackIndex];

  const handleTrackTap = (index: number) => {
    setTrackIndex(index);
    play(index);
    setPlayerOpen(true);
  };

  const handlePauseResume = () => {
    if (isPlaying) pause();
    else play();
  };

  const handlePrev = () => {
    prev();
  };

  const handleNext = () => {
    next();
  };

  // Close full-screen player — music keeps playing, mini-player takes over
  const handleCollapsePlayer = () => {
    setPlayerOpen(false);
  };

  // Stop button in the list — stops entirely, dismisses mini-player
  const handleStop = async () => {
    await stop();
    setPlayerOpen(false);
  };

  const renderTrack = (track: typeof TRACKS[0], i: number) => {
    const globalIndex = TRACKS.findIndex(t => t.name === track.name);
    const isActive = userStartedPlayback && trackIndex === globalIndex;

    return (
      <TouchableOpacity
        key={globalIndex}
        style={[
          styles.trackCard,
          { backgroundColor: c.card, borderColor: c.cardBorder },
          isActive && { borderColor: `${c.accent}55`, backgroundColor: `${c.accent}10` },
        ]}
        onPress={() => handleTrackTap(globalIndex)}
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
      <View style={[styles.outerContainer, { backgroundColor: c.bg }]}>
        <PageHeader title="Focus Sounds" subtitle="MUSIC LIBRARY" />

        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Text style={[styles.pageSub, { color: c.textSub }]}>
            {TRACKS.length} tracks · Tap to open visual player
          </Text>

          {/* Now Playing bar — shows when playing but full player is closed */}
          {userStartedPlayback && !playerOpen && (
            <TouchableOpacity
              style={[styles.nowPlaying, { backgroundColor: `${c.accent}10`, borderColor: `${c.accent}44` }]}
              onPress={() => setPlayerOpen(true)}
            >
              <Text style={styles.nowPlayingEmoji}>{currentTrack.emoji}</Text>
              <View style={styles.nowPlayingInfo}>
                <Text style={[styles.nowPlayingLabel, { color: c.textSub }]}>
                  {isPlaying ? 'NOW PLAYING · TAP TO OPEN' : 'PAUSED · TAP TO OPEN'}
                </Text>
                <Text style={[styles.nowPlayingName, { color: c.accent }]}>{currentTrack.name}</Text>
              </View>
              <TouchableOpacity onPress={handleStop} style={styles.stopButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.stopButtonText, { color: c.accent }]}>■</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          <Text style={[styles.sectionLabel, { color: c.textSub }]}>BINAURAL BEATS</Text>
          {BINAURAL_TRACKS.map((t, i) => renderTrack(t, i))}

          <Text style={[styles.sectionLabel, { color: c.textSub, marginTop: 24 }]}>PIANO & AMBIENT</Text>
          {PIANO_TRACKS.map((t, i) => renderTrack(t, i))}

          <Text style={[styles.footer, { color: c.textMuted }]}>
            🎧 Use headphones for best binaural beat experience
          </Text>
        </ScrollView>
      </View>

      {/* Full-screen visual player */}
      <Modal visible={playerOpen} animationType="slide" statusBarTranslucent>
        <View style={styles.player}>
          <TrackVisualizer vibe={getVibeFromDescription(currentTrack.description)} />

          <View style={styles.playerOverlay}>
            {/* Collapse — keeps music playing, mini-player shows */}
            <TouchableOpacity style={styles.closeBtn} onPress={handleCollapsePlayer}>
              <Text style={styles.closeBtnText}>↓</Text>
            </TouchableOpacity>

            <View style={styles.playerInfo}>
              <Text style={styles.playerEmoji}>{currentTrack.emoji}</Text>
              <Text style={styles.playerName}>{currentTrack.name}</Text>
              <Text style={styles.playerDesc}>{currentTrack.description}</Text>

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

              {/* Stop entirely from full player too */}
              <TouchableOpacity onPress={handleStop} style={styles.stopFromPlayer}>
                <Text style={[styles.stopFromPlayerText, { color: 'rgba(77,217,172,0.4)' }]}>
                  ■  Stop playback
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 20, paddingBottom: 40 },
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
    padding: 24,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 12 : 56,
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

  stopFromPlayer: { marginTop: 28 },
  stopFromPlayerText: { fontSize: 13, letterSpacing: 1 },
});