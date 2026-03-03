import { useEffect, useRef } from 'react';
import { Audio } from 'expo-av';

const TRACKS = [
  { name: 'Deep Focus',         file: require('../assets/audio/deep_focus.mp3') },
  { name: 'Flow State',         file: require('../assets/audio/flow_state.mp3') },
  { name: 'Deep Work',          file: require('../assets/audio/deep_work.mp3') },
  { name: 'Calm Focus',         file: require('../assets/audio/calm_focus.mp3') },
  { name: 'Memory',             file: require('../assets/audio/memory.mp3') },
  { name: 'Meditation',         file: require('../assets/audio/meditation.mp3') },
  { name: 'Energy Boost',       file: require('../assets/audio/energy_boost.mp3') },
  { name: 'Sleep Prep',         file: require('../assets/audio/sleep_prep.mp3') },
  { name: 'Dusty Jazz Piano',   file: require('../assets/audio/dusty_jazz_piano.mp3') },
  { name: 'Mellow Drift',       file: require('../assets/audio/mellow_drift.mp3') },
  { name: 'Deep Long Study',    file: require('../assets/audio/deep_long_study.mp3') },
  { name: 'Spacious Motifs',    file: require('../assets/audio/spacious_motifs.mp3') },
  { name: 'Quiet Focus Motif',  file: require('../assets/audio/quiet_focus_motif.mp3') },
  { name: 'Deep Focus Piano',   file: require('../assets/audio/deep_focus_piano.mp3') },
  { name: 'Mind Memory',        file: require('../assets/audio/mind_memory.mp3') },
  { name: 'Gentle Concentration', file: require('../assets/audio/gentle_concentration.mp3') },
  { name: 'Moments Are Peaceful', file: require('../assets/audio/moments_peaceful.mp3') },
  { name: 'Glass Shore at Dusk',  file: require('../assets/audio/glass_shore.mp3') },
  { name: 'Midnight Sleep Prep',  file: require('../assets/audio/midnight_sleep_prep.mp3') },
];

export const useBinauralBeats = (active: boolean, trackIndex = 0) => {
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
    });
  }, []);

  useEffect(() => {
    if (active) {
      playTrack(trackIndex);
    } else {
      stopTrack();
    }
    return () => { stopTrack(); };
  }, [active, trackIndex]);

  const playTrack = async (index: number) => {
    try {
      await stopTrack();
      const track = TRACKS[index % TRACKS.length];
      const { sound } = await Audio.Sound.createAsync(
        track.file,
        { shouldPlay: true, isLooping: true, volume: 1.0 }
      );
      soundRef.current = sound;
      console.log(`🎵 Playing: ${track.name}`);
    } catch (err) {
      console.log('Audio error:', err);
    }
  };

  const stopTrack = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch (err) {
      console.log('Stop error:', err);
    }
  };
};