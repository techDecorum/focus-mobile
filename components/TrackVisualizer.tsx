import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle, Path, Skia, useCanvasRef, usePaint } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export type VibeType = 'beta' | 'alpha' | 'gamma' | 'theta' | 'delta' | 'jazz' | 'ambient' | 'piano';

export function getVibeFromDescription(description: string): VibeType {
  const d = description.toLowerCase();
  if (d.includes('gamma'))   return 'gamma';
  if (d.includes('beta'))    return 'beta';
  if (d.includes('alpha'))   return 'alpha';
  if (d.includes('theta'))   return 'theta';
  if (d.includes('delta') || d.includes('sleep') || d.includes('midnight')) return 'delta';
  if (d.includes('jazz'))    return 'jazz';
  if (d.includes('piano') || d.includes('glass') || d.includes('peaceful') || d.includes('gentle') || d.includes('quiet') || d.includes('motif')) return 'piano';
  return 'ambient';
}

interface Props { vibe: VibeType; }

const cx = width / 2;
const cy = height / 2;

// ── BETA: Electric rings ─────────────────────────────────────────────────────
function BetaViz({ t }: { t: any }) {
  const rings = Array.from({ length: 6 }, (_, i) => ({
    r: useDerivedValue(() => 40 + i * 55 + Math.sin(t.value * Math.PI * 2 + i) * 18),
    opacity: useDerivedValue(() => 0.08 + Math.sin(t.value * Math.PI * 2 - i * 0.5) * 0.05),
  }));
  const dots = Array.from({ length: 12 }, (_, i) => ({
    x: useDerivedValue(() => cx + Math.cos((i / 12) * Math.PI * 2 + t.value * Math.PI * 2) * (100 + Math.sin(t.value * 4) * 30)),
    y: useDerivedValue(() => cy + Math.sin((i / 12) * Math.PI * 2 + t.value * Math.PI * 2) * (100 + Math.sin(t.value * 4) * 30)),
    r: useDerivedValue(() => 3 + Math.sin(t.value * Math.PI * 4 + i) * 2),
  }));
  return (
    <>
      {rings.map((ring, i) => (
        <Circle key={i} cx={cx} cy={cy} r={ring.r} color="rgba(77,217,172,1)" opacity={ring.opacity} style="stroke" strokeWidth={1.5} />
      ))}
      {dots.map((dot, i) => (
        <Circle key={`d${i}`} cx={dot.x} cy={dot.y} r={dot.r} color="rgba(77,217,172,0.8)" />
      ))}
    </>
  );
}

// ── ALPHA: Ocean waves ───────────────────────────────────────────────────────
function AlphaViz({ t }: { t: any }) {
  const waves = Array.from({ length: 6 }, (_, w) =>
    useDerivedValue(() => {
      const p = Skia.Path.Make();
      p.moveTo(0, cy);
      for (let x = 0; x <= width; x += 5) {
        const y = cy +
          Math.sin((x / width) * Math.PI * 3 + t.value * Math.PI * 2 + w * 0.8) * (40 - w * 5) +
          Math.sin((x / width) * Math.PI * 5 + t.value * Math.PI * 1.4 + w) * 12;
        p.lineTo(x, y);
      }
      return p;
    })
  );
  return (
    <>
      {waves.map((path, w) => (
        <Path key={w} path={path} color={`rgba(77,217,172,${0.15 - w * 0.02})`} style="stroke" strokeWidth={1.5} />
      ))}
    </>
  );
}

// ── GAMMA: Lightning particles ───────────────────────────────────────────────
function GammaViz({ t }: { t: any }) {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    x: useDerivedValue(() => cx + Math.cos((i / 24) * Math.PI * 2 + t.value * Math.PI * 6) * (60 + i * 7)),
    y: useDerivedValue(() => cy + Math.sin((i / 24) * Math.PI * 2 + t.value * Math.PI * 6) * (60 + i * 7)),
    r: useDerivedValue(() => 2 + Math.abs(Math.sin(t.value * Math.PI * 4 + i)) * 5),
  }));
  return (
    <>
      {particles.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={p.r} color={i % 2 === 0 ? 'rgba(255,255,80,0.8)' : 'rgba(77,217,172,0.8)'} />
      ))}
    </>
  );
}

// ── THETA: Breathing orbs ────────────────────────────────────────────────────
function ThetaViz({ t }: { t: any }) {
  const orbs = Array.from({ length: 6 }, (_, i) => ({
    r: useDerivedValue(() => 25 + i * 30 + Math.sin(t.value * Math.PI * 2 + i * 0.5) * 22),
    opacity: useDerivedValue(() => 0.05 + Math.sin(t.value * Math.PI * 2 + i) * 0.04),
  }));
  const cr = useDerivedValue(() => 20 + Math.sin(t.value * Math.PI * 2) * 8);
  return (
    <>
      {orbs.map((orb, i) => (
        <Circle key={i} cx={cx} cy={cy} r={orb.r} color="rgba(180,140,255,1)" opacity={orb.opacity} />
      ))}
      <Circle cx={cx} cy={cy} r={cr} color="rgba(180,140,255,0.5)" />
    </>
  );
}

