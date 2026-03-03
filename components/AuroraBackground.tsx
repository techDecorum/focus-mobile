import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function AuroraBackground() {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  // Aurora bands - slow flowing ribbons across the sky
  const band1 = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const baseY = height * 0.25;
    p.moveTo(0, baseY);
    for (let x = 0; x <= width; x += 6) {
      const y = baseY
        + Math.sin((x / width) * Math.PI * 2.5 + t.value * Math.PI * 2) * 60
        + Math.sin((x / width) * Math.PI * 4 + t.value * Math.PI * 1.3) * 25
        + Math.sin((x / width) * Math.PI * 1.2 + t.value * Math.PI * 0.7) * 40;
      p.lineTo(x, y);
    }
    for (let x = width; x >= 0; x -= 6) {
      const y = baseY + 80
        + Math.sin((x / width) * Math.PI * 2.5 + t.value * Math.PI * 2) * 55
        + Math.sin((x / width) * Math.PI * 4 + t.value * Math.PI * 1.3) * 20;
      p.lineTo(x, y);
    }
    p.close();
    return p;
  });

  const band2 = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const baseY = height * 0.18;
    p.moveTo(0, baseY);
    for (let x = 0; x <= width; x += 6) {
      const y = baseY
        + Math.sin((x / width) * Math.PI * 3 + t.value * Math.PI * 2 * 0.8 + 1.2) * 45
        + Math.sin((x / width) * Math.PI * 5 + t.value * Math.PI * 1.5) * 20;
      p.lineTo(x, y);
    }
    for (let x = width; x >= 0; x -= 6) {
      const y = baseY + 55
        + Math.sin((x / width) * Math.PI * 3 + t.value * Math.PI * 2 * 0.8 + 1.2) * 40;
      p.lineTo(x, y);
    }
    p.close();
    return p;
  });

  const band3 = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const baseY = height * 0.32;
    p.moveTo(0, baseY);
    for (let x = 0; x <= width; x += 6) {
      const y = baseY
        + Math.sin((x / width) * Math.PI * 2 + t.value * Math.PI * 2 * 0.6 + 2.5) * 50
        + Math.sin((x / width) * Math.PI * 3.5 + t.value * Math.PI * 1.1) * 22;
      p.lineTo(x, y);
    }
    for (let x = width; x >= 0; x -= 6) {
      const y = baseY + 65
        + Math.sin((x / width) * Math.PI * 2 + t.value * Math.PI * 2 * 0.6 + 2.5) * 45;
      p.lineTo(x, y);
    }
    p.close();
    return p;
  });

  const band4 = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const baseY = height * 0.12;
    p.moveTo(0, baseY);
    for (let x = 0; x <= width; x += 6) {
      const y = baseY
        + Math.sin((x / width) * Math.PI * 1.8 + t.value * Math.PI * 2 * 1.2 + 0.8) * 35
        + Math.sin((x / width) * Math.PI * 4.5 + t.value * Math.PI * 0.9) * 15;
      p.lineTo(x, y);
    }
    for (let x = width; x >= 0; x -= 6) {
      const y = baseY + 45
        + Math.sin((x / width) * Math.PI * 1.8 + t.value * Math.PI * 2 * 1.2 + 0.8) * 30;
      p.lineTo(x, y);
    }
    p.close();
    return p;
  });

  // Stars
  const stars = Array.from({ length: 60 }, (_, i) => ({
    x: (i * 137.5) % width,
    y: (i * 61.8) % (height * 0.55),
    r: 0.8 + (i % 3) * 0.5,
    opacity: useDerivedValue(() => 0.3 + Math.sin(t.value * Math.PI * 2 + i * 0.7) * 0.3),
  }));

  // Arctic ground silhouette
  const ground = useDerivedValue(() => {
    const p = Skia.Path.Make();
    const groundY = height * 0.72;
    p.moveTo(0, height);
    p.lineTo(0, groundY + 20);
    // rolling arctic hills
    for (let x = 0; x <= width; x += 8) {
      const y = groundY
        + Math.sin((x / width) * Math.PI * 3) * 18
        + Math.sin((x / width) * Math.PI * 7) * 8
        + Math.cos((x / width) * Math.PI * 1.5) * 12;
      p.lineTo(x, y);
    }
    p.lineTo(width, height);
    p.close();
    return p;
  });

  // Pine tree silhouettes
  const trees = Array.from({ length: 8 }, (_, i) => {
    const tx = width * (0.05 + i * 0.13);
    const ty = height * 0.68 - (i % 3) * 15;
    const treeH = 55 + (i % 3) * 20;
    const treeW = 22 + (i % 2) * 8;
    const path = Skia.Path.Make();
    path.moveTo(tx, ty - treeH);
    path.lineTo(tx - treeW / 2, ty);
    path.lineTo(tx + treeW / 2, ty);
    path.close();
    // second tier
    path.moveTo(tx, ty - treeH * 0.6);
    path.lineTo(tx - treeW * 0.7, ty - treeH * 0.25);
    path.lineTo(tx + treeW * 0.7, ty - treeH * 0.25);
    path.close();
    return path;
  });

  // Reflection shimmer on snow
  const shimmer = Array.from({ length: 5 }, (_, i) => ({
    path: useDerivedValue(() => {
      const p = Skia.Path.Make();
      const sx = width * (0.1 + i * 0.18);
      const sy = height * 0.78;
      const sw = 30 + i * 10 + Math.sin(t.value * Math.PI * 2 + i) * 10;
      p.moveTo(sx, sy);
      p.lineTo(sx + sw, sy + 3);
      p.lineTo(sx + sw * 0.8, sy + 6);
      p.lineTo(sx - sw * 0.1, sy + 4);
      p.close();
      return p;
    }),
    opacity: useDerivedValue(() => 0.05 + Math.sin(t.value * Math.PI * 2 * 0.5 + i * 1.2) * 0.04),
  }));

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      {/* Sky gradient via overlapping circles */}
      <Circle cx={width / 2} cy={-50} r={height * 0.9} color="rgba(2,8,20,1)" />
      <Circle cx={width / 2} cy={height * 0.3} r={height * 0.6} color="rgba(3,12,28,0.95)" />

      {/* Stars */}
      {stars.map((s, i) => (
        <Circle key={i} cx={s.x} cy={s.y} r={s.r} color="rgba(220,230,255,1)" opacity={s.opacity} />
      ))}

      {/* Aurora band 4 - magenta/purple hint */}
      <Path path={band4} color="rgba(160,40,200,0.06)" />

      {/* Aurora band 1 - teal/green (main) */}
      <Path path={band1} color="rgba(30,200,120,0.13)" />
      <Path path={band1} color="rgba(77,217,172,0.08)" />

      {/* Aurora band 2 - cyan */}
      <Path path={band2} color="rgba(0,180,200,0.10)" />
      <Path path={band2} color="rgba(100,240,200,0.06)" />

      {/* Aurora band 3 - green/yellow */}
      <Path path={band3} color="rgba(60,220,100,0.09)" />
      <Path path={band3} color="rgba(150,255,100,0.04)" />

      {/* Arctic ground - deep dark blue */}
      <Path path={ground} color="rgba(4,14,32,1)" />

      {/* Snow highlight on ground edge */}
      <Path path={ground} color="rgba(180,210,255,0.06)" style="stroke" strokeWidth={1.5} />

      {/* Pine trees */}
      {trees.map((tree, i) => (
        <Path key={i} path={tree} color="rgba(3,10,22,1)" />
      ))}

      {/* Aurora shimmer reflections on snow */}
      {shimmer.map((s, i) => (
        <Path key={i} path={s.path} color="rgba(77,217,172,1)" opacity={s.opacity} />
      ))}
    </Canvas>
  );
}