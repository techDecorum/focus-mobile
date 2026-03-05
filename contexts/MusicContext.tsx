import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import { Audio } from 'expo-av';

export const TRACKS = [
  { name: 'Deep Focus',           emoji: '🧠', description: 'Beta · 14Hz',    file: require('../assets/audio/deep_focus.mp3') },
  { name: 'Flow State',           emoji: '🌊', description: 'Alpha · 10Hz',   file: require('../assets/audio/flow_state.mp3') },
  { name: 'Deep Work',            emoji: '⚡', description: 'Gamma · 40Hz',   file: require('../assets/audio/deep_work.mp3') },
  { name: 'Calm Focus',           emoji: '🧘', description: 'Theta · 6Hz',    file: require('../assets/audio/calm_focus.mp3') },
  { name: 'Memory',               emoji: '💡', description: 'Beta · 12Hz',    file: require('../assets/audio/memory.mp3') },
  { name: 'Meditation',           emoji: '☯️', description: 'Delta · 4Hz',    file: require('../assets/audio/meditation.mp3') },
  { name: 'Energy Boost',         emoji: '🚀', description: 'Beta · 20Hz',    file: require('../assets/audio/energy_boost.mp3') },
  { name: 'Sleep Prep',           emoji: '🌙', description: 'Delta · 2Hz',    file: require('../assets/audio/sleep_prep.mp3') },
  { name: 'Dusty Jazz Piano',     emoji: '🎷', description: 'Jazz · 90s',     file: require('../assets/audio/dusty_jazz_piano.mp3') },
  { name: 'Mellow Drift',         emoji: '🌿', description: 'Ambient',        file: require('../assets/audio/mellow_drift.mp3') },
  { name: 'Deep Long Study',      emoji: '📚', description: 'Deep',           file: require('../assets/audio/deep_long_study.mp3') },
  { name: 'Spacious Motifs',      emoji: '🌌', description: 'Ambient',        file: require('../assets/audio/spacious_motifs.mp3') },
  { name: 'Quiet Focus Motif',    emoji: '🕊️', description: 'Calm',           file: require('../assets/audio/quiet_focus_motif.mp3') },
  { name: 'Deep Focus Piano',     emoji: '🖤', description: 'Piano',          file: require('../assets/audio/deep_focus_piano.mp3') },
  { name: 'Mind Memory',          emoji: '🔮', description: 'Ambient',        file: require('../assets/audio/mind_memory.mp3') },
  { name: 'Gentle Concentration', emoji: '🌸', description: 'Meditation',     file: require('../assets/audio/gentle_concentration.mp3') },
  { name: 'Moments Are Peaceful', emoji: '☁️', description: 'Ambient',        file: require('../assets/audio/moments_peaceful.mp3') },
  { name: 'Glass Shore at Dusk',  emoji: '🌅', description: 'Ambient',        file: require('../assets/audio/glass_shore.mp3') },
  { name: 'Midnight Sleep Prep',  emoji: '🌃', description: 'Sleep',          file: require('../assets/audio/midnight_sleep_prep.mp3') },
];

interface MusicContextType {
  isPlaying: boolean;
  trackIndex: number;
  sessionActive: boolean;
  userStartedPlayback: boolean;   // true only after user explicitly taps play
  play: (index?: number) => Promise<void>;
  pause: () => Promise<void>;
  stop: () => Promise<void>;      // stops + dismisses mini-player
  next: () => void;
  prev: () => void;
  setTrackIndex: (i: number) => void;
  setSessionActive: (active: boolean) => void;
}

const MusicContext = createContext<MusicContextType>({
  isPlaying: false,
  trackIndex: 0,
  sessionActive: false,
  userStartedPlayback: false,
  play: async () => {},
  pause: async () => {},
  stop: async () => {},
  next: () => {},
  prev: () => {},
  setTrackIndex: () => {},
  setSessionActive: () => {},
});

export const useMusic = () => useContext(MusicContext);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackIndex, setTrackIndexState] = useState(0);
  const [sessionActive, setSessionActiveState] = useState(false);
  const [userStartedPlayback, setUserStartedPlayback] = useState(false);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
    });
    return () => { unloadSound(); };
  }, []);

  const playRequestRef = useRef(0); // increments on each play call to cancel stale ones

  const unloadSound = async () => {
    try {
      if (soundRef.current) {
        const s = soundRef.current;
        soundRef.current = null;
        await s.stopAsync();
        await s.unloadAsync();
      }
    } catch {}
  };

  const play = useCallback(async (index?: number) => {
    const idx = index ?? trackIndex;
    // Mark this as the latest play request
    playRequestRef.current += 1;
    const myRequest = playRequestRef.current;

    // Stop whatever is currently playing immediately
    await unloadSound();

    // If another play() was called while we were unloading, bail out
    if (myRequest !== playRequestRef.current) return;

    try {
      const track = TRACKS[idx % TRACKS.length];
      const { sound } = await Audio.Sound.createAsync(
        track.file,
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );

      // Check again — another play() may have fired during createAsync
      if (myRequest !== playRequestRef.current) {
        await sound.stopAsync();
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      setIsPlaying(true);
      setUserStartedPlayback(true);
      if (index !== undefined) setTrackIndexState(index);
    } catch (err) {
      console.log('Audio error:', err);
    }
  }, [trackIndex]);

  const pause = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      }
    } catch {}
  }, []);

  // stop = pause + dismiss mini-player
  const stop = useCallback(async () => {
    await unloadSound();
    setIsPlaying(false);
    setUserStartedPlayback(false);
  }, []);

  const next = useCallback(() => {
    const newIndex = (trackIndex + 1) % TRACKS.length;
    setTrackIndexState(newIndex);
    if (isPlaying) play(newIndex);
    else setTrackIndexState(newIndex);
  }, [trackIndex, isPlaying, play]);

  const prev = useCallback(() => {
    const newIndex = (trackIndex - 1 + TRACKS.length) % TRACKS.length;
    if (isPlaying) play(newIndex);
    else setTrackIndexState(newIndex);
  }, [trackIndex, isPlaying, play]);

  const setTrackIndex = useCallback((i: number) => {
    setTrackIndexState(i);
    if (isPlaying) play(i);
  }, [isPlaying, play]);

  const setSessionActive = useCallback((active: boolean) => {
    setSessionActiveState(active);
  }, []);

  return (
    <MusicContext.Provider value={{
      isPlaying, trackIndex, sessionActive, userStartedPlayback,
      play, pause, stop, next, prev, setTrackIndex, setSessionActive,
    }}>
      {children}
    </MusicContext.Provider>
  );
}