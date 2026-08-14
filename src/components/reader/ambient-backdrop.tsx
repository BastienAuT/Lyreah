"use client";

import { useEffect, useRef } from "react";
import { isVisualEffect, type VisualEffect } from "@/audio/effects";

type AmbientEffect = VisualEffect;
type ReaderTheme = "paper" | "sepia" | "night";
type Rgb = readonly [number, number, number];
type PageBounds = { left: number; right: number };

type ThemePalette = {
  firefly: { core: Rgb; glow: Rgb; haze: Rgb; moon: Rgb; strength: number };
  rain: { line: Rgb; haze: Rgb; shine: Rgb; strength: number };
  mist: { first: Rgb; second: Rgb; light: Rgb; strength: number };
};

type MarinePalette = {
  deep: Rgb;
  foam: Rgb;
  glow: Rgb;
  signal: Rgb;
  water: Rgb;
};

type StormPalette = {
  cloud: Rgb;
  flash: Rgb;
  glow: Rgb;
  shadow: Rgb;
};

const PALETTES: Record<ReaderTheme, ThemePalette> = {
  paper: {
    firefly: {
      core: [255, 248, 204],
      glow: [224, 174, 76],
      haze: [244, 211, 142],
      moon: [179, 193, 220],
      strength: 0.82,
    },
    rain: {
      line: [116, 151, 176],
      haze: [190, 211, 220],
      shine: [225, 236, 239],
      strength: 0.62,
    },
    mist: {
      first: [210, 228, 221],
      second: [230, 207, 218],
      light: [248, 239, 228],
      strength: 0.92,
    },
  },
  sepia: {
    firefly: {
      core: [255, 235, 178],
      glow: [194, 132, 50],
      haze: [215, 169, 101],
      moon: [164, 149, 164],
      strength: 0.74,
    },
    rain: {
      line: [127, 119, 107],
      haze: [186, 174, 151],
      shine: [226, 214, 190],
      strength: 0.5,
    },
    mist: {
      first: [219, 203, 171],
      second: [203, 181, 158],
      light: [241, 225, 196],
      strength: 0.82,
    },
  },
  night: {
    firefly: {
      core: [255, 241, 176],
      glow: [223, 179, 82],
      haze: [154, 133, 91],
      moon: [120, 139, 184],
      strength: 0.95,
    },
    rain: {
      line: [132, 158, 189],
      haze: [81, 102, 130],
      shine: [182, 197, 221],
      strength: 0.7,
    },
    mist: {
      first: [91, 111, 126],
      second: [117, 92, 121],
      light: [151, 141, 166],
      strength: 0.9,
    },
  },
};

const MARINE_PALETTES: Record<ReaderTheme, MarinePalette> = {
  paper: {
    deep: [43, 86, 105],
    foam: [226, 243, 239],
    glow: [142, 205, 203],
    signal: [210, 118, 86],
    water: [74, 142, 158],
  },
  sepia: {
    deep: [77, 94, 91],
    foam: [239, 223, 191],
    glow: [158, 183, 166],
    signal: [179, 99, 70],
    water: [97, 134, 137],
  },
  night: {
    deep: [8, 35, 49],
    foam: [169, 210, 211],
    glow: [49, 139, 151],
    signal: [222, 83, 68],
    water: [22, 86, 105],
  },
};

const STORM_PALETTES: Record<ReaderTheme, StormPalette> = {
  paper: {
    cloud: [94, 92, 112],
    flash: [242, 238, 255],
    glow: [155, 143, 184],
    shadow: [43, 39, 57],
  },
  sepia: {
    cloud: [105, 91, 82],
    flash: [255, 236, 191],
    glow: [159, 123, 110],
    shadow: [53, 42, 42],
  },
  night: {
    cloud: [59, 57, 77],
    flash: [215, 217, 255],
    glow: [103, 86, 147],
    shadow: [14, 12, 23],
  },
};

type Particle = {
  depth: number;
  drift: number;
  phase: number;
  side: -1 | 1;
  size: number;
  speed: number;
  x: number;
  y: number;
};

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

function createParticles(count: number, seed: number): Particle[] {
  const random = seededRandom(seed);
  return Array.from({ length: count }, () => ({
    depth: 0.35 + random() * 0.65,
    drift: 0.5 + random() * 1.4,
    phase: random() * Math.PI * 2,
    side: random() > 0.5 ? 1 : -1,
    size: 0.55 + random() * 1.35,
    speed: 0.4 + random() * 0.9,
    x: random(),
    y: random(),
  }));
}

