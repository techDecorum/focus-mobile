import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Modal, ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useMusic, TRACKS } from '../contexts/MusicContext';

export default function MiniPlayer() {
  const { colors } = useTheme();
  const c = colors;
  const {
    isPlaying, trackIndex, sessionActive, userStartedPlayback,
    play, pause, stop, next, prev, setTrackIndex,
  } = useMusic();
  const [showList, setShowList] = useState(false);
  const slideAnim = useRef(new Animated.Value(100)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const track = TRACKS[trackIndex];

  // Only show if user explicitly started playback AND not in a session
  const visible = userStartedPlayback && !sessionActive;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : 100,
      tension: 70, friction: 12, useNativeDriver: true,
    }).start();
  }, [visible]);

  // Pulse dot when playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.6, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isPlaying]);

  if (!visible) return null;

  return (
    <>
      <Animated.View style={[
        styles.container,
        {
          backgroundColor: c.navBg,
          borderColor: `${c.accent}28`,
          transform: [{ translateY: slideAnim }],
        },
      ]}>
        {/* Prev */}
        <TouchableOpacity onPress={prev} style={styles.navBtn}>
          <Text style={[styles.navText, { color: c.textMuted }]}>‹</Text>
        </TouchableOpacity>

        {/* Track info — tap to open full list */}
        <TouchableOpacity style={styles.center} onPress={() => setShowList(true)}>
          <Text style={styles.trackEmoji}>{track.emoji}</Text>
          <View style={styles.trackInfo}>
            <View style={styles.trackNameRow}>
              {isPlaying && (
                <Animated.View style={[
                  styles.playingDot,
                  { backgroundColor: c.accent, transform: [{ scale: pulseAnim }] },
                ]} />
              )}
              <Text style={[styles.trackName, { color: c.accent }]} numberOfLines={1}>
                {track.name}
              </Text>
            </View>
            <Text style={[styles.trackDesc, { color: c.textMuted }]}>{track.description}</Text>
          </View>
        </TouchableOpacity>

        {/* Play / Pause */}
        <TouchableOpacity
          onPress={() => isPlaying ? pause() : play()}
          style={[styles.playBtn, { borderColor: `${c.accent}44`, backgroundColor: `${c.accent}12` }]}
        >
          <Text style={[styles.playBtnText, { color: c.accent }]}>
            {isPlaying ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        {/* Next */}
        <TouchableOpacity onPress={next} style={styles.navBtn}>
          <Text style={[styles.navText, { color: c.textMuted }]}>›</Text>
        </TouchableOpacity>

        {/* Close — stops music entirely */}
        <TouchableOpacity onPress={stop} style={styles.closeBtn}>
          <Text style={[styles.closeText, { color: c.textMuted }]}>✕</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Track picker */}
      <Modal visible={showList} transparent animationType="slide">
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setShowList(false)} />
        <View style={[styles.sheet, { backgroundColor: c.sheetBg, borderColor: `${c.accent}22` }]}>
          <View style={[styles.handle, { backgroundColor: `${c.accent}33` }]} />
          <Text style={[styles.sheetTitle, { color: c.text }]}>Choose Track</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {TRACKS.map((t, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.trackRow,
                  { borderBottomColor: `${c.accent}10` },
                  trackIndex === i && { backgroundColor: `${c.accent}0f` },
                ]}
                onPress={() => {
                  setTrackIndex(i);
                  play(i);
                  setShowList(false);
                }}
              >
                <Text style={styles.rowEmoji}>{t.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowName, { color: c.textSub }, trackIndex === i && { color: c.accent }]}>
                    {t.name}
                  </Text>
                  <Text style={[styles.rowDesc, { color: c.textMuted }]}>{t.description}</Text>
                </View>
                {trackIndex === i && (
                  <Text style={[styles.badge, { color: c.accent }]}>
                    {isPlaying ? '▶ NOW' : 'SELECTED'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 12,
    marginBottom: 6,
  },
  navBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  navText: { fontSize: 26, fontWeight: '200' },
  center: {
    flex: 1, flexDirection: 'row',
    alignItems: 'center', gap: 8,
    paddingHorizontal: 4,
  },
  trackEmoji: { fontSize: 18 },
  trackInfo: { flex: 1 },
  trackNameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  playingDot: { width: 5, height: 5, borderRadius: 3 },
  trackName: { fontSize: 12, fontWeight: '500', flex: 1 },
  trackDesc: { fontSize: 10, marginTop: 1 },
  playBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  playBtnText: { fontSize: 12 },
  closeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  closeText: { fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 48,
    borderTopWidth: 1, maxHeight: '75%',
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  trackRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, gap: 12,
  },
  rowEmoji: { fontSize: 20, width: 28 },
  rowName: { fontSize: 14, fontWeight: '500' },
  rowDesc: { fontSize: 11, marginTop: 2 },
  badge: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
});