// ── DELTA: Deep space stars ──────────────────────────────────────────────────
function DeltaViz({ t }: { t: any }) {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    sx: (i * 137.5) % width,
    sy: (i * 97.3) % height,
    r: useDerivedValue(() => 1 + (i % 3) * 0.5 + Math.sin(t.value * Math.PI * 2 + i * 0.3) * 0.8),
    opacity: useDerivedValue(() => 0.2 + Math.sin(t.value * Math.PI * 2 + i * 0.5) * 0.3),
  }));
  return (
    <>
      {stars.map((s, i) => (
        <Circle key={i} cx={s.sx} cy={s.sy} r={s.r} color="rgba(200,200,255,1)" opacity={s.opacity} />
      ))}
    </>
  );
}

// ── JAZZ: Warm amber smoke ───────────────────────────────────────────────────
function JazzViz({ t }: { t: any }) {
  const orbs = Array.from({ length: 8 }, (_, i) => ({
    x: useDerivedValue(() => width * 0.3 + Math.sin(t.value * Math.PI * 0.6 + i) * width * 0.3),
    y: useDerivedValue(() => cy + Math.cos(t.value * Math.PI * 0.4 + i * 0.7) * height * 0.25),
    r: useDerivedValue(() => 50 + i * 18 + Math.sin(t.value * Math.PI * 2 + i) * 20),
    opacity: useDerivedValue(() => 0.04 + Math.sin(t.value * Math.PI * 2 + i * 0.5) * 0.02),
  }));
  return (
    <>
      {orbs.map((orb, i) => (
        <Circle key={i} cx={orb.x} cy={orb.y} r={orb.r} color="rgba(255,180,60,1)" opacity={orb.opacity} />
      ))}
    </>
  );
}

// ── AMBIENT: Nebula clouds ───────────────────────────────────────────────────
function AmbientViz({ t }: { t: any }) {
  const clouds = Array.from({ length: 7 }, (_, i) => ({
    x: useDerivedValue(() => width * (0.15 + i * 0.12) + Math.sin(t.value * Math.PI * 0.4 + i) * 40),
    y: useDerivedValue(() => height * 0.4 + Math.cos(t.value * Math.PI * 0.3 + i * 0.8) * 80),
    r: useDerivedValue(() => 70 + i * 18 + Math.sin(t.value * Math.PI * 2 + i) * 15),
    opacity: useDerivedValue(() => 0.05 + Math.sin(t.value * Math.PI + i) * 0.03),
  }));
  return (
    <>
      {clouds.map((c, i) => (
        <Circle key={i} cx={c.x} cy={c.y} r={c.r} color={i % 2 === 0 ? 'rgba(100,60,255,1)' : 'rgba(77,217,172,1)'} opacity={c.opacity} />
      ))}
    </>
  );
}

// ── PIANO: Falling rain ──────────────────────────────────────────────────────
function PianoViz({ t }: { t: any }) {
  const drops = Array.from({ length: 35 }, (_, i) => {
    const dx = (i * 43.7) % width;
    const speed = 0.3 + (i % 5) * 0.15;
    const delay = (i * 0.1) % 1;
    return {
      path: useDerivedValue(() => {
        const dy = ((t.value + delay) * speed * height) % height;
        const p = Skia.Path.Make();
        p.moveTo(dx, dy);
        p.lineTo(dx, dy + 15);
        return p;
      }),
      opacity: useDerivedValue(() => 0.08 + Math.sin(t.value * Math.PI * 2 + i) * 0.06),
    };
  });
  return (
    <>
      {drops.map((drop, i) => (
        <Path key={i} path={drop.path} color="rgba(77,217,172,1)" opacity={drop.opacity} style="stroke" strokeWidth={1} />
      ))}
    </>
  );
}

function getDuration(vibe: VibeType): number {
  switch (vibe) {
    case 'gamma':   return 800;
    case 'beta':    return 3000;
    case 'piano':   return 3000;
    case 'alpha':   return 4000;
    case 'jazz':    return 5000;
    case 'theta':   return 6000;
    case 'ambient': return 7000;
    case 'delta':   return 8000;
  }
}

export default function TrackVisualizer({ vibe }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(
      withTiming(1, { duration: getDuration(vibe), easing: Easing.linear }),
      -1,
      false
    );
  }, [vibe]);

  const renderViz = () => {
    switch (vibe) {
      case 'beta':    return <BetaViz t={t} />;
      case 'alpha':   return <AlphaViz t={t} />;
      case 'gamma':   return <GammaViz t={t} />;
      case 'theta':   return <ThetaViz t={t} />;
      case 'delta':   return <DeltaViz t={t} />;
      case 'jazz':    return <JazzViz t={t} />;
      case 'ambient': return <AmbientViz t={t} />;
      case 'piano':   return <PianoViz t={t} />;
    }
  };

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas}>
        {renderViz()}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060d12' },
  canvas: { flex: 1 },
});