function rgba(color: Rgb, alpha: number) {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function readTheme(): ReaderTheme {
  const value = document.documentElement.dataset.readerTheme;
  return value === "sepia" || value === "night" ? value : "paper";
}

function readEffect(): AmbientEffect {
  const value = document.documentElement.dataset.soundscapeEffect;
  return isVisualEffect(value) ? value : "none";
}

function readEffectsIntensity() {
  const value = Number(document.documentElement.dataset.soundscapeIntensity);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.72;
}

function createFogNoise() {
  const noiseCanvas = document.createElement("canvas");
  const size = 96;
  noiseCanvas.width = size;
  noiseCanvas.height = size;
  const noiseContext = noiseCanvas.getContext("2d");
  if (!noiseContext) return null;
  const image = noiseContext.createImageData(size, size);
  const random = seededRandom(0x666f6767);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const wave =
        Math.sin(x * 0.17 + Math.sin(y * 0.09) * 2) * 0.34 +
        Math.sin(y * 0.13 + x * 0.04) * 0.28 +
        (random() - 0.5) * 0.38;
      const opacity = Math.round(18 + (wave + 1) * 12);
      image.data[index] = 255;
      image.data[index + 1] = 255;
      image.data[index + 2] = 255;
      image.data[index + 3] = opacity;
    }
  }

  noiseContext.putImageData(image, 0, 0);
  return noiseCanvas;
}

export function AmbientBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    const containerElement = canvasElement.parentElement;
    if (!containerElement) return;
    const contextElement = canvasElement.getContext("2d", { alpha: true });
    if (!contextElement) return;
    const canvas: HTMLCanvasElement = canvasElement;
    const container: HTMLElement = containerElement;
    const context: CanvasRenderingContext2D = contextElement;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fireflies = createParticles(22, 0x6c797265);
    const stars = createParticles(30, 0x73746172);
    const rain = createParticles(168, 0x7261696e);
    const bubbles = createParticles(36, 0x62756262);
    const harborLights = createParticles(14, 0x68617262);
    const fogNoise = createFogNoise();
    let width = 0;
    let height = 0;
    let frameId = 0;
    let lastFrame = performance.now();
    let effectStartedAt = lastFrame;
    let intensity = 0;
    let currentEffect: AmbientEffect = "none";
    let requestedEffect = readEffect();
    let isPlaying = document.documentElement.dataset.soundscapePlaying === "true";
    let theme = readTheme();
    let effectsIntensity = readEffectsIntensity();
    let performanceMode =
      document.documentElement.dataset.soundscapePerformance === "true";

    function resize() {
      width = container.clientWidth;
      height = container.clientHeight;
      const ratio = performanceMode
        ? 1
        : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    function pageBounds() {
      const viewer = container.querySelector<HTMLElement>(".epub-reader");
      if (!viewer) return { left: width * 0.3, right: width * 0.7 };
      const viewerRect = viewer.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      return {
        left: Math.max(0, viewerRect.left - containerRect.left),
        right: Math.min(width, viewerRect.right - containerRect.left),
      };
    }

    function sidePosition(
      particle: Particle,
      bounds: PageBounds,
      margin = 20,
    ) {
      if (particle.side < 0) {
        const available = Math.max(0, bounds.left - margin * 2);
        return margin + particle.x * available;
      }
      const available = Math.max(0, width - bounds.right - margin * 2);
      return bounds.right + margin + particle.x * available;
    }

    function drawSideHaze(
      color: Rgb,
      elapsed: number,
      alpha: number,
      bounds: PageBounds,
    ) {
      const sway = Math.sin(elapsed * 0.00016) * 18;
      const radius = Math.max(140, width * 0.2);
      const centers = [bounds.left * 0.38 + sway, bounds.right + (width - bounds.right) * 0.62 - sway];

      centers.forEach((x, index) => {
        const y = height * (index ? 0.63 : 0.36);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, rgba(color, alpha));
        gradient.addColorStop(0.48, rgba(color, alpha * 0.36));
        gradient.addColorStop(1, rgba(color, 0));
        context.fillStyle = gradient;
        context.fillRect(0, 0, width, height);
      });
    }

    function drawClearingLight(
      elapsed: number,
      palette: ThemePalette,
      bounds: PageBounds,
    ) {
      const breathing = 0.82 + Math.sin(elapsed * 0.00042) * 0.18;
      const centers = [
        { x: bounds.left * 0.34, y: height * 0.42 },
        { x: bounds.right + (width - bounds.right) * 0.66, y: height * 0.58 },
      ];

      centers.forEach(({ x, y }, index) => {
        const sideWidth = index === 0 ? bounds.left : width - bounds.right;
        if (sideWidth < 24) return;
        const radius = Math.max(150, sideWidth * 1.22);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        const alpha = intensity * breathing * (theme === "night" ? 0.22 : 0.16);
        gradient.addColorStop(0, rgba(palette.firefly.haze, alpha));
        gradient.addColorStop(0.42, rgba(palette.firefly.glow, alpha * 0.42));
        gradient.addColorStop(1, rgba(palette.firefly.glow, 0));
        context.fillStyle = gradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      });

      const coolVeil = context.createLinearGradient(0, 0, width, height);
      coolVeil.addColorStop(0, rgba(palette.firefly.moon, intensity * 0.1));
      coolVeil.addColorStop(0.34, rgba(palette.firefly.moon, 0));
      coolVeil.addColorStop(0.66, rgba(palette.firefly.moon, 0));
      coolVeil.addColorStop(1, rgba(palette.firefly.moon, intensity * 0.085));
      context.fillStyle = coolVeil;
      context.fillRect(0, 0, width, height);
    }

    function drawMistLight(
      elapsed: number,
      palette: ThemePalette,
      bounds: PageBounds,
    ) {
      const breathing = 0.84 + Math.sin(elapsed * 0.00028) * 0.16;
      const sources = [
        { x: -20, y: height * 0.28, limit: bounds.left },
        { x: width + 20, y: height * 0.7, limit: width - bounds.right },
      ];

      sources.forEach(({ x, y, limit }, index) => {
        if (limit < 24) return;
        const radius = Math.max(260, limit * 1.75);
        const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
        const alpha =
          intensity * breathing * (theme === "night" ? 0.3 : theme === "sepia" ? 0.2 : 0.24);
        const color = index === 0 ? palette.mist.light : palette.mist.second;
        gradient.addColorStop(0, rgba(color, alpha));
        gradient.addColorStop(0.3, rgba(color, alpha * 0.72));
        gradient.addColorStop(0.72, rgba(color, alpha * 0.18));
        gradient.addColorStop(1, rgba(color, 0));
        context.fillStyle = gradient;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      });
    }

    function drawFireflies(elapsed: number, palette: ThemePalette) {
      const bounds = pageBounds();
      drawClearingLight(elapsed, palette, bounds);
      drawSideHaze(palette.firefly.haze, elapsed, intensity * 0.13, bounds);
      const mobileFactor = width < 760 ? 0.55 : 1;

      fireflies.forEach((particle, index) => {
        if ((width < 760 && index > 4) || (performanceMode && index % 2)) return;
        const time = elapsed * 0.00011 * particle.speed;
        const x =
          sidePosition(particle, bounds, 28) +
          Math.sin(time * 1.3 + particle.phase) * 10 * particle.drift;
        const y =
          particle.y * height +
          Math.cos(time + particle.phase * 0.8) * 14 * particle.drift;
        const pulse =
          0.22 +
          Math.pow((Math.sin(time * 3.1 + particle.phase) + 1) / 2, 3) * 0.78;
        const radius = (2.5 + particle.size * 3.6) * particle.depth;
        const alpha =
          intensity *
          palette.firefly.strength *
          pulse *
          particle.depth *
          mobileFactor *
          1.2;
        if (alpha < 0.01) return;

        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, rgba(palette.firefly.core, alpha * 0.95));
        glow.addColorStop(0.22, rgba(palette.firefly.glow, alpha * 0.55));
        glow.addColorStop(0.56, rgba(palette.firefly.glow, alpha * 0.12));
        glow.addColorStop(1, rgba(palette.firefly.glow, 0));
        context.fillStyle = glow;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();

        context.fillStyle = rgba(palette.firefly.core, alpha * 0.9);
        context.beginPath();
        context.arc(x, y, Math.max(1, particle.size * 1.12), 0, Math.PI * 2);
        context.fill();
      });

      stars.forEach((star, index) => {
        if ((width < 760 && index > 7) || (performanceMode && index % 2)) return;
        const x = sidePosition(star, bounds, 16);
        const y = star.y * height;
        const twinkle = 0.25 + ((Math.sin(elapsed * 0.00045 * star.speed + star.phase) + 1) / 2) * 0.75;
        const alpha = intensity * twinkle * 0.2 * star.depth;
        context.fillStyle = rgba(palette.firefly.moon, alpha);
        context.beginPath();
        context.arc(x, y, 0.45 + star.size * 0.35, 0, Math.PI * 2);
        context.fill();
      });
    }

    function drawRain(elapsed: number, palette: ThemePalette) {
      const bounds = pageBounds();
      drawSideHaze(palette.rain.haze, elapsed, intensity * 0.07, bounds);
      context.lineCap = "round";
      const mobileFactor = width < 760 ? 0.56 : 1;

      rain.forEach((drop, index) => {
        if ((width < 760 && index % 2) || (performanceMode && index % 2)) return;
        const travel = (drop.y + elapsed * 0.00034 * drop.speed) % 1.12;
        const x = sidePosition(drop, bounds, 12) + Math.sin(drop.phase) * 8;
        const y = travel * (height + 90) - 45;
        const length = (16 + drop.depth * 28) * mobileFactor;
        const alpha = intensity * palette.rain.strength * drop.depth * 0.72;
        const gradient = context.createLinearGradient(x, y, x - 4, y + length);
        gradient.addColorStop(0, rgba(palette.rain.shine, 0));
        gradient.addColorStop(0.35, rgba(palette.rain.shine, alpha * 0.75));
        gradient.addColorStop(1, rgba(palette.rain.line, alpha));
        context.strokeStyle = gradient;
        context.lineWidth = 0.45 + drop.depth * 0.75;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - 4 - drop.depth * 3, y + length);
        context.stroke();
      });
    }

    function drawMist(elapsed: number, palette: ThemePalette, breeze: boolean) {
      const bounds = pageBounds();
      const mobileFactor = width < 760 ? 0.5 : 1;
      drawMistLight(elapsed, palette, bounds);
      drawSideHaze(palette.mist.first, elapsed, intensity * 0.16, bounds);
      const regions = [
        { left: 0, width: bounds.left },
        { left: bounds.right, width: width - bounds.right },
      ];
      const layers = [
        { duration: breeze ? 22_000 : 28_000, offset: 0.08, opacity: 0.24, y: 0.3 },
        { duration: breeze ? 29_000 : 36_000, offset: 0.47, opacity: 0.19, y: 0.58 },
        { duration: breeze ? 36_000 : 43_000, offset: 0.76, opacity: 0.15, y: 0.78 },
      ];

      context.save();
      context.beginPath();
      regions.forEach((region) => context.rect(region.left, 0, region.width, height));
      context.clip();
      context.globalCompositeOperation = theme === "night" ? "screen" : "source-over";
      context.filter = `blur(${performanceMode ? 14 : 26}px)`;

      regions.forEach((region, regionIndex) => {
        if (region.width < 24) return;

        layers.forEach((layer, layerIndex) => {
          const phase = (elapsed / layer.duration + layer.offset + regionIndex * 0.31) % 1;
          const radiusX = Math.max(130, region.width * (0.76 + layerIndex * 0.12));
          const radiusY = Math.max(110, height * (0.23 + layerIndex * 0.035));
          const travel = region.width + radiusX * 2;
          const centerX = region.left - radiusX + phase * travel;
          const centerY = height * layer.y + Math.sin(elapsed * 0.00012 + layerIndex) * 22;
          const pulse = 0.84 + Math.sin(elapsed * 0.00024 + layerIndex * 1.7) * 0.16;
          const color = layerIndex === 1 ? palette.mist.second : palette.mist.first;
          const alpha =
            intensity *
            palette.mist.strength *
            layer.opacity *
            pulse *
            mobileFactor;

          [-travel, 0, travel].forEach((shift) => {
            context.save();
            context.translate(centerX + shift, centerY);
            context.scale(radiusX, radiusY);
            const gradient = context.createRadialGradient(0, 0, 0, 0, 0, 1);
            gradient.addColorStop(0, rgba(palette.mist.light, alpha));
            gradient.addColorStop(0.38, rgba(color, alpha * 0.82));
            gradient.addColorStop(0.74, rgba(color, alpha * 0.3));
            gradient.addColorStop(1, rgba(color, 0));
            context.fillStyle = gradient;
            context.beginPath();
            context.arc(0, 0, 1, 0, Math.PI * 2);
            context.fill();
            context.restore();
          });
        });
      });

      context.restore();

      if (fogNoise) {
        const pattern = context.createPattern(fogNoise, "repeat");
        if (pattern) {
          context.save();
          context.beginPath();
          regions.forEach((region) =>
            context.rect(region.left, 0, region.width, height),
          );
          context.clip();
          context.globalAlpha =
            effectsIntensity * intensity * 0.28 * mobileFactor;
          context.translate((elapsed * 0.004) % 96, (elapsed * 0.0015) % 96);
          context.fillStyle = pattern;
          context.fillRect(-96, -96, width + 192, height + 192);
          context.restore();
        }
      }
    }

    function softenAroundBook(bounds: PageBounds) {
      const feather = Math.min(132, Math.max(56, width * 0.065));
      const leftOpaque = Math.max(0, bounds.left - feather);
      const leftTransparent = Math.min(width, bounds.left);
      const rightTransparent = Math.max(0, bounds.right);
      const rightOpaque = Math.min(width, bounds.right + feather);
      const mask = context.createLinearGradient(0, 0, width, 0);

      mask.addColorStop(0, "rgba(255, 255, 255, 1)");
      mask.addColorStop(leftOpaque / width, "rgba(255, 255, 255, 1)");
      mask.addColorStop(leftTransparent / width, "rgba(255, 255, 255, 0)");
      mask.addColorStop(rightTransparent / width, "rgba(255, 255, 255, 0)");
      mask.addColorStop(rightOpaque / width, "rgba(255, 255, 255, 1)");
      mask.addColorStop(1, "rgba(255, 255, 255, 1)");

      context.save();
      context.globalAlpha = 1;
      context.globalCompositeOperation = "destination-in";
      context.fillStyle = mask;
      context.fillRect(0, 0, width, height);
      context.restore();
    }

    function drawHarbor(elapsed: number, palette: MarinePalette) {
      const bounds = pageBounds();
      context.save();

      const sea = context.createLinearGradient(0, height * 0.3, 0, height);
      sea.addColorStop(0, rgba(palette.glow, intensity * 0.08));
      sea.addColorStop(0.48, rgba(palette.water, intensity * 0.2));
      sea.addColorStop(1, rgba(palette.deep, intensity * 0.34));
      context.fillStyle = sea;
      context.fillRect(0, 0, width, height);

      const horizon = height * 0.51;
      context.strokeStyle = rgba(palette.foam, intensity * 0.22);
      context.lineWidth = 0.8;
      context.beginPath();
      context.moveTo(0, horizon);
      context.lineTo(width, horizon);
      context.stroke();

      const lineCount = performanceMode ? 5 : 9;
      for (let line = 0; line < lineCount; line += 1) {
        const y = height * (0.55 + line * 0.044);
        const amplitude = 3.8 + line * 0.9;
        context.strokeStyle = rgba(
          line % 2 ? palette.water : palette.foam,
          intensity * (0.16 + line * 0.014),
        );
        context.lineWidth = 0.9 + line * 0.09;
        context.beginPath();
        for (let x = -24; x <= width + 24; x += 18) {
          const waveY =
            y +
            Math.sin(x * 0.018 + elapsed * 0.00028 + line * 0.9) * amplitude +
            Math.sin(x * 0.041 - elapsed * 0.00016) * 1.4;
          if (x === -24) context.moveTo(x, waveY);
          else context.lineTo(x, waveY);
        }
        context.stroke();
      }

      harborLights.forEach((light, index) => {
        if (performanceMode && index % 2) return;
        const x = sidePosition(light, bounds, 22);
        const y = height * (0.46 + light.y * 0.08);
        const pulse = 0.62 + Math.sin(elapsed * 0.0006 + light.phase) * 0.28;
        const radius = 7 + light.size * 6;
        const glow = context.createRadialGradient(x, y, 0, x, y, radius);
        glow.addColorStop(0, rgba(palette.foam, intensity * pulse * 0.62));
        glow.addColorStop(1, rgba(palette.glow, 0));
        context.fillStyle = glow;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);

        const reflection = context.createLinearGradient(x, y + 3, x, y + 62);
        reflection.addColorStop(0, rgba(palette.foam, intensity * pulse * 0.3));
        reflection.addColorStop(1, rgba(palette.glow, 0));
        context.fillStyle = reflection;
        context.fillRect(x - 1.2, y + 3, 2.4, 62);
      });

      const dockRegions = [
        { left: 0, width: bounds.left },
        { left: bounds.right, width: width - bounds.right },
      ];
      context.fillStyle = rgba(palette.deep, intensity * 0.32);
      dockRegions.forEach((region, regionIndex) => {
        if (region.width < 50) return;
        const dockY = height * (regionIndex ? 0.49 : 0.52);
        context.fillRect(region.left, dockY, region.width, 3);
        const spacing = Math.max(58, region.width / 4);
        for (let x = region.left + spacing * 0.55; x < region.left + region.width; x += spacing) {
          context.fillRect(x, dockY - 13, 2.5, 46);
        }
      });

      const fog = context.createLinearGradient(0, 0, width, 0);
      fog.addColorStop(0, rgba(palette.foam, intensity * 0.2));
      fog.addColorStop(0.23, rgba(palette.foam, 0));
      fog.addColorStop(0.77, rgba(palette.foam, 0));
      fog.addColorStop(1, rgba(palette.foam, intensity * 0.18));
      context.fillStyle = fog;
      context.fillRect(0, 0, width, height * 0.64);
      context.restore();
    }

    function drawUnderwater(elapsed: number, palette: MarinePalette) {
      const bounds = pageBounds();
      context.save();

      const depth = context.createLinearGradient(0, 0, 0, height);
      depth.addColorStop(0, rgba(palette.glow, intensity * 0.3));
      depth.addColorStop(0.48, rgba(palette.water, intensity * 0.38));
      depth.addColorStop(1, rgba(palette.deep, intensity * 0.54));
      context.fillStyle = depth;
      context.fillRect(0, 0, width, height);

      const rays = performanceMode ? 4 : 7;
      for (let ray = 0; ray < rays; ray += 1) {
        const sway = Math.sin(elapsed * 0.00012 + ray * 1.4) * 34;
        const originX = ray % 2 ? width + sway : sway;
        const spread = 70 + ray * 22;
        const gradient = context.createLinearGradient(originX, 0, originX, height * 0.8);
        gradient.addColorStop(0, rgba(palette.foam, intensity * 0.3));
        gradient.addColorStop(1, rgba(palette.glow, 0));
        context.fillStyle = gradient;
        context.beginPath();
        context.moveTo(originX - 18, 0);
        context.lineTo(originX + 18, 0);
        context.lineTo(originX + (ray % 2 ? -spread : spread), height * 0.86);
        context.lineTo(originX + (ray % 2 ? -spread - 80 : spread + 80), height * 0.86);
        context.closePath();
        context.fill();
      }

      context.lineCap = "round";
      for (let caustic = 0; caustic < (performanceMode ? 4 : 7); caustic += 1) {
        const y = height * (0.12 + caustic * 0.045);
        context.strokeStyle = rgba(
          palette.foam,
          intensity * (0.17 - caustic * 0.012),
        );
        context.lineWidth = 1.1;
        context.beginPath();
        for (let x = -30; x <= width + 30; x += 16) {
          const waveY =
            y +
            Math.sin(x * 0.024 + elapsed * 0.00024 + caustic) * 7 +
            Math.sin(x * 0.051 - elapsed * 0.00015) * 2;
          if (x === -30) context.moveTo(x, waveY);
          else context.lineTo(x, waveY);
        }
        context.stroke();
      }

      bubbles.forEach((bubble, index) => {
        if ((width < 760 && index % 2) || (performanceMode && index % 2)) return;
        const travel = (bubble.y - elapsed * 0.000035 * bubble.speed + 1.4) % 1.15;
        const x =
          sidePosition(bubble, bounds, 20) +
          Math.sin(elapsed * 0.00035 + bubble.phase) * 8 * bubble.drift;
        const y = height * (1.08 - travel);
        const radius = 1.8 + bubble.size * 2.25;
        context.strokeStyle = rgba(palette.foam, intensity * bubble.depth * 0.64);
        context.lineWidth = 0.8;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.stroke();
      });

      context.restore();
    }

    function drawSubmarine(elapsed: number, palette: MarinePalette) {
      const bounds = pageBounds();
      context.save();

      const interior = context.createLinearGradient(0, 0, width, height);
      interior.addColorStop(0, rgba(palette.deep, intensity * 0.54));
      interior.addColorStop(0.5, rgba(palette.water, intensity * 0.18));
      interior.addColorStop(1, rgba(palette.deep, intensity * 0.58));
      context.fillStyle = interior;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = rgba(palette.foam, intensity * 0.15);
      context.lineWidth = 1;
      for (let seam = height * 0.18; seam < height; seam += height * 0.22) {
        context.beginPath();
        context.moveTo(0, seam);
        context.lineTo(width, seam);
        context.stroke();
      }

      const centers = [
        { x: Math.max(40, bounds.left * 0.44), y: height * 0.54 },
        { x: bounds.right + Math.max(40, (width - bounds.right) * 0.56), y: height * 0.54 },
      ];
      const sweep = elapsed * 0.00023;
      centers.forEach(({ x, y }, side) => {
        const radius = Math.max(45, Math.min(side ? width - bounds.right : bounds.left, 170));
        const radarGlow = context.createRadialGradient(x, y, 0, x, y, radius * 1.12);
        radarGlow.addColorStop(0, rgba(palette.glow, intensity * 0.18));
        radarGlow.addColorStop(0.7, rgba(palette.glow, intensity * 0.06));
        radarGlow.addColorStop(1, rgba(palette.deep, 0));
        context.fillStyle = radarGlow;
        context.fillRect(
          x - radius * 1.12,
          y - radius * 1.12,
          radius * 2.24,
          radius * 2.24,
        );

        context.strokeStyle = rgba(palette.glow, intensity * 0.4);
        context.lineWidth = 1;
        for (let ring = 1; ring <= 3; ring += 1) {
          context.beginPath();
          context.arc(x, y, (radius * ring) / 3, 0, Math.PI * 2);
          context.stroke();
        }

        const sweepAngle = sweep + side * Math.PI;
        context.fillStyle = rgba(palette.glow, intensity * 0.14);
        context.beginPath();
        context.moveTo(x, y);
        context.arc(x, y, radius, sweepAngle - 0.22, sweepAngle + 0.035);
        context.closePath();
        context.fill();

        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(
          x + Math.cos(sweepAngle) * radius,
          y + Math.sin(sweepAngle) * radius,
        );
        context.strokeStyle = rgba(palette.foam, intensity * 0.7);
        context.lineWidth = 1.4;
        context.stroke();
      });

      const beacon = Math.pow((Math.sin(elapsed * 0.0014) + 1) / 2, 7);
      centers.forEach(({ x, y }) => {
        const glow = context.createRadialGradient(x, y, 0, x, y, 58);
        glow.addColorStop(0, rgba(palette.signal, intensity * beacon * 0.76));
        glow.addColorStop(0.22, rgba(palette.signal, intensity * beacon * 0.38));
        glow.addColorStop(1, rgba(palette.signal, 0));
        context.fillStyle = glow;
        context.fillRect(x - 58, y - 58, 116, 116);
      });

      context.fillStyle = rgba(palette.foam, intensity * 0.34);
      for (let y = 42; y < height; y += 76) {
        context.beginPath();
        context.arc(18, y, 1.8, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.arc(width - 18, y + 28, 1.8, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }

    function drawStorm(elapsed: number, palette: StormPalette) {
      const bounds = pageBounds();
      context.save();

      const darkness = context.createLinearGradient(0, 0, 0, height);
      darkness.addColorStop(0, rgba(palette.cloud, intensity * 0.44));
      darkness.addColorStop(1, rgba(palette.shadow, intensity * 0.62));
      context.fillStyle = darkness;
      context.fillRect(0, 0, width, height);

      context.filter = `blur(${performanceMode ? 18 : 30}px)`;
      for (let cloud = 0; cloud < (performanceMode ? 5 : 9); cloud += 1) {
        const side = cloud % 2 ? 1 : -1;
        const sideWidth = side < 0 ? bounds.left : width - bounds.right;
        const xBase = side < 0 ? 0 : bounds.right;
        const x =
          xBase +
          ((elapsed * (0.003 + cloud * 0.0002) + cloud * 97) % Math.max(80, sideWidth));
        const y = height * (0.12 + (cloud % 4) * 0.16);
        const radius = 95 + (cloud % 3) * 34;
        const cloudGlow = context.createRadialGradient(x, y, 0, x, y, radius);
        cloudGlow.addColorStop(0, rgba(palette.cloud, intensity * 0.34));
        cloudGlow.addColorStop(1, rgba(palette.shadow, 0));
        context.fillStyle = cloudGlow;
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      }
      context.filter = "none";

      context.lineCap = "round";
      rain.forEach((drop, index) => {
        if ((performanceMode && index % 3) || index % 2) return;
        const travel = (drop.y + elapsed * 0.00048 * drop.speed) % 1.1;
        const x = sidePosition(drop, bounds, 8) + Math.sin(drop.phase) * 9;
        const y = travel * (height + 110) - 55;
        const length = 24 + drop.depth * 34;
        context.strokeStyle = rgba(
          palette.flash,
          intensity * drop.depth * 0.28,
        );
        context.lineWidth = 0.7 + drop.depth * 0.65;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - 8, y + length);
        context.stroke();
      });

      const cycleDuration = 6_900;
      const cycle = elapsed % cycleDuration;
      const flash =
        cycle < 110
          ? 1 - cycle / 110
          : cycle > 190 && cycle < 310
            ? 0.62 * (1 - (cycle - 190) / 120)
            : 0;

      if (flash > 0.01) {
        context.fillStyle = rgba(palette.flash, intensity * flash * 0.4);
        context.fillRect(0, 0, width, height);

        const random = seededRandom(Math.floor(elapsed / cycleDuration) + 0x73746f72);
        const leftSide = random() > 0.5;
        const regionLeft = leftSide ? 12 : bounds.right + 12;
        const regionWidth = Math.max(24, leftSide ? bounds.left - 24 : width - bounds.right - 24);
        let x = regionLeft + random() * regionWidth;
        let y = -10;
        context.strokeStyle = rgba(palette.flash, intensity * flash * 0.96);
        context.lineWidth = 1.8;
        context.shadowBlur = 20;
        context.shadowColor = rgba(palette.glow, intensity * flash * 0.8);
        context.beginPath();
        context.moveTo(x, y);
        for (let segment = 0; segment < 7; segment += 1) {
          x += (random() - 0.5) * 28;
          y += height * (0.055 + random() * 0.025);
          context.lineTo(x, y);
        }
        context.stroke();
        context.shadowBlur = 0;
      }

      context.restore();
    }

    function render(now: number) {
      frameId = 0;
      if (document.hidden || reducedMotion.matches) {
        context.clearRect(0, 0, width, height);
        return;
      }

      const delta = Math.min(0.05, Math.max(0, (now - lastFrame) / 1_000));
      lastFrame = now;
      const changingEffect = requestedEffect !== currentEffect;
      const target = changingEffect ? 0 : isPlaying && currentEffect !== "none" ? 1 : 0;
      const easing = target > intensity ? 3 : 2.6;
      intensity += (target - intensity) * (1 - Math.exp(-delta * easing));

      if (changingEffect && intensity < 0.018) {
        currentEffect = requestedEffect;
        effectStartedAt = now;
      }

      context.clearRect(0, 0, width, height);
      context.globalAlpha = effectsIntensity;
      const palette = PALETTES[theme];
      const marinePalette = MARINE_PALETTES[theme];
      const stormPalette = STORM_PALETTES[theme];
      const elapsed = now - effectStartedAt;
      if (currentEffect === "fireflies") drawFireflies(elapsed, palette);
      if (currentEffect === "rain") drawRain(elapsed, palette);
      if (currentEffect === "mist" || currentEffect === "breeze") {
        drawMist(elapsed, palette, currentEffect === "breeze");
      }
      if (currentEffect === "harbor") drawHarbor(elapsed, marinePalette);
      if (currentEffect === "underwater") drawUnderwater(elapsed, marinePalette);
      if (currentEffect === "submarine") drawSubmarine(elapsed, marinePalette);
      if (currentEffect === "storm") drawStorm(elapsed, stormPalette);
      if (currentEffect !== "none") softenAroundBook(pageBounds());
      context.globalAlpha = 1;

      if (isPlaying || intensity > 0.002 || requestedEffect !== currentEffect) {
        frameId = requestAnimationFrame(render);
      }
    }

    function ensureAnimation() {
      if (!frameId && !document.hidden && !reducedMotion.matches) {
        lastFrame = performance.now();
        frameId = requestAnimationFrame(render);
      }
    }

    function syncState() {
      requestedEffect = readEffect();
      isPlaying = document.documentElement.dataset.soundscapePlaying === "true";
      theme = readTheme();
      effectsIntensity = readEffectsIntensity();
      const nextPerformanceMode =
        document.documentElement.dataset.soundscapePerformance === "true";
      if (nextPerformanceMode !== performanceMode) {
        performanceMode = nextPerformanceMode;
        resize();
      }
      ensureAnimation();
    }

    function handleVisibilityChange() {
      if (document.hidden && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
      } else {
        ensureAnimation();
      }
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const attributeObserver = new MutationObserver(syncState);
    attributeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [
        "data-reader-theme",
        "data-soundscape-effect",
        "data-soundscape-intensity",
        "data-soundscape-performance",
        "data-soundscape-playing",
      ],
    });
    reducedMotion.addEventListener("change", syncState);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    syncState();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      attributeObserver.disconnect();
      reducedMotion.removeEventListener("change", syncState);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return <canvas aria-hidden="true" className="ambient-backdrop" ref={canvasRef} />;
}
