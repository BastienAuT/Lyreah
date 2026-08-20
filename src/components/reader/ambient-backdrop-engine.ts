"use client";

import { useEffect, type RefObject } from "react";
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

const SCENE_COLORS = {
  bird: [40, 45, 53],
  dawnGlow: [246, 188, 128],
  dawnSky: [157, 190, 205],
  dawnTree: [55, 65, 57],
  dawnTreeFar: [91, 106, 91],
  ember: [255, 189, 70],
  fireBright: [255, 236, 151],
  fireDeep: [184, 58, 28],
  fireGlow: [245, 119, 46],
  fieldFar: [28, 57, 43],
  fieldGrass: [43, 82, 51],
  fieldSky: [8, 18, 34],
  forestDeep: [5, 13, 15],
  forestLeaf: [17, 38, 30],
  forestMist: [48, 71, 67],
  forestTrunk: [10, 24, 21],
  foam: [235, 246, 238],
  driftwood: [91, 61, 40],
  oldBone: [218, 208, 176],
  palmLeaf: [24, 79, 62],
  palmTrunk: [112, 78, 48],
  rainCurtain: [62, 72, 88],
  rainFrame: [45, 48, 58],
  rainGlass: [92, 123, 145],
  rainRoom: [54, 49, 60],
  sand: [194, 157, 111],
  sandLight: [224, 195, 151],
  seaDeep: [35, 105, 119],
  seaLight: [92, 165, 163],
  smoke: [184, 174, 166],
  stone: [122, 103, 91],
  stoneLight: [165, 143, 123],
  submarineDark: [7, 24, 30],
  submarineMetal: [47, 72, 75],
  submarinePanel: [18, 42, 45],
  submarineSonar: [78, 226, 177],
  trainBrass: [184, 137, 74],
  trainCabin: [40, 24, 28],
  trainNight: [13, 23, 39],
  trainUpholstery: [91, 39, 43],
  zombieBlood: [116, 27, 35],
  zombieFog: [102, 119, 91],
  zombieMoon: [210, 203, 156],
  zombieSkin: [91, 113, 75],
  zombieSky: [28, 24, 35],
  lofiDesk: [96, 58, 58],
  lofiHair: [48, 37, 57],
  lofiLamp: [255, 192, 112],
  lofiNight: [31, 42, 74],
  lofiRoom: [112, 70, 91],
  lofiSweater: [184, 100, 99],
  waterNight: [19, 58, 74],
  windowLight: [185, 207, 217],
} satisfies Record<string, Rgb>;

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

export function useAmbientBackdropEngine(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
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
    const fireflies = createParticles(52, 0x6c797265);
    const stars = createParticles(30, 0x73746172);
    const rain = createParticles(168, 0x7261696e);
    const birds = createParticles(18, 0x62697264);
    const bubbles = createParticles(36, 0x62756262);
    const fish = createParticles(24, 0x66697368);
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
      const viewer = container.querySelector<HTMLElement>(".epub-reader__viewer");
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

    function sideRegions(bounds: PageBounds, inset = 0) {
      return [
        {
          left: inset,
          side: -1 as const,
          width: Math.max(0, bounds.left - inset * 2),
        },
        {
          left: bounds.right + inset,
          side: 1 as const,
          width: Math.max(0, width - bounds.right - inset * 2),
        },
      ];
    }

    function clipToSides(bounds: PageBounds, bookGap = 0) {
      context.beginPath();
      context.rect(0, 0, Math.max(0, bounds.left - bookGap), height);
      context.rect(
        Math.min(width, bounds.right + bookGap),
        0,
        Math.max(0, width - bounds.right - bookGap),
        height,
      );
      context.clip();
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
      const regions = sideRegions(bounds);
      const mobileFactor = width < 760 ? 0.55 : 1;

      context.save();
      clipToSides(bounds);
      const night = context.createLinearGradient(0, 0, 0, height);
      night.addColorStop(0, rgba(SCENE_COLORS.fieldSky, intensity * 0.98));
      night.addColorStop(0.56, rgba(SCENE_COLORS.forestMist, intensity * 0.76));
      night.addColorStop(1, rgba(SCENE_COLORS.fieldFar, intensity * 0.96));
      context.fillStyle = night;
      context.fillRect(0, 0, width, height);

      regions.forEach((region, regionIndex) => {
        if (region.width < 18) return;
        const moonX = region.left + region.width * (regionIndex ? 0.28 : 0.72);
        const moonY = height * 0.18;
        const moonRadius = Math.min(150, Math.max(70, region.width * 0.72));
        const moon = context.createRadialGradient(
          moonX,
          moonY,
          0,
          moonX,
          moonY,
          moonRadius,
        );
        moon.addColorStop(0, rgba(palette.firefly.moon, intensity * 0.2));
        moon.addColorStop(1, rgba(palette.firefly.moon, 0));
        context.fillStyle = moon;
        context.fillRect(
          moonX - moonRadius,
          moonY - moonRadius,
          moonRadius * 2,
          moonRadius * 2,
        );

        const horizon = height * 0.57;
        const field = context.createLinearGradient(0, horizon, 0, height);
        field.addColorStop(0, rgba(SCENE_COLORS.fieldFar, intensity * 0.92));
        field.addColorStop(1, rgba(SCENE_COLORS.forestDeep, intensity));
        context.fillStyle = field;
        context.fillRect(region.left, horizon, region.width, height - horizon);

        context.fillStyle = rgba(SCENE_COLORS.forestLeaf, intensity * 0.84);
        context.beginPath();
        context.moveTo(region.left, horizon + 11);
        for (let x = region.left; x <= region.left + region.width + 12; x += 14) {
          const canopyY =
            horizon - 7 - Math.abs(Math.sin(x * 0.047 + regionIndex)) * 13;
          context.lineTo(x, canopyY);
        }
        context.lineTo(region.left + region.width, horizon + 18);
        context.closePath();
        context.fill();

        if (region.width > 82) {
          const treeX =
            region.left + region.width * (regionIndex === 0 ? 0.08 : 0.92);
          const crownY = height * 0.24;
          context.strokeStyle = rgba(SCENE_COLORS.forestTrunk, intensity * 0.92);
          context.lineCap = "round";
          context.lineWidth = Math.max(4, region.width * 0.035);
          context.beginPath();
          context.moveTo(treeX, height);
          context.quadraticCurveTo(treeX + (regionIndex ? -10 : 10), height * 0.55, treeX, crownY);
          context.stroke();
          context.fillStyle = rgba(SCENE_COLORS.forestLeaf, intensity * 0.9);
          for (let cluster = 0; cluster < 5; cluster += 1) {
            context.beginPath();
            context.arc(
              treeX + (cluster - 2) * 14,
              crownY + Math.abs(cluster - 2) * 5,
              25 + (cluster % 2) * 7,
              0,
              Math.PI * 2,
            );
            context.fill();
          }
        }

        // A layered grove and low shrubs make the clearing feel inhabited,
        // while keeping the brighter center open for the fireflies.
        const groveCount = performanceMode ? 3 : 6;
        const groveRandom = seededRandom(0x47524f56 + regionIndex * 997);
        for (let tree = 0; tree < groveCount; tree += 1) {
          const slot = (tree + 0.2 + groveRandom() * 0.6) / groveCount;
          const treeX = region.left + region.width * (0.05 + slot * 0.9);
          const treeTop = height * (0.25 + groveRandom() * 0.28);
          const treeBase = horizon + 18 + groveRandom() * height * 0.24;
          const depth = 0.48 + groveRandom() * 0.42;
          const sway = Math.sin(elapsed * 0.00035 + tree * 1.7) * 2.5;

          context.strokeStyle = rgba(
            SCENE_COLORS.forestTrunk,
            intensity * (0.42 + depth * 0.42),
          );
          context.lineWidth = 2 + depth * 3;
          context.beginPath();
          context.moveTo(treeX, treeBase);
          context.quadraticCurveTo(treeX - sway, (treeBase + treeTop) / 2, treeX + sway, treeTop);
          context.stroke();

          context.fillStyle = rgba(
            tree % 2 ? SCENE_COLORS.forestLeaf : SCENE_COLORS.fieldGrass,
            intensity * (0.48 + depth * 0.38),
          );
          for (let crown = 0; crown < 4; crown += 1) {
            context.beginPath();
            context.arc(
              treeX + (crown - 1.5) * (6 + depth * 5) + sway,
              treeTop + Math.abs(crown - 1.5) * 5,
              11 + depth * 10,
              0,
              Math.PI * 2,
            );
            context.fill();
          }
        }

        const shrubCount = performanceMode ? 5 : 10;
        const shrubRandom = seededRandom(0x53485242 + regionIndex * 991);
        context.fillStyle = rgba(SCENE_COLORS.fieldGrass, intensity * 0.9);
        for (let shrub = 0; shrub < shrubCount; shrub += 1) {
          const shrubSlot = (shrub + 0.18 + shrubRandom() * 0.64) / shrubCount;
          const shrubX = region.left + region.width * (0.03 + shrubSlot * 0.94);
          const shrubY = horizon + 8 + shrubRandom() * 28;
          const shrubRadius = 7 + shrubRandom() * 10;
          context.beginPath();
          context.arc(shrubX, shrubY, shrubRadius, Math.PI, Math.PI * 2);
          context.fill();
        }

        const random = seededRandom(0x6669656c + regionIndex);
        const bladeCount = performanceMode ? 22 : 44;
        context.strokeStyle = rgba(SCENE_COLORS.fieldGrass, intensity * 0.76);
        context.lineWidth = 1;
        for (let blade = 0; blade < bladeCount; blade += 1) {
          const x = region.left + random() * region.width;
          const baseY = horizon + random() * (height - horizon);
          const bladeHeight = 7 + random() * 24;
          const sway = Math.sin(elapsed * 0.0007 + blade * 0.9) * 3;
          context.beginPath();
          context.moveTo(x, baseY);
          context.quadraticCurveTo(
            x + sway * 0.4,
            baseY - bladeHeight * 0.55,
            x + sway,
            baseY - bladeHeight,
          );
          context.stroke();
        }
      });
      context.restore();

      fireflies.forEach((particle, index) => {
        if ((width < 760 && index > 8) || (performanceMode && index % 2)) return;
        const time = elapsed * 0.00018 * particle.speed;
        const x =
          sidePosition(particle, bounds, 18) +
          Math.sin(time * 1.3 + particle.phase) * 14 * particle.drift;
        const y =
          height * (0.34 + particle.y * 0.58) +
          Math.cos(time + particle.phase * 0.8) * 18 * particle.drift;
        const pulse =
          0.22 +
          Math.pow((Math.sin(time * 3.1 + particle.phase) + 1) / 2, 3) * 0.78;
        const radius = (3.5 + particle.size * 5.2) * particle.depth;
        const alpha =
          intensity *
          palette.firefly.strength *
          pulse *
          particle.depth *
          mobileFactor *
          1.34;
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
        const alpha = intensity * twinkle * 0.26 * star.depth;
        context.fillStyle = rgba(palette.firefly.moon, alpha);
        context.beginPath();
        context.arc(x, y, 0.45 + star.size * 0.35, 0, Math.PI * 2);
        context.fill();
      });
    }

    function drawRain(elapsed: number, palette: ThemePalette) {
      const bounds = pageBounds();
      const regions = sideRegions(bounds);
      const mobileFactor = width < 760 ? 0.56 : 1;

      context.save();
      clipToSides(bounds);
      const room = context.createLinearGradient(0, 0, 0, height);
      room.addColorStop(0, rgba(SCENE_COLORS.rainRoom, intensity * 0.92));
      room.addColorStop(0.72, rgba(SCENE_COLORS.rainRoom, intensity * 0.98));
      room.addColorStop(1, rgba(SCENE_COLORS.trainCabin, intensity));
      context.fillStyle = room;
      context.fillRect(0, 0, width, height);

      regions.forEach((region) => {
        if (region.width < 28) return;
        const windowWidth = Math.max(28, Math.min(250, region.width * 0.72));
        const windowHeight = Math.min(height * 0.64, windowWidth * 1.28 + 80);
        const windowX = region.left + (region.width - windowWidth) / 2;
        const windowY = height * 0.09;

        const glass = context.createLinearGradient(
          windowX,
          windowY,
          windowX,
          windowY + windowHeight,
        );
        glass.addColorStop(0, rgba(SCENE_COLORS.waterNight, intensity * 0.98));
        glass.addColorStop(0.58, rgba(SCENE_COLORS.rainGlass, intensity * 0.76));
        glass.addColorStop(1, rgba(SCENE_COLORS.rainGlass, intensity * 0.48));
        context.fillStyle = glass;
        context.fillRect(windowX, windowY, windowWidth, windowHeight);

        context.save();
        context.beginPath();
        context.rect(windowX + 5, windowY + 5, windowWidth - 10, windowHeight - 10);
        context.clip();
        context.lineCap = "round";
        rain.forEach((drop, index) => {
          if (drop.side !== region.side) return;
          if ((width < 760 && index % 2) || (performanceMode && index % 2)) return;
          const travel = (drop.y + elapsed * 0.00042 * drop.speed) % 1.12;
          const x = windowX + 7 + drop.x * Math.max(1, windowWidth - 14);
          const y = windowY + travel * (windowHeight + 46) - 32;
          const length = (12 + drop.depth * 26) * mobileFactor;
          const alpha = intensity * palette.rain.strength * drop.depth * 0.94;
          const streak = context.createLinearGradient(x, y, x - 3, y + length);
          streak.addColorStop(0, rgba(palette.rain.shine, 0));
          streak.addColorStop(0.32, rgba(palette.rain.shine, alpha));
          streak.addColorStop(1, rgba(palette.rain.line, alpha * 0.75));
          context.strokeStyle = streak;
          context.lineWidth = 0.55 + drop.depth * 0.9;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(x - 3 - drop.depth * 2, y + length);
          context.stroke();
        });
        context.restore();

        context.strokeStyle = rgba(SCENE_COLORS.rainFrame, intensity * 0.98);
        context.lineWidth = Math.max(5, windowWidth * 0.045);
        context.strokeRect(windowX, windowY, windowWidth, windowHeight);
        context.lineWidth = Math.max(3, windowWidth * 0.025);
        context.beginPath();
        context.moveTo(windowX + windowWidth / 2, windowY);
        context.lineTo(windowX + windowWidth / 2, windowY + windowHeight);
        context.moveTo(windowX, windowY + windowHeight * 0.48);
        context.lineTo(windowX + windowWidth, windowY + windowHeight * 0.48);
        context.stroke();

        const reflection = context.createLinearGradient(
          windowX,
          windowY,
          windowX + windowWidth,
          windowY + windowHeight,
        );
        reflection.addColorStop(0.2, rgba(SCENE_COLORS.windowLight, 0));
        reflection.addColorStop(0.48, rgba(SCENE_COLORS.windowLight, intensity * 0.16));
        reflection.addColorStop(0.62, rgba(SCENE_COLORS.windowLight, 0));
        context.fillStyle = reflection;
        context.fillRect(windowX, windowY, windowWidth, windowHeight);

        const curtainWidth = Math.max(14, windowWidth * 0.2);
        context.fillStyle = rgba(SCENE_COLORS.rainCurtain, intensity * 0.92);
        context.beginPath();
        context.moveTo(windowX - curtainWidth * 0.36, windowY - 12);
        context.quadraticCurveTo(
          windowX + curtainWidth * 0.76,
          windowY + windowHeight * 0.42,
          windowX + curtainWidth * 0.28,
          windowY + windowHeight + 20,
        );
        context.lineTo(windowX - curtainWidth * 0.56, windowY + windowHeight + 20);
        context.closePath();
        context.fill();
        context.beginPath();
        context.moveTo(windowX + windowWidth + curtainWidth * 0.36, windowY - 12);
        context.quadraticCurveTo(
          windowX + windowWidth - curtainWidth * 0.76,
          windowY + windowHeight * 0.42,
          windowX + windowWidth - curtainWidth * 0.28,
          windowY + windowHeight + 20,
        );
        context.lineTo(
          windowX + windowWidth + curtainWidth * 0.56,
          windowY + windowHeight + 20,
        );
        context.closePath();
        context.fill();

        context.fillStyle = rgba(SCENE_COLORS.trainCabin, intensity * 0.9);
        context.fillRect(region.left, height * 0.82, region.width, height * 0.18);
        context.fillStyle = rgba(SCENE_COLORS.rainCurtain, intensity * 0.72);
        context.beginPath();
        context.ellipse(
          region.left + region.width * 0.5,
          height * 0.84,
          region.width * 0.46,
          height * 0.08,
          0,
          0,
          Math.PI * 2,
        );
        context.fill();

        if (region.side === -1 && region.width > 76) {
          const catScale = Math.min(1, Math.max(0.55, region.width / 190));
          const catX = region.left + region.width * 0.52;
          const catY = height * 0.815;
          const breathing = reducedMotion.matches
            ? 1
            : 1 + Math.sin(elapsed * 0.00135) * 0.025;
          const catColor: Rgb = theme === "night" ? [24, 23, 29] : [56, 47, 50];

          context.save();
          context.translate(catX, catY);
          context.scale(catScale, catScale * breathing);
          context.fillStyle = rgba(catColor, intensity * 0.96);
          context.beginPath();
          context.ellipse(0, 0, 43, 20, -0.08, 0, Math.PI * 2);
          context.fill();

          context.beginPath();
          context.arc(31, -12, 15, 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.moveTo(20, -22);
          context.lineTo(23, -39);
          context.lineTo(34, -25);
          context.moveTo(34, -25);
          context.lineTo(43, -38);
          context.lineTo(44, -19);
          context.fill();

          context.strokeStyle = rgba(catColor, intensity);
          context.lineWidth = 8;
          context.lineCap = "round";
          context.beginPath();
          context.arc(-19, -1, 27, Math.PI * 0.8, Math.PI * 2.02);
          context.stroke();

          context.strokeStyle = rgba(SCENE_COLORS.windowLight, intensity * 0.62);
          context.lineWidth = 1.5;
          context.beginPath();
          context.moveTo(31, -12);
          context.quadraticCurveTo(35, -9, 39, -12);
          context.stroke();
          context.restore();
        }
      });
      context.restore();
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

    function drawDawn(elapsed: number) {
      const bounds = pageBounds();
      const regions = sideRegions(bounds);
      context.save();
      clipToSides(bounds);

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, rgba(SCENE_COLORS.dawnSky, intensity * 0.86));
      sky.addColorStop(0.56, rgba(SCENE_COLORS.dawnGlow, intensity * 0.72));
      sky.addColorStop(1, rgba(SCENE_COLORS.dawnTreeFar, intensity * 0.8));
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      regions.forEach((region, regionIndex) => {
        if (region.width < 24) return;
        const sunX = region.left + region.width * (regionIndex ? 0.18 : 0.82);
        const sunY = height * 0.58;
        const sunRadius = Math.max(70, region.width * 0.65);
        const sun = context.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius);
        sun.addColorStop(0, rgba(SCENE_COLORS.fireBright, intensity * 0.42));
        sun.addColorStop(0.32, rgba(SCENE_COLORS.dawnGlow, intensity * 0.18));
        sun.addColorStop(1, rgba(SCENE_COLORS.dawnGlow, 0));
        context.fillStyle = sun;
        context.fillRect(
          sunX - sunRadius,
          sunY - sunRadius,
          sunRadius * 2,
          sunRadius * 2,
        );

        // A visible sun, soft cloud bands and rolling hills ground the scene
        // in a recognisable dawn landscape.
        context.fillStyle = rgba(SCENE_COLORS.fireBright, intensity * 0.78);
        context.beginPath();
        context.arc(
          sunX,
          sunY,
          Math.max(9, Math.min(22, region.width * 0.09)),
          0,
          Math.PI * 2,
        );
        context.fill();

        context.strokeStyle = rgba(SCENE_COLORS.fireBright, intensity * 0.18);
        context.lineWidth = Math.max(2, region.width * 0.018);
        context.lineCap = "round";
        for (let cloud = 0; cloud < 3; cloud += 1) {
          const cloudY = height * (0.18 + cloud * 0.09);
          const cloudDrift = Math.sin(elapsed * 0.00009 + cloud + regionIndex) * 8;
          context.beginPath();
          context.moveTo(region.left + region.width * 0.12 + cloudDrift, cloudY);
          context.bezierCurveTo(
            region.left + region.width * 0.3 + cloudDrift,
            cloudY - 8,
            region.left + region.width * 0.58 + cloudDrift,
            cloudY + 7,
            region.left + region.width * 0.82 + cloudDrift,
            cloudY - 2,
          );
          context.stroke();
        }

        const hillY = height * 0.7;
        context.fillStyle = rgba(SCENE_COLORS.dawnTreeFar, intensity * 0.74);
        context.beginPath();
        context.moveTo(region.left, hillY);
        context.bezierCurveTo(
          region.left + region.width * 0.22,
          hillY - height * 0.09,
          region.left + region.width * 0.42,
          hillY + height * 0.025,
          region.left + region.width * 0.62,
          hillY - height * 0.06,
        );
        context.bezierCurveTo(
          region.left + region.width * 0.78,
          hillY - height * 0.1,
          region.left + region.width * 0.9,
          hillY - height * 0.015,
          region.left + region.width,
          hillY - height * 0.04,
        );
        context.lineTo(region.left + region.width, height);
        context.lineTo(region.left, height);
        context.closePath();
        context.fill();

        const treeCount = performanceMode ? 3 : 5;
        for (let tree = 0; tree < treeCount; tree += 1) {
          const depth = 0.55 + ((tree * 37) % 4) * 0.12;
          const treeX =
            region.left + region.width * ((tree + 0.18) / Math.max(1, treeCount - 0.55));
          const baseY = height;
          const topY = height * (0.13 + (tree % 3) * 0.1);
          context.strokeStyle = rgba(
            tree % 2 ? SCENE_COLORS.dawnTreeFar : SCENE_COLORS.dawnTree,
            intensity * (0.72 + depth * 0.2),
          );
          context.lineCap = "round";
          context.lineWidth = 5 + depth * 8;
          context.beginPath();
          context.moveTo(treeX, baseY);
          context.quadraticCurveTo(
            treeX + Math.sin(tree) * 14,
            height * 0.55,
            treeX,
            topY,
          );
          context.stroke();

          context.lineWidth = 2 + depth * 3;
          for (let branch = 0; branch < 4; branch += 1) {
            const branchY = topY + height * (0.1 + branch * 0.085);
            const direction = branch % 2 ? 1 : -1;
            context.beginPath();
            context.moveTo(treeX, branchY + 28);
            context.quadraticCurveTo(
              treeX + direction * 20,
              branchY,
              treeX + direction * (34 + depth * 20),
              branchY - 15,
            );
            context.stroke();
          }

          context.fillStyle = rgba(
            tree % 2 ? SCENE_COLORS.dawnTreeFar : SCENE_COLORS.dawnTree,
            intensity * 0.58,
          );
          for (let crown = 0; crown < 5; crown += 1) {
            context.beginPath();
            context.arc(
              treeX + (crown - 2) * 15 * depth,
              topY + 10 + Math.abs(crown - 2) * 7,
              22 + 10 * depth,
              0,
              Math.PI * 2,
            );
            context.fill();
          }
        }

        birds.forEach((bird, index) => {
          if (bird.side !== region.side) return;
          if ((width < 760 && index > 5) || (performanceMode && index % 2)) return;
          const travel =
            (bird.x + elapsed * (0.000025 + bird.speed * 0.000016)) % 1.16;
          const direction = index % 4 === 0 ? -1 : 1;
          const route = direction > 0 ? travel : 1.16 - travel;
          const x = region.left - 22 + route * (region.width + 44);
          const y =
            height * (0.12 + bird.y * 0.37) +
            Math.sin(elapsed * 0.00034 * bird.speed + bird.phase) * 4.5 +
            Math.sin(elapsed * 0.0021 * bird.speed + bird.phase) * 1.2;
          const rawFlap = Math.sin(elapsed * 0.0034 * bird.speed + bird.phase);
          const flap = rawFlap > 0.25 ? rawFlap : -0.08;
          const size = 4.8 + bird.size * 3.2;
          const birdColor = rgba(SCENE_COLORS.bird, intensity * 0.86 * bird.depth);

          context.save();
          context.translate(x, y);
          context.scale(direction, 1);
          context.rotate(Math.sin(elapsed * 0.0007 + bird.phase) * 0.08);
          context.fillStyle = birdColor;

          // Side-view body, head, beak and tail remain readable while the
          // asymmetric wings flap above and below the body.
          context.beginPath();
          context.ellipse(0, 0, size, size * 0.38, -0.08, 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.arc(size * 0.78, -size * 0.12, size * 0.31, 0, Math.PI * 2);
          context.fill();
          context.beginPath();
          context.moveTo(size * 1.02, -size * 0.18);
          context.lineTo(size * 1.42, -size * 0.06);
          context.lineTo(size * 1.02, size * 0.02);
          context.closePath();
          context.fill();
          context.beginPath();
          context.moveTo(-size * 0.78, -size * 0.12);
          context.lineTo(-size * 1.34, -size * 0.5);
          context.lineTo(-size * 1.08, size * 0.08);
          context.lineTo(-size * 1.32, size * 0.42);
          context.closePath();
          context.fill();

          context.beginPath();
          context.moveTo(-size * 0.25, -size * 0.08);
          context.bezierCurveTo(
            -size * 0.12,
            -size * (0.7 + flap * 0.5),
            size * 0.35,
            -size * (0.9 + flap * 0.35),
            size * 0.48,
            -size * 0.08,
          );
          context.quadraticCurveTo(size * 0.08, size * 0.12, -size * 0.25, -size * 0.08);
          context.fill();

          context.fillStyle = rgba(SCENE_COLORS.fireBright, intensity * 0.7);
          context.beginPath();
          context.arc(size * 0.88, -size * 0.2, Math.max(0.7, size * 0.065), 0, Math.PI * 2);
          context.fill();
          context.restore();
        });
      });

      const haze = context.createLinearGradient(0, height * 0.52, 0, height);
      haze.addColorStop(0, rgba(SCENE_COLORS.dawnGlow, 0));
      haze.addColorStop(1, rgba(SCENE_COLORS.dawnTree, intensity * 0.48));
      context.fillStyle = haze;
      context.fillRect(0, height * 0.45, width, height * 0.55);
      context.restore();
    }

    function drawFireplace(elapsed: number) {
      const bounds = pageBounds();
      const regions = sideRegions(bounds);
      context.save();
      clipToSides(bounds);

      const firePulse =
        0.9 +
        Math.sin(elapsed * 0.0041) * 0.045 +
        Math.sin(elapsed * 0.0067 + 1.8) * 0.035;
      const wall = context.createLinearGradient(0, 0, 0, height);
      wall.addColorStop(0, rgba([69, 57, 54], intensity * 0.92));
      wall.addColorStop(0.56, rgba([48, 36, 35], intensity * 0.96));
      wall.addColorStop(1, rgba([25, 19, 21], intensity));
      context.fillStyle = wall;
      context.fillRect(0, 0, width, height);

      regions.forEach((region, regionIndex) => {
        if (region.width < 32) return;
        const detailLevel = region.width >= 150 ? 2 : region.width >= 72 ? 1 : 0;
        const sidePhase = regionIndex * 2.37;
        const availableWidth = Math.max(22, region.width - 10);
        const hearthWidth = Math.min(300, region.width * 0.86, availableWidth);
        const hearthHeight = Math.min(
          height * 0.58,
          Math.max(112, hearthWidth * (detailLevel === 2 ? 1.02 : 1.18)),
        );
        const hearthX = region.left + (region.width - hearthWidth) / 2;
        const hearthBottom = height * 0.93;
        const hearthY = hearthBottom - hearthHeight;
        const openingInset = Math.max(4, hearthWidth * 0.135);
        const openingX = hearthX + openingInset;
        const openingWidth = Math.max(12, hearthWidth - openingInset * 2);
        const openingBottom = hearthBottom - Math.max(10, hearthHeight * 0.075);
        const openingHeight = hearthHeight * 0.62;
        const openingY = openingBottom - openingHeight;
        const archRadius = Math.min(openingWidth * 0.5, openingHeight * 0.34);
        const openingPath = new Path2D();
        openingPath.moveTo(openingX, openingBottom);
        openingPath.lineTo(openingX, openingY + archRadius);
        openingPath.ellipse(
          openingX + openingWidth / 2,
          openingY + archRadius,
          openingWidth / 2,
          archRadius,
          0,
          Math.PI,
          Math.PI * 2,
        );
        openingPath.lineTo(openingX + openingWidth, openingBottom);
        openingPath.closePath();

        const glow = context.createRadialGradient(
          hearthX + hearthWidth / 2,
          openingBottom - openingHeight * 0.17,
          0,
          hearthX + hearthWidth / 2,
          openingBottom - openingHeight * 0.17,
          Math.max(90, hearthWidth * 0.96),
        );
        glow.addColorStop(
          0,
          rgba(SCENE_COLORS.fireGlow, intensity * firePulse * 0.5),
        );
        glow.addColorStop(0.42, rgba(SCENE_COLORS.fireDeep, intensity * 0.17));
        glow.addColorStop(1, rgba(SCENE_COLORS.fireGlow, 0));
        context.fillStyle = glow;
        context.fillRect(
          hearthX - hearthWidth * 0.7,
          hearthY - hearthHeight * 0.45,
          hearthWidth * 2.4,
          hearthHeight * 1.7,
        );

        // The tapering chimney breast gives the fireplace a full-height silhouette.
        const breastTop = Math.max(4, height * 0.025);
        const breastTopWidth = hearthWidth * (detailLevel === 0 ? 0.78 : 0.64);
        const breastTopX = hearthX + (hearthWidth - breastTopWidth) / 2;
        const stoneFace = context.createLinearGradient(
          hearthX,
          0,
          hearthX + hearthWidth,
          0,
        );
        stoneFace.addColorStop(0, rgba([82, 66, 60], intensity * 0.98));
        stoneFace.addColorStop(0.2, rgba(SCENE_COLORS.stone, intensity));
        stoneFace.addColorStop(0.72, rgba(SCENE_COLORS.stoneLight, intensity * 0.94));
        stoneFace.addColorStop(1, rgba([74, 58, 54], intensity));
        context.fillStyle = stoneFace;
        context.beginPath();
        context.moveTo(breastTopX, breastTop);
        context.lineTo(breastTopX + breastTopWidth, breastTop);
        context.lineTo(hearthX + hearthWidth, hearthBottom);
        context.lineTo(hearthX, hearthBottom);
        context.closePath();
        context.fill();

        // Deterministic mortar lines suggest masonry without per-frame randomness.
        context.save();
        context.beginPath();
        context.moveTo(breastTopX, breastTop);
        context.lineTo(breastTopX + breastTopWidth, breastTop);
        context.lineTo(hearthX + hearthWidth, hearthBottom);
        context.lineTo(hearthX, hearthBottom);
        context.closePath();
        context.clip();
        const stoneRows = detailLevel === 2 ? 11 : detailLevel === 1 ? 8 : 5;
        const rowHeight = (hearthBottom - breastTop) / stoneRows;
        context.strokeStyle = rgba([54, 43, 41], intensity * 0.55);
        context.lineWidth = 1;
        for (let row = 1; row < stoneRows; row += 1) {
          const y = breastTop + row * rowHeight;
          const progress = row / stoneRows;
          const rowLeft = breastTopX + (hearthX - breastTopX) * progress;
          const rowRight =
            breastTopX +
            breastTopWidth +
            (hearthX + hearthWidth - breastTopX - breastTopWidth) * progress;
          context.beginPath();
          context.moveTo(rowLeft, y);
          context.lineTo(rowRight, y);
          context.stroke();

          if (detailLevel > 0) {
            const joint = rowLeft +
              (rowRight - rowLeft) * (row % 2 ? 0.42 : 0.62);
            context.beginPath();
            context.moveTo(joint, y - rowHeight);
            context.lineTo(joint, y);
            context.stroke();
          }
        }
        context.restore();

        const mantelY = openingY - Math.max(6, hearthHeight * 0.055);
        const mantelHeight = Math.max(8, Math.min(18, hearthHeight * 0.09));
        context.fillStyle = rgba([54, 41, 39], intensity * 0.7);
        context.fillRect(
          hearthX - 8,
          mantelY + mantelHeight * 0.55,
          hearthWidth + 16,
          mantelHeight,
        );
        const mantel = context.createLinearGradient(0, mantelY, 0, mantelY + mantelHeight);
        mantel.addColorStop(0, rgba([187, 161, 137], intensity));
        mantel.addColorStop(0.32, rgba(SCENE_COLORS.stoneLight, intensity));
        mantel.addColorStop(1, rgba([89, 69, 61], intensity));
        context.fillStyle = mantel;
        context.fillRect(hearthX - 8, mantelY, hearthWidth + 16, mantelHeight);

        context.fillStyle = rgba([58, 43, 40], intensity * 0.86);
        context.fillRect(
          hearthX - 11,
          hearthBottom - 4,
          hearthWidth + 22,
          Math.max(12, hearthHeight * 0.085),
        );
        const hearthSlab = context.createLinearGradient(
          0,
          hearthBottom - 8,
          0,
          hearthBottom + 10,
        );
        hearthSlab.addColorStop(0, rgba([188, 153, 125], intensity));
        hearthSlab.addColorStop(1, rgba([87, 65, 57], intensity));
        context.fillStyle = hearthSlab;
        context.fillRect(hearthX - 14, hearthBottom - 8, hearthWidth + 28, 13);

        // A dark recessed firebox, with side walls converging towards the back.
        const firebox = context.createLinearGradient(0, openingY, 0, openingBottom);
        firebox.addColorStop(0, rgba([7, 7, 9], intensity));
        firebox.addColorStop(0.62, rgba([20, 11, 10], intensity));
        firebox.addColorStop(1, rgba([46, 20, 14], intensity));
        context.fillStyle = firebox;
        context.fill(openingPath);

        context.save();
        context.clip(openingPath);
        const rearInset = openingWidth * 0.18;
        const rearTop = openingY + openingHeight * 0.22;
        context.fillStyle = rgba([42, 31, 28], intensity * 0.7);
        context.beginPath();
        context.moveTo(openingX, openingY + archRadius);
        context.lineTo(openingX + rearInset, rearTop);
        context.lineTo(openingX + rearInset, openingBottom - openingHeight * 0.14);
        context.lineTo(openingX, openingBottom);
        context.closePath();
        context.fill();
        context.beginPath();
        context.moveTo(openingX + openingWidth, openingY + archRadius);
        context.lineTo(openingX + openingWidth - rearInset, rearTop);
        context.lineTo(
          openingX + openingWidth - rearInset,
          openingBottom - openingHeight * 0.14,
        );
        context.lineTo(openingX + openingWidth, openingBottom);
        context.closePath();
        context.fill();

        const floorGlow = context.createLinearGradient(
          0,
          openingBottom - openingHeight * 0.28,
          0,
          openingBottom,
        );
        floorGlow.addColorStop(0, rgba([30, 17, 15], intensity * 0.3));
        floorGlow.addColorStop(1, rgba(SCENE_COLORS.fireDeep, intensity * 0.42));
        context.fillStyle = floorGlow;
        context.beginPath();
        context.moveTo(openingX + rearInset, openingBottom - openingHeight * 0.22);
        context.lineTo(
          openingX + openingWidth - rearInset,
          openingBottom - openingHeight * 0.22,
        );
        context.lineTo(openingX + openingWidth, openingBottom);
        context.lineTo(openingX, openingBottom);
        context.closePath();
        context.fill();

        if (detailLevel > 0) {
          context.strokeStyle = rgba([107, 70, 57], intensity * 0.28);
          context.lineWidth = 0.8;
          for (let brick = 1; brick < 5; brick += 1) {
            const y = rearTop + brick * openingHeight * 0.105;
            context.beginPath();
            context.moveTo(openingX + rearInset, y);
            context.lineTo(openingX + openingWidth - rearInset, y);
            context.stroke();
          }
        }

        // Smoke remains in the firebox and narrows naturally into the flue.
        if (!performanceMode || detailLevel > 0) {
          const smokeCount = performanceMode ? 1 : detailLevel === 2 ? 3 : 2;
          context.lineCap = "round";
          for (let smoke = 0; smoke < smokeCount; smoke += 1) {
            const smokePhase =
              elapsed * (0.00105 + smoke * 0.00012) + sidePhase + smoke * 1.9;
            const smokeX =
              openingX + openingWidth * (0.42 + smoke * 0.09) +
              Math.sin(smokePhase) * openingWidth * 0.08;
            const smokeBase = openingBottom - openingHeight * (0.46 + smoke * 0.05);
            context.strokeStyle = rgba(
              SCENE_COLORS.smoke,
              intensity * (0.075 + smoke * 0.012),
            );
            context.lineWidth = Math.max(2, openingWidth * (0.045 + smoke * 0.012));
            context.beginPath();
            context.moveTo(smokeX, smokeBase);
            context.bezierCurveTo(
              smokeX - openingWidth * 0.16,
              smokeBase - openingHeight * 0.16,
              smokeX + Math.sin(smokePhase * 0.73) * openingWidth * 0.22,
              openingY + openingHeight * 0.25,
              openingX + openingWidth * (0.48 + Math.sin(smokePhase * 0.52) * 0.09),
              openingY - openingHeight * 0.08,
            );
            context.stroke();
          }
        }

        // Ember bed: fixed positions with independent, inexpensive pulses.
        const emberCount = performanceMode ? 5 : detailLevel === 2 ? 15 : 8;
        for (let ember = 0; ember < emberCount; ember += 1) {
          const random = seededRandom(0x454d4245 + regionIndex * 101 + ember * 17);
          const emberX = openingX + openingWidth * (0.16 + random() * 0.68);
          const emberY = openingBottom - openingHeight * (0.08 + random() * 0.12);
          const emberRadius = Math.max(0.8, openingWidth * (0.012 + random() * 0.018));
          const emberPulse =
            0.48 + Math.sin(elapsed * (0.0028 + random() * 0.002) + ember) * 0.3;
          context.fillStyle = rgba(
            ember % 3 ? SCENE_COLORS.ember : SCENE_COLORS.fireDeep,
            intensity * emberPulse,
          );
          context.beginPath();
          context.ellipse(emberX, emberY, emberRadius * 1.45, emberRadius, 0, 0, Math.PI * 2);
          context.fill();
        }

        // Iron grate behind the logs.
        if (detailLevel > 0) {
          context.strokeStyle = rgba([24, 20, 21], intensity * 0.96);
          context.lineWidth = Math.max(1.4, openingWidth * 0.018);
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(openingX + openingWidth * 0.12, openingBottom - openingHeight * 0.12);
          context.lineTo(openingX + openingWidth * 0.88, openingBottom - openingHeight * 0.12);
          context.moveTo(openingX + openingWidth * 0.2, openingBottom - openingHeight * 0.2);
          context.lineTo(openingX + openingWidth * 0.22, openingBottom - openingHeight * 0.04);
          context.moveTo(openingX + openingWidth * 0.8, openingBottom - openingHeight * 0.2);
          context.lineTo(openingX + openingWidth * 0.78, openingBottom - openingHeight * 0.04);
          context.stroke();
        }

        const logCount = detailLevel === 0 ? 2 : 3;
        for (let log = 0; log < logCount; log += 1) {
          const logY = openingBottom - openingHeight * (0.14 + log * 0.035);
          const logLength = openingWidth * (log === 2 ? 0.58 : 0.64);
          const logThickness = Math.max(4, openingWidth * 0.095);
          const rotation = (log % 2 ? 0.16 : -0.18) + (regionIndex ? -0.025 : 0.025);
          context.save();
          context.translate(
            openingX + openingWidth * (0.5 + (log - 1) * 0.035),
            logY,
          );
          context.rotate(rotation);
          const bark = context.createLinearGradient(0, -logThickness, 0, logThickness);
          bark.addColorStop(0, rgba([92, 48, 31], intensity));
          bark.addColorStop(0.55, rgba([53, 27, 23], intensity));
          bark.addColorStop(1, rgba([25, 17, 18], intensity));
          context.fillStyle = bark;
          context.beginPath();
          context.roundRect(
            -logLength / 2,
            -logThickness / 2,
            logLength,
            logThickness,
            logThickness / 2,
          );
          context.fill();
          context.fillStyle = rgba([146, 82, 48], intensity * 0.9);
          context.beginPath();
          context.ellipse(
            logLength / 2 - logThickness * 0.22,
            0,
            logThickness * 0.24,
            logThickness * 0.42,
            0,
            0,
            Math.PI * 2,
          );
          context.fill();
          if (detailLevel === 2) {
            context.strokeStyle = rgba([198, 113, 58], intensity * 0.32);
            context.lineWidth = 0.8;
            context.beginPath();
            context.moveTo(-logLength * 0.34, -logThickness * 0.1);
            context.lineTo(logLength * 0.2, -logThickness * 0.22);
            context.moveTo(-logLength * 0.22, logThickness * 0.2);
            context.lineTo(logLength * 0.3, logThickness * 0.08);
            context.stroke();
          }
          context.restore();
        }

        // Layered, overlapping tongues form one coherent fire rather than repeated drops.
        const flameCount = performanceMode ? 2 : detailLevel === 2 ? 5 : detailLevel === 1 ? 4 : 3;
        context.save();
        context.globalCompositeOperation = "lighter";
        for (let flame = 0; flame < flameCount; flame += 1) {
          const phase =
            elapsed * (0.0033 + flame * 0.00027) + flame * 1.43 + sidePhase;
          const baseX =
            openingX + openingWidth * (0.22 + ((flame + 1) / (flameCount + 1)) * 0.56);
          const baseY = openingBottom - openingHeight * 0.12;
          const flameHeight =
            openingHeight * (0.25 + (flame % 3) * 0.095) *
            (0.86 + Math.sin(phase) * 0.1 + Math.sin(phase * 1.71) * 0.055);
          const flameWidth = Math.max(3.5, openingWidth * (0.085 + (flame % 2) * 0.028));
          const sway =
            (Math.sin(phase * 0.74) + Math.sin(phase * 1.37) * 0.32) *
            flameWidth * 0.82;
          context.fillStyle = rgba(
            flame % 2 ? SCENE_COLORS.fireDeep : SCENE_COLORS.fireGlow,
            intensity * 0.76,
          );
          context.beginPath();
          context.moveTo(baseX - flameWidth, baseY);
          context.bezierCurveTo(
            baseX - flameWidth * 0.76,
            baseY - flameHeight * 0.34,
            baseX - flameWidth * 0.15 + sway,
            baseY - flameHeight * 0.7,
            baseX + sway,
            baseY - flameHeight,
          );
          context.bezierCurveTo(
            baseX + flameWidth * 0.22 + sway,
            baseY - flameHeight * 0.66,
            baseX + flameWidth * 0.86,
            baseY - flameHeight * 0.32,
            baseX + flameWidth,
            baseY,
          );
          context.closePath();
          context.fill();

          context.fillStyle = rgba(SCENE_COLORS.fireBright, intensity * 0.68);
          context.beginPath();
          context.moveTo(baseX - flameWidth * 0.38, baseY);
          context.quadraticCurveTo(
            baseX - flameWidth * 0.08,
            baseY - flameHeight * 0.32,
            baseX + sway * 0.35,
            baseY - flameHeight * 0.56,
          );
          context.quadraticCurveTo(
            baseX + flameWidth * 0.42,
            baseY - flameHeight * 0.25,
            baseX + flameWidth * 0.4,
            baseY,
          );
          context.closePath();
          context.fill();
        }
        context.restore();

        if (!performanceMode) {
          const sparkCount = detailLevel === 2 ? 9 : detailLevel === 1 ? 5 : 3;
          for (let spark = 0; spark < sparkCount; spark += 1) {
            const sparkCycle =
              (elapsed * (0.00026 + spark * 0.000014) + spark * 0.147 + regionIndex * 0.31) %
              1;
            const sparkX =
              openingX + openingWidth * (0.32 + ((spark * 0.271) % 0.38)) +
              Math.sin(elapsed * 0.0021 + spark * 2.2) * openingWidth * 0.07;
            const sparkY =
              openingBottom - openingHeight * (0.23 + sparkCycle * 0.58);
            const sparkAlpha = Math.sin(sparkCycle * Math.PI) * intensity * 0.86;
            context.fillStyle = rgba(
              spark % 3 ? SCENE_COLORS.ember : SCENE_COLORS.fireBright,
              sparkAlpha,
            );
            context.beginPath();
            context.arc(
              sparkX,
              sparkY,
              Math.max(0.65, openingWidth * (spark % 3 ? 0.007 : 0.011)),
              0,
              Math.PI * 2,
            );
            context.fill();
          }
        }
        context.restore();
      });
      context.restore();
    }

    function drawShore(elapsed: number) {
      const bounds = pageBounds();
      const regions = sideRegions(bounds);
      context.save();
      clipToSides(bounds);

      const beach = context.createLinearGradient(0, 0, 0, height);
      beach.addColorStop(0, rgba(SCENE_COLORS.dawnSky, intensity * 0.64));
      beach.addColorStop(0.36, rgba(SCENE_COLORS.seaLight, intensity * 0.76));
      beach.addColorStop(0.58, rgba(SCENE_COLORS.sandLight, intensity * 0.9));
      beach.addColorStop(1, rgba(SCENE_COLORS.sand, intensity * 0.98));
      context.fillStyle = beach;
      context.fillRect(0, 0, width, height);

      const tide = (Math.sin(elapsed * 0.00024) + 1) / 2;
      const frontY = height * (0.55 + tide * 0.19);
      const water = context.createLinearGradient(0, height * 0.24, 0, frontY + 30);
      water.addColorStop(0, rgba(SCENE_COLORS.seaDeep, intensity * 0.78));
      water.addColorStop(0.64, rgba(SCENE_COLORS.seaLight, intensity * 0.84));
      water.addColorStop(1, rgba(SCENE_COLORS.foam, intensity * 0.34));
      context.fillStyle = water;
      context.beginPath();
      context.moveTo(0, 0);
      context.lineTo(width, 0);
      for (let x = width; x >= 0; x -= 12) {
        const waveY =
          frontY +
          Math.sin(x * 0.028 + elapsed * 0.0011) * 5 +
          Math.sin(x * 0.071 - elapsed * 0.0007) * 2;
        context.lineTo(x, waveY);
      }
      context.closePath();
      context.fill();

      context.lineCap = "round";
      for (let foamLine = 0; foamLine < (performanceMode ? 2 : 4); foamLine += 1) {
        const retreat = foamLine * 13 + Math.sin(elapsed * 0.0008 + foamLine) * 3;
        context.strokeStyle = rgba(
          SCENE_COLORS.foam,
          intensity * (0.82 - foamLine * 0.14) * (0.76 + tide * 0.24),
        );
        context.lineWidth = foamLine === 0 ? 3.2 : 1.25;
        context.beginPath();
        for (let x = -18; x <= width + 18; x += 10) {
          const y =
            frontY - retreat +
            Math.sin(x * 0.029 + elapsed * 0.001 + foamLine * 0.8) *
              (5 - foamLine * 0.6) +
            Math.sin(x * 0.087 - elapsed * 0.00058) * 1.8;
          if (x === -18) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }

      if (!performanceMode) {
        context.fillStyle = rgba(SCENE_COLORS.foam, intensity * 0.38);
        for (let bubble = 0; bubble < 22; bubble += 1) {
          const random = seededRandom(0x73686f72 + bubble);
          const x = random() * width;
          const y = frontY - 24 + random() * 44;
          context.beginPath();
          context.arc(x, y, 0.8 + random() * 1.7, 0, Math.PI * 2);
          context.fill();
        }
      }

      const boatRegion =
        regions.find((region) => region.side === 1 && region.width > 70) ??
        regions.find((region) => region.width > 70);
      if (boatRegion) {
        const drift = reducedMotion.matches
          ? 0
          : Math.sin(elapsed * 0.00011) * boatRegion.width * 0.09 +
            Math.sin(elapsed * 0.000037 + 1.7) * boatRegion.width * 0.045;
        const bob = reducedMotion.matches
          ? 0
          : Math.sin(elapsed * 0.00105) * 3.2 + Math.sin(elapsed * 0.00041) * 1.6;
        const tilt = reducedMotion.matches
          ? -0.025
          : Math.sin(elapsed * 0.00072 + 0.8) * 0.045;
        const boatScale = Math.min(1, Math.max(0.58, boatRegion.width / 180));
        const boatX = boatRegion.left + boatRegion.width * 0.52 + drift;
        const boatY = height * 0.37 + bob;

        context.save();
        context.translate(boatX, boatY);
        context.rotate(tilt);
        context.scale(boatScale, boatScale);

        context.fillStyle = rgba(SCENE_COLORS.driftwood, intensity * 0.96);
        context.beginPath();
        context.moveTo(-43, -5);
        context.quadraticCurveTo(-32, 18, 0, 22);
        context.quadraticCurveTo(32, 18, 43, -5);
        context.quadraticCurveTo(0, 4, -43, -5);
        context.closePath();
        context.fill();
        context.strokeStyle = rgba([62, 47, 36], intensity * 0.92);
        context.lineWidth = 2.4;
        context.stroke();

        context.strokeStyle = rgba(SCENE_COLORS.sandLight, intensity * 0.78);
        context.lineWidth = 2;
        [-18, 4, 24].forEach((seatX) => {
          context.beginPath();
          context.moveTo(seatX - 9, 3);
          context.lineTo(seatX + 8, 5);
          context.stroke();
        });

        context.strokeStyle = rgba(SCENE_COLORS.driftwood, intensity * 0.84);
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(-8, 3);
        context.lineTo(-48, 27);
        context.moveTo(11, 4);
        context.lineTo(50, 24);
        context.stroke();
        context.restore();

        const reflection = context.createLinearGradient(boatX, boatY + 16, boatX, boatY + 58);
        reflection.addColorStop(0, rgba(SCENE_COLORS.driftwood, intensity * 0.22));
        reflection.addColorStop(1, rgba(SCENE_COLORS.seaDeep, 0));
        context.fillStyle = reflection;
        context.beginPath();
        context.ellipse(boatX, boatY + 24, 38 * boatScale, 5, tilt, 0, Math.PI * 2);
        context.fill();
      }

      regions.forEach((region, regionIndex) => {
        if (region.width < 24) return;
        const palmScale = Math.max(0.48, Math.min(1, region.width / 210));
        const baseX =
          region.left + region.width * (regionIndex === 0 ? 0.24 : 0.76);
        const baseY = height * 0.96;
        const crownX =
          baseX + (regionIndex === 0 ? 1 : -1) * Math.min(68, region.width * 0.24);
        const crownY = height * (0.27 + regionIndex * 0.035);

        context.strokeStyle = rgba(SCENE_COLORS.palmTrunk, intensity * 0.96);
        context.lineCap = "round";
        context.lineWidth = Math.max(4, 10 * palmScale);
        context.beginPath();
        context.moveTo(baseX, baseY);
        context.quadraticCurveTo(
          baseX + (regionIndex === 0 ? 24 : -24) * palmScale,
          height * 0.6,
          crownX,
          crownY,
        );
        context.stroke();

        context.strokeStyle = rgba(SCENE_COLORS.sandLight, intensity * 0.2);
        context.lineWidth = Math.max(1, 2 * palmScale);
        for (let notch = 1; notch < 8; notch += 1) {
          const progress = notch / 9;
          const notchX =
            baseX +
            (crownX - baseX) * progress +
            (regionIndex === 0 ? 1 : -1) * Math.sin(progress * Math.PI) * 11;
          const notchY = baseY + (crownY - baseY) * progress;
          context.beginPath();
          context.moveTo(notchX - 4 * palmScale, notchY);
          context.lineTo(notchX + 4 * palmScale, notchY - 1);
          context.stroke();
        }

        const frondLength = Math.max(18, Math.min(82, region.width * 0.34));
        context.strokeStyle = rgba(SCENE_COLORS.palmLeaf, intensity * 0.96);
        context.lineWidth = Math.max(2, 4.5 * palmScale);
        for (let frond = 0; frond < (performanceMode ? 6 : 9); frond += 1) {
          const angle = -Math.PI * 0.92 + (frond / 8) * Math.PI * 0.92;
          const wind = Math.sin(elapsed * 0.00055 + frond * 0.8) * 5;
          const endX = crownX + Math.cos(angle) * frondLength;
          const endY = crownY + Math.sin(angle) * frondLength * 0.62 + 13;
          context.beginPath();
          context.moveTo(crownX, crownY);
          context.quadraticCurveTo(
            crownX + Math.cos(angle) * frondLength * 0.48 + wind,
            crownY + Math.sin(angle) * frondLength * 0.18 - 8,
            endX,
            endY,
          );
          context.stroke();
        }

        context.fillStyle = rgba(SCENE_COLORS.driftwood, intensity * 0.96);
        [-7, 0, 7].forEach((offset) => {
          context.beginPath();
          context.arc(
            crownX + offset * palmScale,
            crownY + 7 * palmScale,
            Math.max(2, 4.5 * palmScale),
            0,
            Math.PI * 2,
          );
          context.fill();
        });

        if (regionIndex === 1 && region.width > 64) {
          const markerX = region.left + region.width * 0.28;
          const markerBaseY = height * 0.91;
          const markerHeight = Math.max(50, Math.min(92, height * 0.16));
          const markerTopY = markerBaseY - markerHeight;
          context.strokeStyle = rgba(SCENE_COLORS.driftwood, intensity * 0.92);
          context.lineWidth = Math.max(3, 5 * palmScale);
          context.beginPath();
          context.moveTo(markerX, markerBaseY);
          context.lineTo(markerX, markerTopY);
          context.moveTo(markerX - 22 * palmScale, markerTopY + 23 * palmScale);
          context.lineTo(markerX + 22 * palmScale, markerTopY + 18 * palmScale);
          context.stroke();

          const skullY = markerTopY + 18 * palmScale;
          context.strokeStyle = rgba(SCENE_COLORS.oldBone, intensity * 0.78);
          context.lineWidth = Math.max(1.5, 3 * palmScale);
          context.beginPath();
          context.moveTo(markerX - 15 * palmScale, skullY - 12 * palmScale);
          context.lineTo(markerX + 15 * palmScale, skullY + 12 * palmScale);
          context.moveTo(markerX + 15 * palmScale, skullY - 12 * palmScale);
          context.lineTo(markerX - 15 * palmScale, skullY + 12 * palmScale);
          context.stroke();

          context.fillStyle = rgba(SCENE_COLORS.oldBone, intensity * 0.94);
          context.beginPath();
          context.ellipse(
            markerX,
            skullY - 3 * palmScale,
            11 * palmScale,
            10 * palmScale,
            0,
            0,
            Math.PI * 2,
          );
          context.fill();
          context.fillRect(
            markerX - 6 * palmScale,
            skullY + 3 * palmScale,
            12 * palmScale,
            7 * palmScale,
          );
          context.fillStyle = rgba(SCENE_COLORS.forestDeep, intensity * 0.92);
          [-4, 4].forEach((offset) => {
            context.beginPath();
            context.arc(
              markerX + offset * palmScale,
              skullY - 4 * palmScale,
              Math.max(1.3, 2.2 * palmScale),
              0,
              Math.PI * 2,
            );
            context.fill();
          });
          context.beginPath();
          context.moveTo(markerX, skullY);
          context.lineTo(markerX - 2 * palmScale, skullY + 4 * palmScale);
          context.lineTo(markerX + 2 * palmScale, skullY + 4 * palmScale);
          context.closePath();
          context.fill();
        }
      });
      context.restore();
    }

    function drawTrain(elapsed: number) {
      const bounds = pageBounds();
      const regions = sideRegions(bounds);
      context.save();
      clipToSides(bounds);

      const cabin = context.createLinearGradient(0, 0, 0, height);
      cabin.addColorStop(0, rgba(SCENE_COLORS.trainCabin, intensity * 0.98));
      cabin.addColorStop(0.76, rgba(SCENE_COLORS.trainCabin, intensity));
      cabin.addColorStop(1, rgba(SCENE_COLORS.forestDeep, intensity));
      context.fillStyle = cabin;
      context.fillRect(0, 0, width, height);

      regions.forEach((region, regionIndex) => {
        if (region.width < 30) return;
        const windowWidth = Math.max(32, Math.min(280, region.width * 0.76));
        const windowHeight = Math.min(height * 0.57, windowWidth * 0.94 + 80);
        const windowX = region.left + (region.width - windowWidth) / 2;
        const windowY = height * 0.1;

        context.save();
        context.beginPath();
        context.roundRect(windowX, windowY, windowWidth, windowHeight, 12);
        context.clip();
        const outside = context.createLinearGradient(0, windowY, 0, windowY + windowHeight);
        outside.addColorStop(0, rgba(SCENE_COLORS.trainNight, intensity));
        outside.addColorStop(0.67, rgba(SCENE_COLORS.waterNight, intensity * 0.9));
        outside.addColorStop(1, rgba(SCENE_COLORS.forestDeep, intensity));
        context.fillStyle = outside;
        context.fillRect(windowX, windowY, windowWidth, windowHeight);

        const travel = elapsed * 0.075;
        context.fillStyle = rgba(SCENE_COLORS.forestTrunk, intensity * 0.94);
        for (let tree = 0; tree < (performanceMode ? 5 : 9); tree += 1) {
          const spacing = windowWidth / 4.2;
          const x =
            windowX +
            windowWidth -
            ((travel + tree * spacing + regionIndex * 47) % (windowWidth + spacing));
          const treeHeight = windowHeight * (0.25 + (tree % 4) * 0.07);
          context.fillRect(x, windowY + windowHeight - treeHeight, 4 + (tree % 3), treeHeight);
          context.beginPath();
          context.moveTo(x - 19, windowY + windowHeight - treeHeight * 0.72);
          context.lineTo(x + 3, windowY + windowHeight - treeHeight - 24);
          context.lineTo(x + 24, windowY + windowHeight - treeHeight * 0.72);
          context.closePath();
          context.fill();
        }

        context.strokeStyle = rgba(SCENE_COLORS.dawnGlow, intensity * 0.24);
        context.lineWidth = 1.2;
        for (let streak = 0; streak < 5; streak += 1) {
          const y = windowY + windowHeight * (0.46 + streak * 0.085);
          const offset = (travel * (1.3 + streak * 0.12) + streak * 53) % windowWidth;
          context.beginPath();
          context.moveTo(windowX + windowWidth - offset, y);
          context.lineTo(windowX + windowWidth - offset + 46 + streak * 7, y);
          context.stroke();
        }
        context.restore();

        context.strokeStyle = rgba(SCENE_COLORS.trainBrass, intensity * 0.94);
        context.lineWidth = Math.max(6, windowWidth * 0.052);
        context.beginPath();
        context.roundRect(windowX, windowY, windowWidth, windowHeight, 12);
        context.stroke();
        context.lineWidth = Math.max(2, windowWidth * 0.018);
        context.beginPath();
        context.moveTo(windowX + windowWidth / 2, windowY);
        context.lineTo(windowX + windowWidth / 2, windowY + windowHeight);
        context.stroke();

        const lampX = region.left + region.width * (regionIndex ? 0.18 : 0.82);
        const lampY = height * 0.16;
        const lampGlow = context.createRadialGradient(lampX, lampY, 0, lampX, lampY, 90);
        lampGlow.addColorStop(0, rgba(SCENE_COLORS.fireBright, intensity * 0.3));
        lampGlow.addColorStop(1, rgba(SCENE_COLORS.dawnGlow, 0));
        context.fillStyle = lampGlow;
        context.fillRect(lampX - 90, lampY - 90, 180, 180);

        context.fillStyle = rgba(SCENE_COLORS.trainUpholstery, intensity * 0.94);
        context.beginPath();
        context.roundRect(
          region.left + region.width * 0.05,
          height * 0.78,
          region.width * 0.9,
          height * 0.28,
          [18, 18, 0, 0],
        );
        context.fill();
        context.strokeStyle = rgba(SCENE_COLORS.trainBrass, intensity * 0.42);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(region.left + region.width * 0.08, height * 0.84);
        context.lineTo(region.left + region.width * 0.92, height * 0.84);
        context.stroke();
      });
      context.restore();
    }

    function drawZombies(elapsed: number) {
      const bounds = pageBounds();
      const regions = sideRegions(bounds);
      context.save();
      clipToSides(bounds);

      const sky = context.createLinearGradient(0, 0, 0, height);
      sky.addColorStop(0, rgba(SCENE_COLORS.zombieSky, intensity));
      sky.addColorStop(0.62, rgba([50, 37, 45], intensity * 0.98));
      sky.addColorStop(1, rgba([18, 25, 22], intensity));
      context.fillStyle = sky;
      context.fillRect(0, 0, width, height);

      regions.forEach((region, regionIndex) => {
        if (region.width < 24) return;
        const centerX = region.left + region.width * (regionIndex ? 0.28 : 0.72);
        const moonY = height * 0.18;
        const moonRadius = Math.min(64, Math.max(24, region.width * 0.19));
        const moonGlow = context.createRadialGradient(
          centerX,
          moonY,
          moonRadius * 0.25,
          centerX,
          moonY,
          moonRadius * 2.5,
        );
        moonGlow.addColorStop(0, rgba(SCENE_COLORS.zombieMoon, intensity * 0.42));
        moonGlow.addColorStop(1, rgba(SCENE_COLORS.zombieMoon, 0));
        context.fillStyle = moonGlow;
        context.fillRect(
          centerX - moonRadius * 2.5,
          moonY - moonRadius * 2.5,
          moonRadius * 5,
          moonRadius * 5,
        );
        context.fillStyle = rgba(SCENE_COLORS.zombieMoon, intensity * 0.76);
        context.beginPath();
        context.arc(centerX, moonY, moonRadius, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = rgba(SCENE_COLORS.zombieSky, intensity * 0.22);
        context.beginPath();
        context.arc(
          centerX - moonRadius * 0.3,
          moonY - moonRadius * 0.12,
          moonRadius * 0.16,
          0,
          Math.PI * 2,
        );
        context.fill();

        // A small flock only crosses the moon during the opening part of a long cycle.
        const batCycle = (elapsed / 26_000 + regionIndex * 0.19) % 1;
        if (!reducedMotion.matches && batCycle < 0.3 && region.width > 54) {
          const batTravel = batCycle / 0.3;
          const batCount = performanceMode ? 2 : 4;
          for (let bat = 0; bat < batCount; bat += 1) {
            const direction = regionIndex ? -1 : 1;
            const startX = direction > 0 ? region.left - 24 : region.left + region.width + 24;
            const batX =
              startX +
              direction * batTravel * (region.width + 48) +
              direction * bat * 18;
            const batY =
              moonY +
              moonRadius * (0.12 + bat * 0.26) +
              Math.sin(elapsed * 0.004 + bat * 1.9) * 8;
            const wing = 5 + Math.sin(elapsed * 0.011 + bat * 1.4) * 3;
            context.strokeStyle = rgba([10, 12, 15], intensity * 0.9);
            context.lineWidth = 2;
            context.beginPath();
            context.moveTo(batX - 11, batY);
            context.quadraticCurveTo(batX - 6, batY - wing, batX, batY + 1);
            context.quadraticCurveTo(batX + 6, batY - wing, batX + 11, batY);
            context.stroke();
          }
        }

        const groundY = height * 0.8;
        context.fillStyle = rgba([12, 21, 17], intensity);
        context.beginPath();
        context.moveTo(region.left, groundY);
        for (let point = 0; point <= 8; point += 1) {
          const x = region.left + (region.width * point) / 8;
          const y = groundY - ((point * 29 + regionIndex * 17) % 28);
          context.lineTo(x, y);
        }
        context.lineTo(region.left + region.width, height);
        context.lineTo(region.left, height);
        context.closePath();
        context.fill();

        const graveCount = performanceMode ? 2 : 4;
        context.fillStyle = rgba([55, 61, 55], intensity * 0.94);
        context.strokeStyle = rgba([20, 25, 23], intensity * 0.92);
        context.lineWidth = 2;
        for (let grave = 0; grave < graveCount; grave += 1) {
          const graveX = region.left + region.width * ((grave + 0.5) / graveCount);
          const graveWidth = Math.min(34, Math.max(14, region.width / 8));
          const graveHeight = 40 + (grave % 3) * 13;
          const graveY = groundY - graveHeight + (grave % 2) * 14;
          context.beginPath();
          context.roundRect(graveX - graveWidth / 2, graveY, graveWidth, graveHeight, [10, 10, 2, 2]);
          context.fill();
          context.stroke();
          if (graveWidth > 22) {
            context.beginPath();
            context.moveTo(graveX, graveY + 12);
            context.lineTo(graveX, graveY + 29);
            context.moveTo(graveX - 7, graveY + 19);
            context.lineTo(graveX + 7, graveY + 19);
            context.stroke();
          }
        }

        // One or two walkers emerge occasionally, behind the foreground hands.
        const walkerCount = performanceMode || region.width < 180 ? 1 : 2;
        for (let walker = 0; walker < walkerCount; walker += 1) {
          const walkerCycle =
            (elapsed / 70_000 + regionIndex * 0.31 + walker * 0.56) % 1;
          if (!reducedMotion.matches && walkerCycle >= 0.58) continue;
          const travel = reducedMotion.matches ? 0.58 : walkerCycle / 0.58;
          const direction = (regionIndex + walker) % 2 === 0 ? 1 : -1;
          const walkerX =
            direction > 0
              ? region.left - 38 + travel * (region.width + 76)
              : region.left + region.width + 38 - travel * (region.width + 76);
          const scale = Math.min(1, Math.max(0.62, region.width / 230));
          const gaitPhase = reducedMotion.matches
            ? 0
            : travel * Math.PI * 2 * (13 + walker * 2) + walker * 1.4;
          const step = Math.sin(gaitPhase);
          const draggingStep = Math.sin(gaitPhase + 2.42) * 0.32;
          const leftLift = Math.max(0, step) * 5;
          const rightLift = Math.max(0, draggingStep) * 2;
          const bob = (1 - Math.cos(gaitPhase * 2)) * 0.58 * scale;
          const lurch = reducedMotion.matches ? -0.055 : -0.075 + step * 0.025;
          const silhouette = walker % 2 ? [25, 33, 27] as Rgb : [31, 39, 30] as Rgb;
          context.save();
          context.translate(walkerX, groundY - bob);
          context.scale(direction * scale, scale);
          context.rotate(lurch);
          context.lineCap = "round";
          context.lineJoin = "round";

          context.strokeStyle = rgba(silhouette, intensity * 0.98);
          context.lineWidth = 10;
          context.beginPath();
          context.moveTo(-8, -47);
          context.lineTo(-15 - step * 5, -20);
          context.lineTo(-19 + step * 14, 2 - leftLift);
          context.moveTo(9, -45);
          context.lineTo(18 + draggingStep * 3, -18);
          context.lineTo(24 - draggingStep * 6, 2 - rightLift);
          context.stroke();

          context.fillStyle = rgba(silhouette, intensity);
          context.beginPath();
          context.moveTo(-16, -105);
          context.quadraticCurveTo(-24, -73, -13, -42);
          context.lineTo(14, -42);
          context.quadraticCurveTo(23, -76, 13, -105);
          context.closePath();
          context.fill();

          const shoulderRoll = reducedMotion.matches ? 0 : Math.sin(gaitPhase * 0.5) * 4;
          context.strokeStyle = rgba(SCENE_COLORS.zombieSkin, intensity * 0.92);
          context.lineWidth = 8;
          context.beginPath();
          context.moveTo(-12, -91);
          context.lineTo(-25 - shoulderRoll, -73);
          context.lineTo(-40 - shoulderRoll * 0.6, -70 + step * 2);
          context.moveTo(12, -91);
          context.lineTo(29 + shoulderRoll * 0.4, -77);
          context.lineTo(47 + shoulderRoll, -73 - step * 2);
          context.stroke();

          context.fillStyle = rgba(SCENE_COLORS.zombieSkin, intensity * 0.96);
          context.beginPath();
          context.ellipse(0, -121, 15, 18, -0.12, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = rgba([16, 21, 18], intensity * 0.96);
          context.beginPath();
          context.arc(-5, -123, 2.2, 0, Math.PI * 2);
          context.arc(5, -122, 2.2, 0, Math.PI * 2);
          context.fill();
          context.fillStyle = rgba([19, 13, 16], intensity * 0.96);
          context.beginPath();
          context.ellipse(0, -112, 7.5, 5.2, -0.08, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = rgba(SCENE_COLORS.zombieBlood, intensity * 0.86);
          context.lineWidth = 1.8;
          context.beginPath();
          context.moveTo(-6, -115);
          context.lineTo(-2, -118);
          context.lineTo(2, -115);
          context.lineTo(6, -118);
          context.moveTo(5, -109);
          context.lineTo(4, -103);
          context.stroke();
          context.restore();
        }

        const armCount = performanceMode ? 3 : region.width > 150 ? 6 : 4;
        for (let arm = 0; arm < armCount; arm += 1) {
          const depth = 0.68 + ((arm * 31) % 4) * 0.09;
          const baseX =
            region.left + region.width * ((arm + 0.42) / Math.max(1, armCount));
          const armLength = Math.min(height * 0.43, 105 + (arm % 4) * 25);
          const sway = reducedMotion.matches
            ? 0
            : Math.sin(elapsed * (0.0007 + arm * 0.00008) + arm * 1.7) * 0.09;
          const lean = (arm % 2 ? 0.13 : -0.13) + sway;
          const skin = arm % 3 === 0 ? [104, 112, 73] as Rgb : SCENE_COLORS.zombieSkin;
          context.save();
          context.translate(baseX, height + 8);
          context.rotate(lean);
          context.lineCap = "round";
          context.strokeStyle = rgba(skin, intensity * depth);
          context.lineWidth = 17 * depth;
          context.beginPath();
          context.moveTo(0, 12);
          context.quadraticCurveTo(-8, -armLength * 0.48, 2, -armLength);
          context.stroke();

          const palmY = -armLength - 9 * depth;
          context.save();
          context.translate(2, palmY);
          context.rotate(Math.sin(elapsed * 0.0009 + arm) * 0.08);
          context.fillStyle = rgba(skin, intensity * depth);
          context.beginPath();
          context.ellipse(0, 0, 13 * depth, 19 * depth, 0, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = rgba(skin, intensity * depth);
          context.lineWidth = 5 * depth;
          const fingerSpread = [-1.05, -0.52, 0, 0.5, 1.02];
          fingerSpread.forEach((spread, finger) => {
            const fingerLength = (finger === 2 ? 28 : finger === 0 || finger === 4 ? 20 : 25) * depth;
            context.beginPath();
            context.moveTo(spread * 8 * depth, -10 * depth);
            context.quadraticCurveTo(
              spread * 13 * depth,
              -20 * depth,
              spread * 16 * depth,
              -fingerLength,
            );
            context.stroke();
          });
          context.strokeStyle = rgba(SCENE_COLORS.zombieBlood, intensity * 0.7);
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(-7 * depth, 3 * depth);
          context.lineTo(6 * depth, -5 * depth);
          context.moveTo(-4 * depth, 10 * depth);
          context.lineTo(8 * depth, 5 * depth);
          context.stroke();
          context.restore();
          context.restore();
        }
      });

      const fog = context.createLinearGradient(0, height * 0.58, 0, height);
      fog.addColorStop(0, rgba(SCENE_COLORS.zombieFog, 0));
      fog.addColorStop(0.72, rgba(SCENE_COLORS.zombieFog, intensity * 0.12));
      fog.addColorStop(1, rgba(SCENE_COLORS.zombieFog, intensity * 0.28));
      context.fillStyle = fog;
      context.fillRect(0, height * 0.5, width, height * 0.5);
      context.restore();
    }

    function drawLofi(elapsed: number) {
      const bounds = pageBounds();
      const regions = sideRegions(bounds);
      context.save();
      clipToSides(bounds);

      const room = context.createLinearGradient(0, 0, 0, height);
      room.addColorStop(0, rgba([18, 25, 47], intensity));
      room.addColorStop(0.58, rgba([68, 48, 75], intensity * 0.98));
      room.addColorStop(1, rgba([31, 27, 45], intensity));
      context.fillStyle = room;
      context.fillRect(0, 0, width, height);

      regions.forEach((region, regionIndex) => {
        if (region.width < 24) return;
        const regionRight = region.left + region.width;
        const margin = Math.max(7, region.width * 0.08);
        const sceneLeft = region.left + margin;
        const sceneWidth = Math.max(12, region.width - margin * 2);
        const readerScale = Math.min(29, Math.max(16, region.width * 0.078));
        const deskY = height * 0.73;
        const deskFrontDepth = Math.max(
          22,
          Math.min(height * 0.055, readerScale * 1.25),
        );
        const deskFrontY = deskY + deskFrontDepth;
        const lampX = region.left + region.width * (regionIndex ? 0.82 : 0.2);
        const lampY = height * 0.55;
        const deskSurfaceYAt = (x: number) => {
          const ratio = Math.min(
            1,
            Math.max(0, (x - region.left) / Math.max(1, region.width)),
          );
          return deskY + height * (0.003 - ratio * 0.008);
        };
        const lampDeskY = deskSurfaceYAt(lampX);
        const windowTop = height * 0.08;
        const windowHeight = Math.min(height * 0.48, sceneWidth * 1.12 + 45);

        // A cool floor plane and a barely-there baseboard push the furniture
        // away from the wall without adding visual clutter.
        const floorTopY = height * 0.78;
        const floor = context.createLinearGradient(0, floorTopY, 0, height);
        floor.addColorStop(0, rgba([38, 30, 47], intensity * 0.96));
        floor.addColorStop(1, rgba([21, 20, 34], intensity));
        context.fillStyle = floor;
        context.fillRect(region.left, floorTopY, region.width, height - floorTopY);
        context.strokeStyle = rgba([137, 91, 103], intensity * 0.18);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(region.left, floorTopY);
        context.lineTo(regionRight, floorTopY);
        context.stroke();

        if (regionIndex === 1 && sceneWidth > 120) {
          // Muted shapes read like a shelf in soft focus. Their low contrast
          // keeps the reader and her book in front of the room dressing.
          const shelfX = sceneLeft + sceneWidth * 0.05;
          const shelfY = height * 0.23;
          const shelfWidth = sceneWidth * 0.34;
          context.fillStyle = rgba([21, 22, 39], intensity * 0.2);
          context.fillRect(shelfX + 3, shelfY + 5, shelfWidth, 6);
          context.fillStyle = rgba([61, 43, 57], intensity * 0.32);
          context.fillRect(shelfX, shelfY, shelfWidth, 5);
          const mutedBooks: Array<[number, number, number, Rgb]> = [
            [0.08, 0.18, 0.055, [105, 65, 79]],
            [0.15, 0.24, 0.05, [63, 70, 91]],
            [0.215, 0.15, 0.062, [128, 78, 70]],
          ];
          mutedBooks.forEach(([offset, bookHeight, bookWidth, color]) => {
            context.fillStyle = rgba(color, intensity * 0.28);
            context.fillRect(
              shelfX + shelfWidth * offset,
              shelfY - height * bookHeight * 0.18,
              Math.max(3, shelfWidth * bookWidth),
              height * bookHeight * 0.18,
            );
          });
          const plantX = shelfX + shelfWidth * 0.78;
          context.fillStyle = rgba([96, 67, 70], intensity * 0.28);
          context.beginPath();
          context.moveTo(plantX - 6, shelfY - 1);
          context.lineTo(plantX + 6, shelfY - 1);
          context.lineTo(plantX + 4, shelfY - 12);
          context.lineTo(plantX - 4, shelfY - 12);
          context.closePath();
          context.fill();
          context.strokeStyle = rgba([54, 79, 70], intensity * 0.3);
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(plantX, shelfY - 11);
          context.quadraticCurveTo(plantX - 11, shelfY - 22, plantX - 15, shelfY - 31);
          context.moveTo(plantX, shelfY - 12);
          context.quadraticCurveTo(plantX + 9, shelfY - 24, plantX + 13, shelfY - 28);
          context.stroke();
        }

        // The lamp's ambient halo belongs on the wall, behind the character.
        // Keeping it here avoids tinting every foreground shape uniformly.
        const wallGlowX = lampX - region.width * 0.08;
        const wallGlowY = lampY + height * 0.035;
        const wallGlowRadius = Math.max(95, region.width * 0.58);
        const wallGlow = context.createRadialGradient(
          wallGlowX,
          wallGlowY,
          0,
          wallGlowX,
          wallGlowY,
          wallGlowRadius,
        );
        wallGlow.addColorStop(0, rgba([255, 187, 108], intensity * 0.18));
        wallGlow.addColorStop(0.35, rgba([255, 187, 108], intensity * 0.09));
        wallGlow.addColorStop(1, rgba([255, 187, 108], 0));
        context.fillStyle = wallGlow;
        context.fillRect(
          wallGlowX - wallGlowRadius,
          wallGlowY - wallGlowRadius,
          wallGlowRadius * 2,
          wallGlowRadius * 2,
        );

        if (regionIndex === 0) {
          context.fillStyle = rgba([18, 26, 50], intensity * 0.98);
          context.beginPath();
          context.roundRect(sceneLeft, windowTop, sceneWidth, windowHeight, 7);
          context.fill();

          // Everything outside the glass is clipped before the wooden frame is drawn.
          context.save();
          context.beginPath();
          context.roundRect(sceneLeft, windowTop, sceneWidth, windowHeight, 7);
          context.clip();
          context.fillStyle = rgba([85, 72, 103], intensity * 0.86);
          const buildingCount = performanceMode ? 4 : 7;
          for (let building = 0; building < buildingCount; building += 1) {
            const buildingWidth = sceneWidth / buildingCount;
            const buildingHeight = windowHeight * (0.14 + (building % 4) * 0.055);
            const buildingX = sceneLeft + building * (sceneWidth / buildingCount);
            const buildingY = windowTop + windowHeight - buildingHeight;
            context.fillRect(buildingX, buildingY, buildingWidth + 0.5, buildingHeight);
            context.fillStyle = rgba(SCENE_COLORS.lofiLamp, intensity * 0.55);
            if (building % 2 === 0) {
              context.fillRect(buildingX + 4, buildingY + 7, 3, 4);
            }
            context.fillStyle = rgba([85, 72, 103], intensity * 0.86);
          }

          context.strokeStyle = rgba(SCENE_COLORS.windowLight, intensity * 0.34);
          context.lineWidth = 1;
          const dropCount = performanceMode ? 8 : 15;
          for (let drop = 0; drop < dropCount; drop += 1) {
            const x = sceneLeft + ((drop * 47) % Math.max(1, sceneWidth));
            const progress = (drop * 0.071 + elapsed * 0.00009 * (1 + drop % 3)) % 1;
            const y = windowTop + progress * windowHeight;
            context.beginPath();
            context.moveTo(x, y);
            context.lineTo(x - 2, y + 10 + (drop % 4) * 3);
            context.stroke();
          }
          context.restore();

          context.strokeStyle = rgba([192, 134, 116], intensity * 0.8);
          context.lineWidth = Math.max(3, sceneWidth * 0.035);
          context.beginPath();
          context.roundRect(sceneLeft, windowTop, sceneWidth, windowHeight, 7);
          context.stroke();
          context.beginPath();
          context.moveTo(sceneLeft + sceneWidth / 2, windowTop);
          context.lineTo(sceneLeft + sceneWidth / 2, windowTop + windowHeight);
          context.moveTo(sceneLeft, windowTop + windowHeight * 0.55);
          context.lineTo(sceneLeft + sceneWidth, windowTop + windowHeight * 0.55);
          context.stroke();
        }

        const bookX = region.left + region.width * (regionIndex ? 0.43 : 0.5);
        const bookDeskY = deskSurfaceYAt(bookX);
        const bookHalfWidth = Math.min(44, Math.max(22, sceneWidth * 0.22));
        const bookDepth = Math.min(31, bookHalfWidth * 0.68);
        const pageShadow: Rgb = [178, 134, 111];
        const bookTopY = bookDeskY - bookDepth * 1.13;
        const bookSpineTopY = bookDeskY - bookDepth * 1.06;
        const bookBottomY = bookDeskY - bookDepth * 0.76;
        const bookOuterY = bookDeskY - bookDepth * 0.82;
        const bookCoverSpineTopY = bookDeskY - bookDepth * 0.8;
        const bookCoverFarY = bookDeskY - bookDepth * 0.86;
        const bookCoverBottomY = bookDeskY - 3;
        const bookCoverOuterY = bookDeskY - 3 - bookDepth * 0.08;
        const leftPageX = bookX - bookHalfWidth * 0.94;
        const rightPageX = bookX + bookHalfWidth * 0.94;
        const leftPageFarX = bookX - bookHalfWidth * 0.86;
        const rightPageFarX = bookX + bookHalfWidth * 0.86;
        const leftCoverFarX = bookX - bookHalfWidth * 0.96;
        const rightCoverFarX = bookX + bookHalfWidth * 0.96;
        const leftCoverNearX = bookX - bookHalfWidth * 1.06;
        const rightCoverNearX = bookX + bookHalfWidth * 1.06;
        const pageCycle = ((elapsed + 4_800) % 9_800) / 9_800;
        const isPageTurning = !reducedMotion.matches && pageCycle < 0.17;
        const rawPageTurn = isPageTurning ? pageCycle / 0.17 : 0;
        const rawPageFlip = Math.min(
          1,
          Math.max(0, (rawPageTurn - 0.18) / 0.64),
        );
        const pageTurnProgress =
          rawPageFlip * rawPageFlip * (3 - 2 * rawPageFlip);
        const pageTurnLift = isPageTurning
          ? Math.sin(pageTurnProgress * Math.PI)
          : 0;
        const pageHandTravel = isPageTurning
          ? Math.sin(pageTurnProgress * Math.PI)
          : 0;
        const rawPageHandLift = Math.min(1, rawPageTurn / 0.18);
        const pageHandLiftApproach =
          rawPageHandLift * rawPageHandLift * (3 - 2 * rawPageHandLift);
        const rawPageHandLower = Math.min(
          1,
          Math.max(0, (pageTurnProgress - 0.48) / 0.46),
        );
        const pageHandLower =
          rawPageHandLower *
          rawPageHandLower *
          (3 - 2 * rawPageHandLower);
        const pageHandLift = isPageTurning
          ? rawPageTurn < 0.18
            ? pageHandLiftApproach
            : pageTurnProgress < 0.48
              ? 1
              : 1 - pageHandLower
          : 0;
        const pageHandIsHolding =
          isPageTurning && rawPageTurn >= 0.18 && pageTurnProgress < 0.48;
        const turningPageScale = Math.cos(pageTurnProgress * Math.PI);
        const turningEdgeX =
          bookX + bookHalfWidth * 0.94 * turningPageScale;
        const turningPageLift =
          pageTurnLift *
          Math.sqrt(Math.abs(turningPageScale)) *
          Math.min(4, bookHalfWidth * 0.1);
        const turningFarEdgeX =
          bookX + bookHalfWidth * 0.86 * turningPageScale;
        const turningEdgeBottomY =
          bookOuterY - turningPageLift * 0.15;
        const pageIsEdgeOn = Math.abs(turningPageScale) < 0.045;
        const rightHandRestX = bookX + bookHalfWidth * 0.84;
        const rightHandGripStartX = bookX + bookHalfWidth * 0.86;
        const rightHandReleaseX = bookX + bookHalfWidth * 0.05;
        const rightHandX = !isPageTurning
          ? rightHandRestX
          : rawPageTurn < 0.18
            ? rightHandRestX +
              (rightHandGripStartX - rightHandRestX) * pageHandLiftApproach
            : pageTurnProgress < 0.48
              ? turningFarEdgeX
              : rightHandReleaseX +
                (rightHandRestX - rightHandReleaseX) * pageHandLower;
        if (!performanceMode) {
          const cone = context.createLinearGradient(lampX, lampY + 12, bookX, deskY);
          cone.addColorStop(0, rgba(SCENE_COLORS.lofiLamp, intensity * 0.025));
          cone.addColorStop(1, rgba(SCENE_COLORS.lofiLamp, intensity * 0.07));
          context.fillStyle = cone;
          context.beginPath();
          context.moveTo(lampX - 7, lampY + 12);
          context.quadraticCurveTo(
            lampX - region.width * 0.12,
            lampY + height * 0.11,
            bookX - bookHalfWidth * 1.45,
            bookDeskY + 5,
          );
          context.lineTo(bookX + bookHalfWidth * 1.45, bookDeskY + 5);
          context.quadraticCurveTo(
            lampX - region.width * 0.01,
            lampY + height * 0.11,
            lampX + 7,
            lampY + 12,
          );
          context.closePath();
          context.fill();
        }

        const deskFarLeftY = deskY - height * 0.016;
        const deskFarRightY = deskY - height * 0.024;
        const deskNearLeftY = deskY + height * 0.022;
        const deskNearRightY = deskY + height * 0.014;
        const deskSurface = context.createLinearGradient(
          region.left,
          deskY,
          regionRight,
          deskY,
        );
        if (regionIndex === 1) {
          deskSurface.addColorStop(0, rgba([72, 48, 66], intensity * 0.98));
          deskSurface.addColorStop(0.55, rgba([101, 59, 59], intensity * 0.98));
          deskSurface.addColorStop(1, rgba([122, 70, 56], intensity * 0.98));
        } else {
          deskSurface.addColorStop(0, rgba([120, 68, 56], intensity * 0.98));
          deskSurface.addColorStop(0.45, rgba([98, 58, 60], intensity * 0.98));
          deskSurface.addColorStop(1, rgba([70, 47, 65], intensity * 0.98));
        }
        context.fillStyle = deskSurface;
        context.beginPath();
        context.moveTo(region.left, deskFarLeftY);
        context.lineTo(regionRight, deskFarRightY);
        context.lineTo(regionRight, deskNearRightY);
        context.lineTo(region.left, deskNearLeftY);
        context.closePath();
        context.fill();

        // Slender, slightly splayed legs reinforce the lower viewpoint.
        context.fillStyle = rgba([48, 31, 39], intensity * 0.94);
        [
          [0.12, 0.095],
          [0.82, 0.845],
        ].forEach(([topRatio, bottomRatio]) => {
          const topX = region.left + region.width * topRatio;
          const bottomX = region.left + region.width * bottomRatio;
          context.beginPath();
          context.moveTo(topX, deskFrontY - 2);
          context.lineTo(topX + 8, deskFrontY - 2);
          context.lineTo(bottomX + 7, height);
          context.lineTo(bottomX, height);
          context.closePath();
          context.fill();
        });

        if (regionIndex === 1 && sceneWidth > 72) {
          const scale = readerScale;
          const bodyX = region.left + region.width * 0.56;
          const tableBottom = deskFrontY;
          const floorY = height * 0.96;
          const bodyBackOffset = scale * 0.45;
          const headX = bodyX - scale * 0.32;
          const headY = deskY - scale * 4.43 - bodyBackOffset;
          const shoulderY = headY + scale * 1.45;
          // The torso continues behind the table edge instead of ending on
          // top of it, which keeps the pelvis aligned with the hidden thighs.
          const hipY = deskY + scale * 0.72 - bodyBackOffset;
          const seatY = hipY + scale * 0.12;
          const seatFrontY = tableBottom + scale * 0.08;
          const skin: Rgb = [201, 145, 119];
          const skinShade: Rgb = [151, 92, 84];
          const trousers: Rgb = [57, 57, 78];
          const shoes: Rgb = [224, 211, 194];
          const chair: Rgb = [52, 42, 58];

          // Chair: a broad backrest, a real seat and two visible wooden legs.
          context.fillStyle = rgba(chair, intensity * 0.94);
          context.beginPath();
          context.roundRect(
            bodyX + scale * 0.05,
            shoulderY + scale * 0.2,
            scale * 1.8,
            Math.max(scale * 1.7, deskY - shoulderY),
            scale * 0.55,
          );
          context.fill();
          context.beginPath();
          context.roundRect(
            bodyX - scale * 0.65,
            seatY,
            scale * 2.15,
            scale * 0.38,
            scale * 0.18,
          );
          context.fill();
          context.beginPath();
          context.roundRect(
            bodyX - scale * 0.55,
            seatFrontY,
            scale * 1.72,
            scale * 0.22,
            scale * 0.11,
          );
          context.fill();

          const chairFloorY = floorY - scale * 0.08;
          const chairLegs = [
            {
              bottomX: bodyX - scale * 0.08,
              opacity: 0.58,
              topX: bodyX - scale * 0.18,
            },
            {
              bottomX: bodyX + scale * 0.82,
              opacity: 0.62,
              topX: bodyX + scale * 0.72,
            },
            {
              bottomX: bodyX - scale * 0.74,
              opacity: 0.98,
              topX: bodyX - scale * 0.5,
            },
            {
              bottomX: bodyX + scale * 1.24,
              opacity: 0.98,
              topX: bodyX + scale * 1.04,
            },
          ];
          chairLegs.forEach(({ bottomX, opacity }) => {
            context.fillStyle = rgba(
              [17, 16, 27],
              intensity * 0.42 * opacity,
            );
            context.beginPath();
            context.ellipse(
              bottomX,
              chairFloorY + scale * 0.09,
              scale * 0.25,
              scale * 0.065,
              0,
              0,
              Math.PI * 2,
            );
            context.fill();
          });
          context.lineCap = "round";
          context.lineJoin = "round";
          chairLegs.forEach(({ bottomX, opacity, topX }) => {
            context.strokeStyle = rgba(chair, intensity * 0.94 * opacity);
            context.lineWidth = Math.max(3.5, scale * 0.16);
            context.beginPath();
            context.moveTo(topX, seatFrontY + scale * 0.14);
            context.lineTo(bottomX, chairFloorY);
            context.stroke();
          });
          const chairBraceY =
            seatFrontY + (chairFloorY - seatFrontY) * 0.48;
          context.strokeStyle = rgba([63, 48, 64], intensity * 0.96);
          context.lineWidth = Math.max(4, scale * 0.14);
          context.beginPath();
          context.moveTo(bodyX - scale * 0.56, chairBraceY);
          context.lineTo(bodyX + scale * 1.08, chairBraceY - scale * 0.03);
          context.stroke();
          context.strokeStyle = rgba([48, 40, 56], intensity * 0.52);
          context.lineWidth = Math.max(2, scale * 0.075);
          context.beginPath();
          context.moveTo(bodyX - scale * 0.05, chairBraceY + scale * 0.18);
          context.lineTo(bodyX + scale * 0.8, chairBraceY + scale * 0.14);
          context.stroke();

          context.strokeStyle = rgba([105, 72, 82], intensity * 0.5);
          context.lineWidth = Math.max(1, scale * 0.045);
          chairLegs.forEach(({ bottomX, opacity, topX }) => {
            context.globalAlpha = opacity;
            context.beginPath();
            context.moveTo(topX + scale * 0.055, seatFrontY + scale * 0.2);
            context.lineTo(bottomX + scale * 0.04, chairFloorY - scale * 0.08);
            context.stroke();
          });
          context.globalAlpha = 1;

          const footRestYAt = (x: number) => {
            const ratio = Math.min(
              1,
              Math.max(
                0,
                (x - (bodyX - scale * 0.56)) / (scale * 1.64),
              ),
            );
            return chairBraceY - ratio * scale * 0.03;
          };

          // A seated silhouette: thighs travel forward, then the shins fold back
          // from two clearly separated knees instead of dropping straight down.
          const legDropToFootrest = chairBraceY - tableBottom;
          const kneeCycle = (elapsed % 10_000) / 10_000;
          const kneeIsFidgeting =
            !reducedMotion.matches && kneeCycle > 0.58 && kneeCycle < 0.9;
          const kneeLocalTime = kneeIsFidgeting
            ? (kneeCycle - 0.58) / 0.32
            : 0;
          const kneeEnvelope = kneeIsFidgeting
            ? Math.sin(kneeLocalTime * Math.PI) ** 2
            : 0;
          const kneeFidget = kneeIsFidgeting
            ? Math.sin(kneeLocalTime * Math.PI * 4) * kneeEnvelope
            : 0;
          const kneeCounterFidget = kneeFidget * -0.34;
          const farAnkleX = bodyX + scale * 0.5;
          const nearAnkleX = bodyX - scale * 0.3;
          const farShoeY = footRestYAt(farAnkleX) - scale * 0.15;
          const nearShoeY = footRestYAt(nearAnkleX) - scale * 0.15;
          const legs = [
            {
              ankleX: farAnkleX,
              ankleY: farShoeY - scale * 0.31,
              kneeX:
                bodyX - scale * 0.35 + kneeCounterFidget * scale * 0.07,
              kneeY:
                tableBottom +
                legDropToFootrest * 0.3 -
                kneeCounterFidget * scale * 0.045,
              startX: bodyX + scale * 0.38,
              startY: hipY,
              opacity: 0.84,
              shoeRotation: -0.025,
              shoeY: farShoeY,
            },
            {
              ankleX: nearAnkleX,
              ankleY: nearShoeY - scale * 0.3,
              kneeX: bodyX - scale * 1.25 + kneeFidget * scale * 0.13,
              kneeY:
                tableBottom +
                legDropToFootrest * 0.38 -
                kneeFidget * scale * 0.08,
              startX: bodyX - scale * 0.32,
              startY: hipY + scale * 0.05,
              opacity: 0.98,
              shoeRotation: 0.035,
              shoeY: nearShoeY,
            },
          ];
          context.lineCap = "round";
          context.lineJoin = "round";
          legs.forEach(
            ({ ankleX, ankleY, kneeX, kneeY, opacity, startX, startY }) => {
              context.strokeStyle = rgba(trousers, intensity * opacity);
              context.lineWidth = Math.max(11, scale * 0.63);
              context.beginPath();
              context.moveTo(startX, startY);
              context.lineTo(kneeX, kneeY);
              context.stroke();

              context.lineWidth = Math.max(9, scale * 0.49);
              context.beginPath();
              context.moveTo(kneeX, kneeY);
              context.lineTo(ankleX, ankleY);
              context.stroke();

              context.fillStyle = rgba(trousers, intensity * opacity);
              context.beginPath();
              context.ellipse(
                kneeX,
                kneeY,
                scale * 0.31,
                scale * 0.28,
                0,
                0,
                Math.PI * 2,
              );
              context.fill();
            },
          );

          // Small trouser creases make each knee joint readable at a glance.
          context.lineWidth = Math.max(1.2, scale * 0.065);
          legs.forEach(({ kneeX, kneeY }, index) => {
            context.strokeStyle = rgba([38, 38, 55], intensity * (index ? 0.62 : 0.46));
            context.beginPath();
            context.moveTo(kneeX - scale * 0.2, kneeY - scale * 0.03);
            context.quadraticCurveTo(
              kneeX,
              kneeY + scale * 0.09,
              kneeX + scale * 0.2,
              kneeY + scale * 0.02,
            );
            context.stroke();
          });

          context.strokeStyle = rgba([116, 112, 143], intensity * 0.18);
          context.lineWidth = Math.max(1, scale * 0.045);
          legs.forEach(({ ankleX, ankleY, kneeX, kneeY, startX, startY }) => {
            context.beginPath();
            context.moveTo(startX + scale * 0.1, startY + scale * 0.08);
            context.quadraticCurveTo(
              kneeX + scale * 0.12,
              kneeY - scale * 0.08,
              ankleX + scale * 0.08,
              ankleY - scale * 0.08,
            );
            context.stroke();
          });

          context.strokeStyle = rgba([183, 155, 151], intensity * 0.95);
          context.lineWidth = Math.max(5, scale * 0.28);
          legs.forEach(({ ankleX, ankleY, shoeY }) => {
            context.beginPath();
            context.moveTo(ankleX, ankleY - scale * 0.04);
            context.lineTo(ankleX, shoeY - scale * 0.22);
            context.stroke();
          });

          legs.forEach(({ ankleX, shoeRotation, shoeY }) => {
            context.fillStyle = rgba([18, 17, 29], intensity * 0.5);
            context.beginPath();
            context.ellipse(
              ankleX - scale * 0.2,
              shoeY + scale * 0.14,
              scale * 0.58,
              scale * 0.055,
              shoeRotation,
              0,
              Math.PI * 2,
            );
            context.fill();

            context.save();
            context.translate(ankleX, shoeY);
            context.rotate(shoeRotation);
            context.fillStyle = rgba(shoes, intensity * 0.98);
            context.beginPath();
            context.moveTo(scale * 0.29, -scale * 0.06);
            context.quadraticCurveTo(
              scale * 0.34,
              scale * 0.12,
              scale * 0.08,
              scale * 0.15,
            );
            context.lineTo(-scale * 0.67, scale * 0.13);
            context.quadraticCurveTo(
              -scale * 0.88,
              scale * 0.08,
              -scale * 0.79,
              -scale * 0.09,
            );
            context.quadraticCurveTo(
              -scale * 0.47,
              -scale * 0.3,
              -scale * 0.15,
              -scale * 0.31,
            );
            context.quadraticCurveTo(
              scale * 0.18,
              -scale * 0.28,
              scale * 0.29,
              -scale * 0.06,
            );
            context.closePath();
            context.fill();
            context.strokeStyle = rgba([111, 86, 100], intensity * 0.78);
            context.lineWidth = Math.max(1, scale * 0.055);
            context.beginPath();
            context.moveTo(-scale * 0.72, scale * 0.07);
            context.quadraticCurveTo(
              -scale * 0.2,
              scale * 0.14,
              scale * 0.25,
              scale * 0.08,
            );
            context.moveTo(-scale * 0.32, -scale * 0.18);
            context.lineTo(-scale * 0.06, -scale * 0.13);
            context.moveTo(-scale * 0.37, -scale * 0.1);
            context.lineTo(-scale * 0.09, -scale * 0.06);
            context.stroke();
            context.restore();
          });

          // A compact torso (roughly 2.5 head radii) leans slightly toward the book.
          const torsoTableY = deskSurfaceYAt(bodyX) + scale * 0.06;
          context.save();
          context.beginPath();
          context.rect(region.left, 0, region.width, torsoTableY);
          context.clip();
          const sweaterBodyGradient = context.createLinearGradient(
            bodyX - scale * 1.2,
            shoulderY,
            bodyX + scale * 1.15,
            shoulderY,
          );
          sweaterBodyGradient.addColorStop(0, rgba([128, 66, 83], intensity * 0.99));
          sweaterBodyGradient.addColorStop(
            0.52,
            rgba(SCENE_COLORS.lofiSweater, intensity * 0.99),
          );
          sweaterBodyGradient.addColorStop(1, rgba([202, 112, 96], intensity * 0.99));
          context.fillStyle = sweaterBodyGradient;
          context.beginPath();
          context.moveTo(bodyX - scale * 1.08, shoulderY + scale * 0.08);
          context.quadraticCurveTo(
            bodyX - scale * 0.12,
            shoulderY - scale * 0.55,
            bodyX + scale * 1.02,
            shoulderY + scale * 0.16,
          );
          context.quadraticCurveTo(
            bodyX + scale * 0.9,
            shoulderY + scale * 1.7,
            bodyX + scale * 0.7,
            hipY,
          );
          context.lineTo(bodyX - scale * 0.72, hipY);
          context.quadraticCurveTo(
            bodyX - scale * 0.98,
            shoulderY + scale * 1.55,
            bodyX - scale * 1.08,
            shoulderY + scale * 0.08,
          );
          context.closePath();
          context.fill();
          context.strokeStyle = rgba([226, 145, 132], intensity * 0.52);
          context.lineWidth = Math.max(1.2, scale * 0.06);
          context.beginPath();
          context.arc(
            bodyX - scale * 0.06,
            shoulderY + scale * 0.08,
            scale * 0.46,
            0.08 * Math.PI,
            0.92 * Math.PI,
          );
          context.stroke();

          // Three quiet knit lines break up the perfectly flat sweater fill.
          context.strokeStyle = rgba([243, 170, 145], intensity * 0.1);
          context.lineWidth = Math.max(0.8, scale * 0.035);
          context.beginPath();
          [-0.46, -0.08, 0.3].forEach((offset, index) => {
            context.moveTo(
              bodyX + scale * offset,
              shoulderY + scale * (0.72 + index * 0.12),
            );
            context.quadraticCurveTo(
              bodyX + scale * (offset + 0.18),
              shoulderY + scale * (1.15 + index * 0.09),
              bodyX + scale * (offset + 0.12),
              shoulderY + scale * (1.52 + index * 0.07),
            );
          });
          context.stroke();
          context.restore();

          // Narrow neck centered under the jaw, with no hair crossing it.
          const neckCenterX = headX + scale * 0.08;
          context.fillStyle = rgba(skin, intensity * 0.98);
          context.beginPath();
          context.moveTo(neckCenterX - scale * 0.15, headY + scale * 0.68);
          context.lineTo(neckCenterX + scale * 0.15, headY + scale * 0.68);
          context.lineTo(neckCenterX + scale * 0.21, shoulderY + scale * 0.04);
          context.lineTo(neckCenterX - scale * 0.21, shoulderY + scale * 0.04);
          context.closePath();
          context.fill();

          // Articulated arms: tapered sleeves, rounded elbows, cuffs and visible
          // forearms keep the hands connected naturally to the shoulders.
          const armBreath = reducedMotion.matches
            ? 0
            : Math.sin(elapsed * 0.00135) * scale * 0.025;
          const rightHandRestY =
            bookCoverBottomY +
            (bookCoverOuterY - bookCoverBottomY) * 0.78 +
            scale * 0.075;
          const rightHandPageY = bookOuterY - bookDepth * 0.14;
          const rightHandY =
            rightHandRestY +
            (rightHandPageY - rightHandRestY) * pageHandLift;
          const wrists = [
            {
              x: bookX - bookHalfWidth * 0.78,
              y:
                bookCoverBottomY +
                (bookCoverOuterY - bookCoverBottomY) * 0.78 +
                scale * 0.075,
            },
            {
              x: rightHandX,
              y: rightHandY,
            },
          ];
          const elbows = [
            {
              x: bodyX - scale * 1.75,
              y: shoulderY + scale * 1.5 + armBreath,
            },
            {
              x: bodyX + scale * (0.76 - pageHandTravel * 0.48),
              y:
                shoulderY +
                scale * 1.5 -
                pageHandLift * scale * 0.16 +
                armBreath,
            },
          ];
          const shoulders = [
            {
              x: bodyX - scale * 0.9,
              y: shoulderY + scale * 0.22 + armBreath,
            },
            {
              x: bodyX + scale * 0.78,
              y: shoulderY + scale * 0.28 + armBreath,
            },
          ];
          const sweaterShade: Rgb = [139, 70, 78];
          context.lineCap = "round";
          context.lineJoin = "round";
          shoulders.forEach((shoulder, index) => {
            const elbow = elbows[index]!;
            const wrist = wrists[index]!;
            const forearmX = wrist.x - elbow.x;
            const forearmY = wrist.y - elbow.y;
            const forearmLength = Math.max(
              1,
              Math.hypot(forearmX, forearmY),
            );
            const cuff = {
              x: elbow.x + forearmX * 0.78,
              y: elbow.y + forearmY * 0.78,
            };
            const normalX = -forearmY / forearmLength;
            const normalY = forearmX / forearmLength;

            // A darker under-stroke gives both sleeve sections some volume.
            context.strokeStyle = rgba(
              sweaterShade,
              intensity * (index ? 0.72 : 0.82),
            );
            context.lineWidth = Math.max(10, scale * 0.62);
            context.beginPath();
            context.moveTo(shoulder.x, shoulder.y);
            context.lineTo(elbow.x, elbow.y);
            context.lineTo(cuff.x, cuff.y);
            context.stroke();

            context.strokeStyle = rgba(
              SCENE_COLORS.lofiSweater,
              intensity * (index ? 0.96 : 1),
            );
            context.lineWidth = Math.max(9, scale * 0.54);
            context.beginPath();
            context.moveTo(shoulder.x, shoulder.y);
            context.lineTo(elbow.x, elbow.y);
            context.stroke();

            context.lineWidth = Math.max(8, scale * 0.46);
            context.beginPath();
            context.moveTo(elbow.x, elbow.y);
            context.lineTo(cuff.x, cuff.y);
            context.stroke();

            context.fillStyle = rgba(
              SCENE_COLORS.lofiSweater,
              intensity * (index ? 0.96 : 1),
            );
            context.beginPath();
            context.ellipse(
              elbow.x,
              elbow.y,
              scale * 0.29,
              scale * 0.27,
              0,
              0,
              Math.PI * 2,
            );
            context.fill();

            // Sleeve fold at the elbow and a narrow ribbed cuff.
            context.strokeStyle = rgba(sweaterShade, intensity * 0.72);
            context.lineWidth = Math.max(1, scale * 0.055);
            context.beginPath();
            context.moveTo(
              elbow.x - normalX * scale * 0.16,
              elbow.y - normalY * scale * 0.16,
            );
            context.quadraticCurveTo(
              elbow.x - (forearmX / forearmLength) * scale * 0.08,
              elbow.y - (forearmY / forearmLength) * scale * 0.08,
              elbow.x + normalX * scale * 0.16,
              elbow.y + normalY * scale * 0.16,
            );
            context.moveTo(
              cuff.x - normalX * scale * 0.19,
              cuff.y - normalY * scale * 0.19,
            );
            context.lineTo(
              cuff.x + normalX * scale * 0.19,
              cuff.y + normalY * scale * 0.19,
            );
            context.stroke();

            context.strokeStyle = rgba(skin, intensity * 0.98);
            context.lineWidth = Math.max(5, scale * 0.22);
            context.beginPath();
            context.moveTo(cuff.x, cuff.y);
            context.lineTo(wrist.x, wrist.y);
            context.stroke();

            if (index === 1) {
              context.strokeStyle = rgba([238, 168, 125], intensity * 0.24);
              context.lineWidth = Math.max(1, scale * 0.055);
              context.beginPath();
              context.moveTo(cuff.x + scale * 0.035, cuff.y - scale * 0.04);
              context.lineTo(wrist.x + scale * 0.035, wrist.y - scale * 0.04);
              context.stroke();

              context.strokeStyle = rgba([239, 155, 126], intensity * 0.2);
              context.lineWidth = Math.max(1, scale * 0.05);
              context.beginPath();
              context.moveTo(shoulder.x + scale * 0.08, shoulder.y - scale * 0.04);
              context.quadraticCurveTo(
                elbow.x + scale * 0.08,
                elbow.y - scale * 0.08,
                cuff.x + scale * 0.05,
                cuff.y - scale * 0.04,
              );
              context.stroke();
            }
          });

          // Rounded ponytail remains entirely behind and to the right of the skull.
          context.fillStyle = rgba(SCENE_COLORS.lofiHair, intensity);
          context.beginPath();
          context.moveTo(headX + scale * 0.58, headY - scale * 0.42);
          context.bezierCurveTo(
            headX + scale * 1.2,
            headY - scale * 0.3,
            headX + scale * 1.34,
            headY + scale * 0.28,
            headX + scale * 1.02,
            headY + scale * 0.75,
          );
          context.bezierCurveTo(
            headX + scale * 1.08,
            headY + scale * 0.22,
            headX + scale * 0.78,
            headY - scale * 0.02,
            headX + scale * 0.5,
            headY - scale * 0.2,
          );
          context.closePath();
          context.fill();

          // Hair covers only the crown and side edges; it never continues under the chin.
          context.beginPath();
          context.moveTo(headX - scale * 0.72, headY + scale * 0.38);
          context.bezierCurveTo(
            headX - scale * 0.9,
            headY - scale * 0.46,
            headX - scale * 0.5,
            headY - scale * 1.04,
            headX + scale * 0.08,
            headY - scale * 1.05,
          );
          context.bezierCurveTo(
            headX + scale * 0.7,
            headY - scale * 1.04,
            headX + scale * 0.94,
            headY - scale * 0.34,
            headX + scale * 0.72,
            headY + scale * 0.5,
          );
          context.lineTo(headX + scale * 0.46, headY + scale * 0.4);
          context.quadraticCurveTo(
            headX + scale * 0.54,
            headY - scale * 0.22,
            headX + scale * 0.08,
            headY - scale * 0.76,
          );
          context.quadraticCurveTo(
            headX - scale * 0.5,
            headY - scale * 0.72,
            headX - scale * 0.5,
            headY + scale * 0.36,
          );
          context.closePath();
          context.fill();

          context.fillStyle = rgba(skin, intensity * 0.99);
          context.beginPath();
          context.ellipse(
            headX - scale * 0.08,
            headY + scale * 0.08,
            scale * 0.65,
            scale * 0.79,
            -0.08,
            0,
            Math.PI * 2,
          );
          context.fill();

          context.save();
          context.beginPath();
          context.ellipse(
            headX - scale * 0.08,
            headY + scale * 0.08,
            scale * 0.65,
            scale * 0.79,
            -0.08,
            0,
            Math.PI * 2,
          );
          context.clip();
          const faceLight = context.createLinearGradient(
            headX - scale * 0.75,
            headY,
            headX + scale * 0.7,
            headY,
          );
          faceLight.addColorStop(0, rgba([89, 82, 112], intensity * 0.2));
          faceLight.addColorStop(0.5, rgba(skin, 0));
          faceLight.addColorStop(1, rgba([255, 183, 124], intensity * 0.18));
          context.fillStyle = faceLight;
          context.fillRect(
            headX - scale,
            headY - scale,
            scale * 2,
            scale * 2,
          );
          context.restore();

          context.fillStyle = rgba([116, 72, 76], intensity * 0.18);
          context.beginPath();
          context.ellipse(
            headX - scale * 0.04,
            headY + scale * 0.74,
            scale * 0.38,
            scale * 0.085,
            -0.04,
            0,
            Math.PI * 2,
          );
          context.fill();

          // A short fringe ends high on the forehead.
          context.fillStyle = rgba(SCENE_COLORS.lofiHair, intensity);
          context.beginPath();
          context.moveTo(headX - scale * 0.7, headY - scale * 0.28);
          context.quadraticCurveTo(
            headX - scale * 0.42,
            headY - scale * 1.04,
            headX + scale * 0.24,
            headY - scale * 0.94,
          );
          context.quadraticCurveTo(
            headX + scale * 0.7,
            headY - scale * 0.72,
            headX + scale * 0.69,
            headY - scale * 0.18,
          );
          context.quadraticCurveTo(
            headX + scale * 0.25,
            headY - scale * 0.56,
            headX - scale * 0.06,
            headY - scale * 0.38,
          );
          context.quadraticCurveTo(
            headX - scale * 0.35,
            headY - scale * 0.62,
            headX - scale * 0.7,
            headY - scale * 0.28,
          );
          context.fill();

          // Small open eyes look down toward the book instead of reading as
          // two sleepy strokes. Warm whites keep them inside the night palette.
          const eyeY = headY + scale * 0.04;
          const eyeXs = [headX - scale * 0.35, headX + scale * 0.06];
          context.lineCap = "round";
          eyeXs.forEach((eyeX) => {
            context.fillStyle = rgba([238, 209, 185], intensity * 0.92);
            context.beginPath();
            context.ellipse(
              eyeX,
              eyeY,
              scale * 0.14,
              scale * 0.082,
              -0.05,
              0,
              Math.PI * 2,
            );
            context.fill();

            const irisX = eyeX - scale * 0.018;
            const irisY = eyeY + scale * 0.022;
            context.fillStyle = rgba([78, 54, 68], intensity * 0.98);
            context.beginPath();
            context.ellipse(
              irisX,
              irisY,
              scale * 0.057,
              scale * 0.064,
              0,
              0,
              Math.PI * 2,
            );
            context.fill();
            context.fillStyle = rgba([31, 27, 42], intensity);
            context.beginPath();
            context.arc(
              irisX,
              irisY + scale * 0.008,
              Math.max(0.8, scale * 0.026),
              0,
              Math.PI * 2,
            );
            context.fill();
            context.fillStyle = rgba([255, 221, 169], intensity * 0.9);
            context.beginPath();
            context.arc(
              irisX + scale * 0.02,
              irisY - scale * 0.025,
              Math.max(0.55, scale * 0.015),
              0,
              Math.PI * 2,
            );
            context.fill();

            context.strokeStyle = rgba([67, 45, 57], intensity * 0.96);
            context.lineWidth = Math.max(1.1, scale * 0.052);
            context.beginPath();
            context.moveTo(eyeX - scale * 0.15, eyeY - scale * 0.005);
            context.quadraticCurveTo(
              eyeX,
              eyeY - scale * 0.105,
              eyeX + scale * 0.15,
              eyeY - scale * 0.005,
            );
            context.stroke();
          });

          context.strokeStyle = rgba([74, 47, 58], intensity * 0.72);
          context.lineWidth = Math.max(1, scale * 0.04);
          context.beginPath();
          eyeXs.forEach((eyeX, eyeIndex) => {
            context.moveTo(eyeX - scale * 0.12, eyeY - scale * 0.19);
            context.quadraticCurveTo(
              eyeX + scale * (eyeIndex ? 0.01 : -0.01),
              eyeY - scale * 0.23,
              eyeX + scale * 0.13,
              eyeY - scale * 0.18,
            );
          });
          context.stroke();
          context.strokeStyle = rgba(skinShade, intensity * 0.78);
          context.lineWidth = Math.max(1, scale * 0.045);
          context.beginPath();
          context.moveTo(headX - scale * 0.13, headY + scale * 0.18);
          context.quadraticCurveTo(
            headX - scale * 0.18,
            headY + scale * 0.31,
            headX - scale * 0.08,
            headY + scale * 0.33,
          );
          context.moveTo(headX - scale * 0.22, headY + scale * 0.5);
          context.quadraticCurveTo(
            headX - scale * 0.08,
            headY + scale * 0.57,
            headX + scale * 0.06,
            headY + scale * 0.49,
          );
          context.stroke();
          context.fillStyle = rgba([215, 113, 112], intensity * 0.18);
          context.beginPath();
          context.ellipse(
            headX - scale * 0.45,
            headY + scale * 0.31,
            scale * 0.15,
            scale * 0.07,
            0,
            0,
            Math.PI * 2,
          );
          context.ellipse(
            headX + scale * 0.25,
            headY + scale * 0.29,
            scale * 0.14,
            scale * 0.07,
            0,
            0,
            Math.PI * 2,
          );
          context.fill();

          if (!performanceMode && sceneWidth > 190) {
            // A small sleeping cat adds a lived-in detail without competing
            // with the reader. Its breathing is deliberately almost still.
            const catX = region.left + region.width * 0.7;
            const catBreath = reducedMotion.matches
              ? 0
              : Math.sin(elapsed * 0.00105) * scale * 0.025;
            const catY = floorY - scale * 0.18 - catBreath;
            const catFur: Rgb = [42, 37, 55];
            const catShade: Rgb = [25, 24, 38];

            context.strokeStyle = rgba(catShade, intensity * 0.92);
            context.lineWidth = Math.max(5, scale * 0.24);
            context.lineCap = "round";
            context.beginPath();
            context.arc(
              catX + scale * 0.5,
              catY - scale * 0.12,
              scale * 0.62,
              -0.2 * Math.PI,
              0.76 * Math.PI,
            );
            context.stroke();

            context.fillStyle = rgba([17, 17, 28], intensity * 0.48);
            context.beginPath();
            context.ellipse(
              catX,
              floorY + scale * 0.06,
              scale * 0.92,
              scale * 0.12,
              0,
              0,
              Math.PI * 2,
            );
            context.fill();

            context.fillStyle = rgba(catFur, intensity * 0.98);
            context.beginPath();
            context.ellipse(
              catX + scale * 0.08,
              catY,
              scale * 0.82,
              scale * 0.4,
              -0.06,
              0,
              Math.PI * 2,
            );
            context.fill();
            context.beginPath();
            context.arc(
              catX - scale * 0.58,
              catY - scale * 0.17,
              scale * 0.32,
              0,
              Math.PI * 2,
            );
            context.fill();
            context.beginPath();
            context.moveTo(catX - scale * 0.8, catY - scale * 0.34);
            context.lineTo(catX - scale * 0.68, catY - scale * 0.68);
            context.lineTo(catX - scale * 0.48, catY - scale * 0.39);
            context.moveTo(catX - scale * 0.45, catY - scale * 0.4);
            context.lineTo(catX - scale * 0.29, catY - scale * 0.67);
            context.lineTo(catX - scale * 0.24, catY - scale * 0.31);
            context.fill();

            context.strokeStyle = rgba([221, 150, 112], intensity * 0.38);
            context.lineWidth = Math.max(1, scale * 0.045);
            context.beginPath();
            context.arc(
              catX - scale * 0.62,
              catY - scale * 0.16,
              scale * 0.11,
              0.12 * Math.PI,
              0.86 * Math.PI,
            );
            context.stroke();
            context.strokeStyle = rgba([129, 92, 106], intensity * 0.28);
            context.beginPath();
            context.arc(
              catX + scale * 0.1,
              catY - scale * 0.02,
              scale * 0.58,
              0.1 * Math.PI,
              0.72 * Math.PI,
            );
            context.stroke();
          }

        }

        // Repaint the complete tabletop after the seated figure: the chair,
        // pelvis and thighs stay behind it, while the arms can reach over its
        // far edge toward the book drawn later.
        context.fillStyle = deskSurface;
        context.beginPath();
        context.moveTo(region.left, deskFarLeftY);
        context.lineTo(regionRight, deskFarRightY);
        context.lineTo(regionRight, deskNearRightY);
        context.lineTo(region.left, deskNearLeftY);
        context.closePath();
        context.fill();
        context.strokeStyle = rgba([44, 31, 48], intensity * 0.28);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(region.left, deskFarLeftY);
        context.lineTo(regionRight, deskFarRightY);
        context.stroke();

        // The apron completes the foreground occlusion below the tabletop.
        const deskFront = context.createLinearGradient(0, deskNearRightY, 0, deskFrontY);
        deskFront.addColorStop(0, rgba([80, 46, 54], intensity * 0.98));
        deskFront.addColorStop(1, rgba([49, 34, 47], intensity * 0.98));
        context.fillStyle = deskFront;
        context.beginPath();
        context.moveTo(region.left, deskNearLeftY);
        context.lineTo(regionRight, deskNearRightY);
        context.lineTo(regionRight, deskFrontY - 2);
        context.lineTo(region.left, deskFrontY + 2);
        context.closePath();
        context.fill();
        context.strokeStyle = rgba([205, 119, 91], intensity * 0.18);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(region.left, deskNearLeftY);
        context.lineTo(regionRight, deskNearRightY);
        context.stroke();

        if (regionIndex === 1 && sceneWidth > 72) {
          // Only the lower forearms return above the tabletop. The torso,
          // chair and thighs remain behind it, which makes the depth order
          // unambiguous while keeping both hands connected to the sleeves.
          const armScale = readerScale;
          const armBodyX = region.left + region.width * 0.56;
          const armHeadY =
            deskY - armScale * 4.43 - armScale * 0.45;
          const armShoulderY = armHeadY + armScale * 1.45;
          const armBreath = reducedMotion.matches
            ? 0
            : Math.sin(elapsed * 0.00135) * armScale * 0.025;
          const rightRestY =
            bookCoverBottomY +
            (bookCoverOuterY - bookCoverBottomY) * 0.78 +
            armScale * 0.075;
          const rightPageY = bookOuterY - bookDepth * 0.14;
          const foregroundWrists = [
            {
              x: bookX - bookHalfWidth * 0.78,
              y:
                bookCoverBottomY +
                (bookCoverOuterY - bookCoverBottomY) * 0.78 +
                armScale * 0.075,
            },
            {
              x: rightHandX,
              y: rightRestY + (rightPageY - rightRestY) * pageHandLift,
            },
          ];
          const foregroundElbows = [
            {
              x: armBodyX - armScale * 1.75,
              y: armShoulderY + armScale * 1.5 + armBreath,
            },
            {
              x: armBodyX + armScale * (0.76 - pageHandTravel * 0.48),
              y:
                armShoulderY +
                armScale * 1.5 -
                pageHandLift * armScale * 0.16 +
                armBreath,
            },
          ];

          context.lineCap = "round";
          context.lineJoin = "round";
          foregroundElbows.forEach((elbow, index) => {
            const wrist = foregroundWrists[index]!;
            const cuff = {
              x: elbow.x + (wrist.x - elbow.x) * 0.78,
              y: elbow.y + (wrist.y - elbow.y) * 0.78,
            };
            context.strokeStyle = rgba([139, 70, 78], intensity * 0.78);
            context.lineWidth = Math.max(9, armScale * 0.52);
            context.beginPath();
            context.moveTo(elbow.x, elbow.y);
            context.lineTo(cuff.x, cuff.y);
            context.stroke();
            context.strokeStyle = rgba(
              SCENE_COLORS.lofiSweater,
              intensity * 0.98,
            );
            context.lineWidth = Math.max(8, armScale * 0.44);
            context.beginPath();
            context.moveTo(elbow.x, elbow.y);
            context.lineTo(cuff.x, cuff.y);
            context.stroke();
            context.strokeStyle = rgba([201, 145, 119], intensity * 0.98);
            context.lineWidth = Math.max(5, armScale * 0.21);
            context.beginPath();
            context.moveTo(cuff.x, cuff.y);
            context.lineTo(wrist.x, wrist.y);
            context.stroke();
          });
        }

        context.save();
        context.beginPath();
        context.moveTo(region.left, deskFarLeftY);
        context.lineTo(regionRight, deskFarRightY);
        context.lineTo(regionRight, deskNearRightY);
        context.lineTo(region.left, deskNearLeftY);
        context.closePath();
        context.clip();
        context.translate(bookX + bookHalfWidth * 0.35, deskY + 2);
        context.scale(1, 0.23);
        const deskLightRadius = Math.max(54, sceneWidth * 0.36);
        const deskLight = context.createRadialGradient(
          0,
          0,
          0,
          0,
          0,
          deskLightRadius,
        );
        deskLight.addColorStop(0, rgba([244, 157, 87], intensity * 0.16));
        deskLight.addColorStop(1, rgba([244, 157, 87], 0));
        context.fillStyle = deskLight;
        context.fillRect(
          -deskLightRadius,
          -deskLightRadius,
          deskLightRadius * 2,
          deskLightRadius * 2,
        );
        context.restore();

        const lampStem = context.createLinearGradient(lampX - 3, 0, lampX + 3, 0);
        lampStem.addColorStop(0, rgba([35, 31, 46], intensity));
        lampStem.addColorStop(1, rgba([83, 55, 55], intensity));
        context.strokeStyle = lampStem;
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(lampX, lampDeskY);
        context.lineTo(lampX, lampY + 12);
        context.stroke();
        context.fillStyle = rgba([44, 32, 43], intensity * 0.8);
        context.beginPath();
        context.ellipse(lampX, lampDeskY, 11, 3, 0, 0, Math.PI * 2);
        context.fill();

        const lampShade = context.createLinearGradient(lampX - 18, 0, lampX + 18, 0);
        lampShade.addColorStop(0, rgba([218, 139, 74], intensity * 0.98));
        lampShade.addColorStop(0.55, rgba(SCENE_COLORS.lofiLamp, intensity));
        lampShade.addColorStop(1, rgba([255, 210, 128], intensity));
        context.fillStyle = lampShade;
        context.beginPath();
        context.moveTo(lampX - 18, lampY + 15);
        context.lineTo(lampX - 10, lampY - 12);
        context.lineTo(lampX + 10, lampY - 12);
        context.lineTo(lampX + 18, lampY + 15);
        context.closePath();
        context.fill();
        context.strokeStyle = rgba([255, 222, 157], intensity * 0.52);
        context.lineWidth = 1.2;
        context.beginPath();
        context.moveTo(lampX - 17, lampY + 15);
        context.quadraticCurveTo(lampX, lampY + 18, lampX + 17, lampY + 15);
        context.stroke();

        if (regionIndex === 1) {
        // Contact shadow anchors the angled book to the tabletop.
        context.fillStyle = rgba([38, 26, 40], intensity * 0.28);
        context.beginPath();
        context.ellipse(
          bookX - bookHalfWidth * 0.12,
          bookDeskY - 1,
          bookHalfWidth * 1.15,
          Math.max(2, bookDepth * 0.12),
          -0.04,
          0,
          Math.PI * 2,
        );
        context.fill();

        // The reader sees the pale inner pages; the viewer sees the two dark
        // cover panels below their near edge.
        const pagePlaneGradient = context.createLinearGradient(
          leftPageFarX,
          bookOuterY,
          rightPageX,
          bookTopY,
        );
        pagePlaneGradient.addColorStop(0, rgba([211, 193, 172], intensity * 0.98));
        pagePlaneGradient.addColorStop(0.5, rgba([240, 221, 190], intensity));
        pagePlaneGradient.addColorStop(1, rgba([251, 232, 194], intensity));
        context.fillStyle = pagePlaneGradient;
        context.beginPath();
        context.moveTo(bookX, bookBottomY);
        context.quadraticCurveTo(
          bookX - bookHalfWidth * 0.48,
          bookOuterY + bookDepth * 0.04,
          leftPageX,
          bookOuterY,
        );
        context.lineTo(leftPageFarX, bookTopY);
        context.quadraticCurveTo(
          bookX - bookHalfWidth * 0.45,
          bookTopY - 2,
          bookX,
          bookSpineTopY,
        );
        context.closePath();
        context.fill();
        context.beginPath();
        context.moveTo(bookX, bookBottomY);
        context.quadraticCurveTo(
          bookX + bookHalfWidth * 0.48,
          bookOuterY + bookDepth * 0.04,
          rightPageX,
          bookOuterY,
        );
        context.lineTo(rightPageFarX, bookTopY);
        context.quadraticCurveTo(
          bookX + bookHalfWidth * 0.45,
          bookTopY - 2,
          bookX,
          bookSpineTopY,
        );
        context.closePath();
        context.fill();

        context.strokeStyle = rgba([132, 104, 91], intensity * 0.5);
        context.lineWidth = 0.9;
        context.beginPath();
        [-1, 1].forEach((side) => {
          for (let line = 0; line < 3; line += 1) {
            const lineY = bookTopY + 4 + line * 3;
            context.moveTo(bookX + side * 7, lineY + 0.7);
            context.lineTo(
              bookX + side * bookHalfWidth * 0.61,
              lineY,
            );
          }
        });
        context.stroke();

        // A muted ribbon peeks out beneath the near cover edge.
        const bookmarkX = bookX - bookHalfWidth * 0.28;
        const bookmarkWidth = Math.max(3, bookHalfWidth * 0.09);
        context.fillStyle = rgba([190, 117, 72], intensity * 0.94);
        context.beginPath();
        context.moveTo(bookmarkX - bookmarkWidth / 2, bookCoverOuterY - 2);
        context.lineTo(bookmarkX + bookmarkWidth / 2, bookCoverOuterY - 2);
        context.lineTo(bookmarkX + bookmarkWidth * 0.38, bookDeskY + 6);
        context.lineTo(bookmarkX, bookDeskY + 3.5);
        context.lineTo(bookmarkX - bookmarkWidth * 0.38, bookDeskY + 6);
        context.closePath();
        context.fill();

        // The outer cover is painted last so it hides the pages' near edge.
        context.fillStyle = rgba([82, 46, 56], intensity * 0.98);
        context.beginPath();
        context.moveTo(bookX, bookCoverSpineTopY);
        context.lineTo(leftCoverFarX, bookCoverFarY);
        context.lineTo(leftCoverNearX, bookCoverOuterY);
        context.lineTo(bookX, bookCoverBottomY);
        context.closePath();
        context.fill();
        context.fillStyle = rgba([97, 53, 61], intensity * 0.98);
        context.beginPath();
        context.moveTo(bookX, bookCoverSpineTopY);
        context.lineTo(rightCoverFarX, bookCoverFarY);
        context.lineTo(rightCoverNearX, bookCoverOuterY);
        context.lineTo(bookX, bookCoverBottomY);
        context.closePath();
        context.fill();

        // Cover rims and the central hinge make the tilt readable from the
        // front, even when the illustration is displayed at a small size.
        context.strokeStyle = rgba([50, 31, 40], intensity * 0.76);
        context.lineWidth = 1.2;
        context.beginPath();
        context.moveTo(leftCoverNearX, bookCoverOuterY);
        context.lineTo(bookX, bookCoverBottomY);
        context.lineTo(rightCoverNearX, bookCoverOuterY);
        context.moveTo(bookX, bookCoverSpineTopY);
        context.lineTo(bookX, bookCoverBottomY);
        context.stroke();
        context.strokeStyle = rgba([209, 125, 112], intensity * 0.34);
        context.lineWidth = 0.9;
        context.beginPath();
        context.moveTo(leftCoverNearX + 6, bookCoverOuterY - 1);
        context.lineTo(bookX - 5, bookCoverBottomY - 2);
        context.moveTo(rightCoverNearX - 6, bookCoverOuterY - 1);
        context.lineTo(bookX + 5, bookCoverBottomY - 2);
        context.stroke();

        context.strokeStyle = rgba(pageShadow, intensity * 0.72);
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(bookX, bookBottomY);
        context.quadraticCurveTo(
          bookX - bookHalfWidth * 0.48,
          bookOuterY + bookDepth * 0.04,
          leftPageX,
          bookOuterY,
        );
        context.lineTo(leftPageFarX, bookTopY);
        context.moveTo(bookX, bookBottomY);
        context.quadraticCurveTo(
          bookX + bookHalfWidth * 0.48,
          bookOuterY + bookDepth * 0.04,
          rightPageX,
          bookOuterY,
        );
        context.lineTo(rightPageFarX, bookTopY);
        context.moveTo(bookX, bookSpineTopY);
        context.lineTo(bookX, bookBottomY);
        context.stroke();

        context.strokeStyle = rgba([232, 209, 178], intensity * 0.46);
        context.lineWidth = 0.7;
        for (let pageLayer = 1; pageLayer <= 2; pageLayer += 1) {
          context.beginPath();
          context.moveTo(bookX, bookBottomY - pageLayer * 1.2);
          context.quadraticCurveTo(
            bookX - bookHalfWidth * 0.48,
            bookOuterY - pageLayer + bookDepth * 0.035,
            leftPageX,
            bookOuterY - pageLayer,
          );
          context.moveTo(bookX, bookBottomY - pageLayer * 1.2);
          context.quadraticCurveTo(
            bookX + bookHalfWidth * 0.48,
            bookOuterY - pageLayer + bookDepth * 0.035,
            rightPageX,
            bookOuterY - pageLayer,
          );
          context.stroke();
        }

        if (isPageTurning && regionIndex === 1) {
          if (pageIsEdgeOn) {
            // At 90 degrees the sheet is a thin edge, never a tall filled blob.
            context.strokeStyle = rgba([219, 195, 164], intensity * 0.92);
            context.lineWidth = Math.max(1.2, bookHalfWidth * 0.035);
            context.beginPath();
            context.moveTo(
              bookX,
              bookSpineTopY - turningPageLift * 0.2,
            );
            context.lineTo(bookX, bookBottomY);
            context.stroke();
          } else {
            const turningPageColor: Rgb =
              turningPageScale > 0
                ? [248, 232, 201]
                : [232, 213, 181];
            const pageGradient = context.createLinearGradient(
              bookX,
              bookTopY,
              turningEdgeX,
              bookTopY,
            );
            pageGradient.addColorStop(
              0,
              rgba([198, 164, 137], intensity * 0.94),
            );
            pageGradient.addColorStop(
              0.24,
              rgba(turningPageColor, intensity),
            );
            pageGradient.addColorStop(
              1,
              rgba([244, 226, 194], intensity * 0.98),
            );
            context.fillStyle = pageGradient;
            context.beginPath();
            context.moveTo(bookX, bookBottomY);
            context.quadraticCurveTo(
              bookX + (turningEdgeX - bookX) * 0.52,
              bookOuterY + 1 - turningPageLift * 0.08,
              turningEdgeX,
              turningEdgeBottomY,
            );
            context.lineTo(
              turningFarEdgeX,
              bookTopY - turningPageLift * 0.45,
            );
            context.quadraticCurveTo(
              bookX + (turningFarEdgeX - bookX) * 0.52,
              bookTopY - 2 - turningPageLift * 0.55,
              bookX,
              bookSpineTopY,
            );
            context.closePath();
            context.fill();

            // Text belongs to the moving sheet as well: it contracts toward
            // the spine, then expands on the opposite side with the page.
            const rawTextVisibility = Math.min(
              1,
              Math.max(
                0,
                (Math.abs(turningPageScale) - 0.045) / 0.235,
              ),
            );
            const textVisibility =
              rawTextVisibility *
              rawTextVisibility *
              (3 - 2 * rawTextVisibility);
            context.save();
            context.clip();
            context.strokeStyle = rgba(
              [132, 104, 91],
              intensity * 0.52 * textVisibility,
            );
            context.lineWidth = 0.9;
            context.beginPath();
            for (let line = 0; line < 3; line += 1) {
              const lineY = bookTopY + 4 + line * 3;
              const lineEndFactor = line === 2 ? 0.62 : 0.76;
              context.moveTo(
                bookX + (turningFarEdgeX - bookX) * 0.16,
                lineY,
              );
              context.quadraticCurveTo(
                bookX + (turningFarEdgeX - bookX) * 0.48,
                lineY - turningPageLift * (0.42 - line * 0.045),
                bookX +
                  (turningFarEdgeX - bookX) * lineEndFactor,
                lineY - turningPageLift * 0.1,
              );
            }
            context.stroke();
            context.restore();

            context.strokeStyle = rgba(pageShadow, intensity * 0.66);
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(bookX, bookBottomY);
            context.quadraticCurveTo(
              bookX + (turningEdgeX - bookX) * 0.52,
              bookOuterY + 1 - turningPageLift * 0.08,
              turningEdgeX,
              turningEdgeBottomY,
            );
            context.lineTo(
              turningFarEdgeX,
              bookTopY - turningPageLift * 0.45,
            );
            context.quadraticCurveTo(
              bookX + (turningFarEdgeX - bookX) * 0.52,
              bookTopY - 2 - turningPageLift * 0.55,
              bookX,
              bookSpineTopY,
            );
            context.stroke();
          }
        }

        if (regionIndex === 1 && sceneWidth > 72) {
          const handScale = Math.min(29, Math.max(16, region.width * 0.078));
          const rightHandRestY =
            bookCoverBottomY +
            (bookCoverOuterY - bookCoverBottomY) * 0.78 +
            handScale * 0.075;
          const rightHandPageY = bookOuterY - bookDepth * 0.14;
          const animatedRightHandY =
            rightHandRestY +
            (rightHandPageY - rightHandRestY) * pageHandLift;

          const drawBookGrip = (
            gripX: number,
            inwardDirection: number,
            rotation: number,
          ) => {
            const edgeRatio = Math.min(
              1,
              Math.abs(gripX - bookX) / bookHalfWidth,
            );
            const edgeY =
              bookCoverBottomY +
              (bookCoverOuterY - bookCoverBottomY) * edgeRatio;
            const palmY = edgeY + handScale * 0.07;
            const gripLight = context.createLinearGradient(
              gripX - handScale * 0.34,
              edgeY,
              gripX + handScale * 0.34,
              edgeY,
            );
            gripLight.addColorStop(0, rgba([176, 112, 106], intensity * 0.99));
            gripLight.addColorStop(0.55, rgba([201, 145, 119], intensity * 0.99));
            gripLight.addColorStop(1, rgba([229, 167, 124], intensity * 0.99));

            // The page edge hides the upper palm, so it reads as a hand
            // supporting the book from below instead of an oval on the paper.
            context.save();
            context.beginPath();
            context.rect(
              gripX - handScale * 0.45,
              edgeY - handScale * 0.035,
              handScale * 0.9,
              handScale * 0.48,
            );
            context.clip();
            context.translate(gripX, palmY);
            context.rotate(rotation);
            context.fillStyle = gripLight;
            context.beginPath();
            context.ellipse(
              0,
              0,
              handScale * 0.27,
              handScale * 0.145,
              0,
              0,
              Math.PI * 2,
            );
            context.fill();
            context.restore();

            context.strokeStyle = rgba([91, 52, 59], intensity * 0.76);
            context.lineWidth = Math.max(1, handScale * 0.045);
            context.beginPath();
            context.moveTo(gripX - handScale * 0.26, edgeY);
            context.lineTo(gripX + handScale * 0.26, edgeY);
            context.stroke();

            // Two fingers and a thumb curl over the page edge.
            context.save();
            context.translate(gripX, edgeY);
            context.rotate(rotation);
            context.strokeStyle = gripLight;
            context.lineCap = "round";
            context.lineWidth = Math.max(2.2, handScale * 0.1);
            context.beginPath();
            [-0.07, 0.055].forEach((fingerOffset) => {
              context.moveTo(
                handScale * fingerOffset,
                handScale * 0.025,
              );
              context.quadraticCurveTo(
                handScale * (fingerOffset + inwardDirection * 0.012),
                -handScale * 0.045,
                handScale * (fingerOffset + inwardDirection * 0.025),
                -handScale * 0.13,
              );
            });
            context.moveTo(
              inwardDirection * handScale * 0.12,
              handScale * 0.025,
            );
            context.quadraticCurveTo(
              inwardDirection * handScale * 0.17,
              -handScale * 0.015,
              inwardDirection * handScale * 0.19,
              -handScale * 0.085,
            );
            context.stroke();
            context.strokeStyle = rgba([151, 92, 84], intensity * 0.58);
            context.lineWidth = Math.max(0.7, handScale * 0.028);
            context.beginPath();
            context.moveTo(-handScale * 0.065, -handScale * 0.08);
            context.lineTo(-handScale * 0.04, -handScale * 0.1);
            context.moveTo(handScale * 0.06, -handScale * 0.08);
            context.lineTo(handScale * 0.085, -handScale * 0.1);
            context.stroke();
            context.restore();
          };

          const drawRaisedHand = (
            x: number,
            y: number,
            rotation: number,
          ) => {
            const raisedHandLight = context.createLinearGradient(
              x - handScale * 0.32,
              y,
              x + handScale * 0.32,
              y,
            );
            raisedHandLight.addColorStop(0, rgba([176, 112, 106], intensity * 0.99));
            raisedHandLight.addColorStop(0.55, rgba([201, 145, 119], intensity * 0.99));
            raisedHandLight.addColorStop(1, rgba([229, 167, 124], intensity * 0.99));
            context.save();
            context.translate(x, y);
            context.rotate(rotation);
            context.fillStyle = raisedHandLight;
            context.beginPath();
            context.ellipse(
              0,
              0,
              handScale * 0.26,
              handScale * 0.14,
              0,
              0,
              Math.PI * 2,
            );
            context.ellipse(
              -handScale * 0.11,
              handScale * 0.062,
              handScale * 0.09,
              handScale * 0.052,
              -0.38,
              0,
              Math.PI * 2,
            );
            context.fill();
            context.strokeStyle = rgba([151, 92, 84], intensity * 0.58);
            context.lineWidth = Math.max(0.8, handScale * 0.035);
            context.beginPath();
            [-0.035, 0.035].forEach((fingerOffset) => {
              context.moveTo(-handScale * 0.13, handScale * fingerOffset);
              context.quadraticCurveTo(
                handScale * 0.01,
                handScale * (fingerOffset - 0.018),
                handScale * 0.14,
                handScale * (fingerOffset - 0.01),
              );
            });
            context.stroke();
            context.restore();
          };

          drawBookGrip(bookX - bookHalfWidth * 0.78, 1, -0.08);

          const liftedPalmX = rightHandX + handScale * 0.14;
          const liftedPalmY = animatedRightHandY + handScale * 0.07;
          const rightHandIsApproaching =
            isPageTurning && rawPageTurn < 0.18;
          if (rightHandIsApproaching) {
            context.save();
            context.globalAlpha = 1 - pageHandLiftApproach;
            drawBookGrip(rightHandRestX, -1, 0.08);
            context.restore();
            context.save();
            context.globalAlpha = pageHandLiftApproach;
            drawRaisedHand(
              liftedPalmX,
              liftedPalmY,
              0.08 - pageHandTravel * 0.16,
            );
            context.restore();
          } else if (!pageHandIsHolding) {
            if (isPageTurning) {
              context.save();
              context.globalAlpha = 1 - pageHandLower;
              drawRaisedHand(
                liftedPalmX,
                liftedPalmY,
                0.08 - pageHandTravel * 0.16,
              );
              context.restore();
              context.save();
              context.globalAlpha = pageHandLower;
              drawBookGrip(rightHandRestX, -1, 0.08);
              context.restore();
            } else {
              drawBookGrip(rightHandRestX, -1, 0.08);
            }
          }

          if (pageHandIsHolding) {
            // The lifted palm stays beside the sheet while the index reaches
            // across its edge, keeping the complete hand visible.
            const gripRotation =
              -0.08 - Math.sin(pageTurnProgress * Math.PI) * 0.2;
            drawRaisedHand(liftedPalmX, liftedPalmY, gripRotation);
            context.save();
            context.globalAlpha = Math.min(1, pageTurnProgress / 0.08);
            const pinchLight = context.createLinearGradient(
              rightHandX - handScale * 0.18,
              animatedRightHandY,
              liftedPalmX + handScale * 0.18,
              liftedPalmY,
            );
            pinchLight.addColorStop(0, rgba([177, 113, 106], intensity * 0.99));
            pinchLight.addColorStop(1, rgba([229, 167, 124], intensity * 0.99));
            context.strokeStyle = pinchLight;
            context.lineCap = "round";
            context.lineWidth = Math.max(2, handScale * 0.09);
            context.beginPath();
            context.moveTo(
              liftedPalmX - handScale * 0.13,
              liftedPalmY - handScale * 0.015,
            );
            context.quadraticCurveTo(
              rightHandX + handScale * 0.04,
              animatedRightHandY - handScale * 0.055,
              rightHandX,
              animatedRightHandY - handScale * 0.115,
            );
            context.stroke();
            context.strokeStyle = rgba([151, 92, 84], intensity * 0.58);
            context.lineWidth = Math.max(0.8, handScale * 0.03);
            context.beginPath();
            context.moveTo(
              rightHandX - handScale * 0.035,
              animatedRightHandY - handScale * 0.105,
            );
            context.lineTo(
              rightHandX + handScale * 0.025,
              animatedRightHandY - handScale * 0.12,
            );
            context.stroke();
            context.restore();
          }
        }
        }

        if (region.width > 70) {
          const mugX = region.left + region.width * 0.72;
          const mugWidth = Math.min(24, Math.max(18, region.width * 0.06));
          const mugHeight = mugWidth * 1.24;
          const mugDeskY = deskSurfaceYAt(mugX + mugWidth * 0.5);
          const mugTop = mugDeskY - mugHeight;
          const heatPulse = reducedMotion.matches
            ? 0.5
            : 0.5 + Math.sin(elapsed * 0.0021) * 0.12;

          const coffeeGlow = context.createRadialGradient(
            mugX + mugWidth / 2,
            mugTop,
            0,
            mugX + mugWidth / 2,
            mugTop,
            mugWidth * 2.5,
          );
          coffeeGlow.addColorStop(
            0,
            rgba(SCENE_COLORS.lofiLamp, intensity * heatPulse * 0.16),
          );
          coffeeGlow.addColorStop(1, rgba(SCENE_COLORS.lofiLamp, 0));
          context.fillStyle = coffeeGlow;
          context.fillRect(
            mugX - mugWidth * 2,
            mugTop - mugWidth * 2,
            mugWidth * 5,
            mugWidth * 4,
          );

          // The shadow stretches away from the lamp, toward the left.
          context.fillStyle = rgba([38, 27, 40], intensity * 0.3);
          context.beginPath();
          context.ellipse(
            mugX + mugWidth * 0.16,
            mugDeskY + 1,
            mugWidth * 1.08,
            mugWidth * 0.14,
            -0.1,
            0,
            Math.PI * 2,
          );
          context.fill();

          context.fillStyle = rgba([184, 132, 111], intensity * 0.7);
          context.beginPath();
          context.ellipse(
            mugX + mugWidth * 0.48,
            mugDeskY - 0.5,
            mugWidth * 0.7,
            mugWidth * 0.095,
            0,
            0,
            Math.PI * 2,
          );
          context.fill();

          // The handle sits behind the tapered body.
          context.strokeStyle = rgba([184, 132, 111], intensity * 0.96);
          context.lineWidth = Math.max(2.5, mugWidth * 0.16);
          context.beginPath();
          context.arc(
            mugX + mugWidth * 0.92,
            mugTop + mugHeight * 0.45,
            mugWidth * 0.4,
            -Math.PI / 2,
            Math.PI / 2,
          );
          context.stroke();

          const mugBody = context.createLinearGradient(
            mugX,
            mugTop,
            mugX + mugWidth,
            mugTop,
          );
          mugBody.addColorStop(0, rgba([174, 126, 112], intensity * 0.98));
          mugBody.addColorStop(0.58, rgba([211, 164, 133], intensity));
          mugBody.addColorStop(1, rgba([232, 181, 133], intensity));
          context.fillStyle = mugBody;
          context.beginPath();
          context.moveTo(mugX + mugWidth * 0.03, mugTop + 2);
          context.bezierCurveTo(
            mugX + mugWidth * 0.06,
            mugTop + mugHeight * 0.5,
            mugX + mugWidth * 0.1,
            mugDeskY - mugHeight * 0.08,
            mugX + mugWidth * 0.18,
            mugDeskY,
          );
          context.quadraticCurveTo(
            mugX + mugWidth * 0.5,
            mugDeskY + 2,
            mugX + mugWidth * 0.82,
            mugDeskY,
          );
          context.bezierCurveTo(
            mugX + mugWidth * 0.9,
            mugDeskY - mugHeight * 0.08,
            mugX + mugWidth * 0.94,
            mugTop + mugHeight * 0.5,
            mugX + mugWidth * 0.97,
            mugTop + 2,
          );
          context.closePath();
          context.fill();

          context.fillStyle = rgba([229, 181, 143], intensity * 0.98);
          context.beginPath();
          context.ellipse(
            mugX + mugWidth / 2,
            mugTop + 2,
            mugWidth * 0.49,
            mugWidth * 0.135,
            0,
            0,
            Math.PI * 2,
          );
          context.fill();

          // The visible coffee surface ripples gently inside the cup.
          context.fillStyle = rgba([73, 43, 34], intensity * 0.98);
          context.beginPath();
          context.ellipse(
            mugX + mugWidth / 2,
            mugTop + 2,
            mugWidth * 0.42,
            mugWidth * 0.1,
            0,
            0,
            Math.PI * 2,
          );
          context.fill();
          context.strokeStyle = rgba([237, 190, 132], intensity * 0.42);
          context.lineWidth = 1;
          context.beginPath();
          context.ellipse(
            mugX + mugWidth * (0.5 + Math.sin(elapsed * 0.003) * 0.03),
            mugTop + 2,
            mugWidth * (0.2 + heatPulse * 0.05),
            mugWidth * 0.045,
            0,
            0,
            Math.PI * 2,
          );
          context.stroke();

          context.strokeStyle = rgba([255, 218, 164], intensity * 0.42);
          context.lineWidth = Math.max(1, mugWidth * 0.045);
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(mugX + mugWidth * 0.78, mugTop + mugHeight * 0.22);
          context.quadraticCurveTo(
            mugX + mugWidth * 0.83,
            mugTop + mugHeight * 0.56,
            mugX + mugWidth * 0.75,
            mugTop + mugHeight * 0.78,
          );
          context.stroke();

          const steamCount = performanceMode ? 1 : 2;
          for (let steam = 0; steam < steamCount; steam += 1) {
            const steamAge = reducedMotion.matches
              ? 0.42 + steam * 0.08
              : (elapsed * 0.00013 + steam * 0.31) % 1;
            const steamAlpha = Math.sin(steamAge * Math.PI) * 0.3;
            const baseX = mugX + mugWidth * (0.34 + steam * 0.28);
            const baseY = mugTop - 2 - steamAge * mugWidth * 1.9;
            const drift =
              Math.sin(elapsed * 0.0014 + steam * 2.1 + steamAge * 3) *
              mugWidth *
              0.19;
            context.strokeStyle = rgba(
              SCENE_COLORS.windowLight,
              intensity * steamAlpha,
            );
            context.lineWidth = Math.max(0.9, mugWidth * 0.05);
            context.beginPath();
            context.moveTo(baseX, baseY + mugWidth * 0.56);
            context.bezierCurveTo(
              baseX + drift,
              baseY + mugWidth * 0.38,
              baseX - drift * 0.55,
              baseY + mugWidth * 0.16,
              baseX + drift * 0.25,
              baseY,
            );
            context.stroke();
          }
        }
      });

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
      clipToSides(bounds);

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

      const underwaterRegions = sideRegions(bounds);
      underwaterRegions.forEach((region, regionIndex) => {
        if (region.width < 24) return;
        const floorY = height * 0.88;
        const floor = context.createLinearGradient(0, floorY, 0, height);
        floor.addColorStop(0, rgba(palette.deep, intensity * 0.18));
        floor.addColorStop(1, rgba([18, 63, 65], intensity * 0.72));
        context.fillStyle = floor;
        context.beginPath();
        context.moveTo(region.left, floorY + 8);
        for (let point = 0; point <= 8; point += 1) {
          const x = region.left + (region.width * point) / 8;
          const y = floorY + Math.sin(point * 1.7 + regionIndex) * 7;
          context.lineTo(x, y);
        }
        context.lineTo(region.left + region.width, height);
        context.lineTo(region.left, height);
        context.closePath();
        context.fill();

        const coralCount = performanceMode ? 2 : Math.max(3, Math.round(region.width / 70));
        const coralRandom = seededRandom(0x434f5241 + regionIndex * 1_009);
        for (let coral = 0; coral < coralCount; coral += 1) {
          const slot = (coral + 0.22 + coralRandom() * 0.56) / coralCount;
          const coralX = region.left + region.width * (0.06 + slot * 0.88);
          const coralY = floorY + 8 + coralRandom() * 13;
          const coralScale = 0.55 + coralRandom() * 0.65;
          const coralColor: Rgb = coral % 3 === 0
            ? [220, 105, 94]
            : coral % 3 === 1
              ? [224, 161, 93]
              : [157, 105, 169];

          context.fillStyle = rgba([58, 91, 82], intensity * 0.8);
          context.beginPath();
          context.ellipse(coralX, coralY + 7, 18 * coralScale, 7 * coralScale, 0, 0, Math.PI * 2);
          context.fill();

          context.strokeStyle = rgba(coralColor, intensity * 0.82);
          context.lineWidth = Math.max(2, 5 * coralScale);
          context.lineCap = "round";
          const branchCount = performanceMode ? 3 : 5;
          for (let branch = 0; branch < branchCount; branch += 1) {
            const branchOffset = (branch - (branchCount - 1) / 2) * 6 * coralScale;
            const branchHeight = (24 + (branch % 3) * 11) * coralScale;
            const currentSway = reducedMotion.matches
              ? 0
              : Math.sin(elapsed * 0.0003 + coral * 1.7 + branch) * 1.8;
            context.beginPath();
            context.moveTo(coralX + branchOffset * 0.35, coralY + 4);
            context.bezierCurveTo(
              coralX + branchOffset,
              coralY - branchHeight * 0.42,
              coralX + branchOffset + currentSway,
              coralY - branchHeight * 0.72,
              coralX + branchOffset * 1.3 + currentSway,
              coralY - branchHeight,
            );
            context.stroke();

            if (branch % 2 === 0) {
              context.beginPath();
              context.moveTo(coralX + branchOffset, coralY - branchHeight * 0.54);
              context.lineTo(
                coralX + branchOffset + (branch % 4 ? 9 : -9) * coralScale,
                coralY - branchHeight * 0.72,
              );
              context.stroke();
            }
          }
        }

        const kelpCount = performanceMode ? 5 : Math.max(7, Math.round(region.width / 24));
        const kelpRandom = seededRandom(0x4b454c50 + regionIndex * 1_013);
        for (let kelp = 0; kelp < kelpCount; kelp += 1) {
          const slot = (kelp + 0.15 + kelpRandom() * 0.7) / kelpCount;
          const baseX = region.left + region.width * (0.04 + slot * 0.92);
          const baseY = floorY + 6 + kelpRandom() * 18;
          const plantHeight = 42 + kelpRandom() * Math.min(150, height * 0.22);
          const swaySpeed = 0.00042 + kelpRandom() * 0.00018;
          const swayDistance = 8 + kelpRandom() * 11;
          const sway = reducedMotion.matches
            ? 0
            : Math.sin(elapsed * swaySpeed + kelp) * swayDistance;
          const kelpColor: Rgb = kelp % 3 === 0 ? [43, 119, 91] : [29, 92, 78];

          context.strokeStyle = rgba(kelpColor, intensity * (0.56 + kelpRandom() * 0.3));
          context.lineWidth = 2.2 + kelpRandom() * 2.8;
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(baseX, baseY);
          context.bezierCurveTo(
            baseX - sway * 0.45,
            baseY - plantHeight * 0.35,
            baseX + sway * 0.25,
            baseY - plantHeight * 0.72,
            baseX + sway,
            baseY - plantHeight,
          );
          context.stroke();

          if (!performanceMode || kelp % 2 === 0) {
            context.fillStyle = rgba(kelpColor, intensity * 0.62);
            for (let leaf = 1; leaf < 5; leaf += 1) {
              const progress = leaf / 5;
              const leafX = baseX + sway * progress;
              const leafY = baseY - plantHeight * progress;
              const direction = leaf % 2 ? 1 : -1;
              context.beginPath();
              context.ellipse(
                leafX + direction * 7,
                leafY,
                10 + kelpRandom() * 5,
                3.5 + kelpRandom() * 2,
                direction * -0.38,
                0,
                Math.PI * 2,
              );
              context.fill();
            }
          }
        }
      });

      fish.forEach((swimmer, index) => {
        if (index >= (performanceMode ? 6 : 12)) return;
        const region = swimmer.side < 0 ? underwaterRegions[0] : underwaterRegions[1];
        if (!region || region.width < 34) return;
        const direction = index % 3 === 0 ? -1 : 1;
        const travel =
          (swimmer.x + elapsed * (0.000012 + swimmer.speed * 0.000009)) % 1.18;
        const route = direction > 0 ? travel : 1.18 - travel;
        const fishX = region.left - 24 + route * (region.width + 48);
        const fishY =
          height * (0.2 + swimmer.y * 0.52) +
          Math.sin(elapsed * 0.00048 * swimmer.speed + swimmer.phase) *
            (5 + swimmer.drift * 3);
        const pitch = reducedMotion.matches
          ? 0
          : Math.cos(elapsed * 0.00048 * swimmer.speed + swimmer.phase) * 0.12;
        const fishSize = 3.8 + swimmer.size * 3.2;
        const fishColor: Rgb = index % 4 === 0
          ? [224, 147, 83]
          : index % 4 === 1
            ? palette.glow
            : index % 4 === 2
              ? [95, 179, 165]
              : palette.foam;

        context.save();
        context.translate(fishX, fishY);
        context.rotate(direction * pitch);
        context.scale(direction, 1);
        context.fillStyle = rgba(fishColor, intensity * (0.52 + swimmer.depth * 0.36));
        context.beginPath();
        context.ellipse(0, 0, fishSize, fishSize * 0.48, 0, 0, Math.PI * 2);
        context.fill();
        context.beginPath();
        context.moveTo(-fishSize * 0.8, 0);
        context.lineTo(-fishSize * 1.55, -fishSize * 0.68);
        context.lineTo(-fishSize * 1.42, fishSize * 0.68);
        context.closePath();
        context.fill();
        context.beginPath();
        context.moveTo(-fishSize * 0.12, -fishSize * 0.25);
        context.lineTo(fishSize * 0.28, -fishSize * 0.85);
        context.lineTo(fishSize * 0.52, -fishSize * 0.18);
        context.closePath();
        context.fill();
        context.fillStyle = rgba([14, 42, 48], intensity * 0.9);
        context.beginPath();
        context.arc(fishSize * 0.56, -fishSize * 0.12, Math.max(0.65, fishSize * 0.08), 0, Math.PI * 2);
        context.fill();
        context.restore();
      });

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
      const regions = sideRegions(bounds);
      context.save();
      clipToSides(bounds);

      const interior = context.createLinearGradient(0, 0, 0, height);
      interior.addColorStop(0, rgba(SCENE_COLORS.submarineMetal, intensity * 0.96));
      interior.addColorStop(0.52, rgba(SCENE_COLORS.submarinePanel, intensity * 0.98));
      interior.addColorStop(1, rgba(SCENE_COLORS.submarineDark, intensity));
      context.fillStyle = interior;
      context.fillRect(0, 0, width, height);

      regions.forEach((region, regionIndex) => {
        if (region.width < 26) return;
        const ribX = regionIndex ? region.left + region.width * 0.88 : region.left + region.width * 0.12;
        context.strokeStyle = rgba(SCENE_COLORS.submarineMetal, intensity * 0.88);
        context.lineWidth = Math.max(8, region.width * 0.07);
        context.beginPath();
        context.moveTo(ribX, 0);
        context.quadraticCurveTo(
          region.left + region.width * 0.5,
          height * 0.5,
          ribX,
          height,
        );
        context.stroke();

        context.strokeStyle = rgba(palette.foam, intensity * 0.13);
        context.lineWidth = 1;
        for (let seam = height * 0.14; seam < height; seam += height * 0.16) {
          context.beginPath();
          context.moveTo(region.left, seam);
          context.lineTo(region.left + region.width, seam);
          context.stroke();
        }

        context.fillStyle = rgba(palette.foam, intensity * 0.34);
        for (let rivet = 0; rivet < 7; rivet += 1) {
          const y = height * (0.08 + rivet * 0.135);
          [region.left + 12, region.left + region.width - 12].forEach((x) => {
            context.beginPath();
            context.arc(x, y, 1.8, 0, Math.PI * 2);
            context.fill();
          });
        }

        if (regionIndex === 0) {
          const x = region.left + region.width * 0.52;
          const y = height * 0.44;
          const radius = Math.max(28, Math.min(region.width * 0.39, height * 0.255));
          const screen = context.createRadialGradient(x, y, 0, x, y, radius);
          screen.addColorStop(0, rgba(SCENE_COLORS.submarineSonar, intensity * 0.12));
          screen.addColorStop(0.72, rgba(SCENE_COLORS.submarinePanel, intensity * 0.94));
          screen.addColorStop(1, rgba(SCENE_COLORS.submarineDark, intensity));
          context.fillStyle = screen;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = rgba(SCENE_COLORS.submarineMetal, intensity);
          context.lineWidth = Math.max(5, radius * 0.09);
          context.stroke();

          context.strokeStyle = rgba(SCENE_COLORS.submarineSonar, intensity * 0.34);
          context.lineWidth = 0.8;
          for (let ring = 1; ring <= 4; ring += 1) {
            context.beginPath();
            context.arc(x, y, (radius * ring) / 4.5, 0, Math.PI * 2);
            context.stroke();
          }
          context.beginPath();
          context.moveTo(x - radius * 0.86, y);
          context.lineTo(x + radius * 0.86, y);
          context.moveTo(x, y - radius * 0.86);
          context.lineTo(x, y + radius * 0.86);
          context.stroke();

          const sweepAngle = elapsed * 0.00042 - Math.PI / 2;
          const sweepGradient = context.createRadialGradient(x, y, 0, x, y, radius);
          sweepGradient.addColorStop(0, rgba(SCENE_COLORS.submarineSonar, intensity * 0.04));
          sweepGradient.addColorStop(1, rgba(SCENE_COLORS.submarineSonar, intensity * 0.2));
          context.fillStyle = sweepGradient;
          context.beginPath();
          context.moveTo(x, y);
          context.arc(x, y, radius * 0.88, sweepAngle - 0.48, sweepAngle);
          context.closePath();
          context.fill();
          context.strokeStyle = rgba(SCENE_COLORS.submarineSonar, intensity * 0.9);
          context.lineWidth = 1.5;
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(
            x + Math.cos(sweepAngle) * radius * 0.88,
            y + Math.sin(sweepAngle) * radius * 0.88,
          );
          context.stroke();

          const contacts = [
            { angle: -0.62, distance: 0.48 },
            { angle: 1.08, distance: 0.7 },
            { angle: 2.7, distance: 0.58 },
          ];
          contacts.forEach((contact, contactIndex) => {
            const difference = Math.atan2(
              Math.sin(sweepAngle - contact.angle),
              Math.cos(sweepAngle - contact.angle),
            );
            const afterglow = Math.exp(-Math.max(0, difference) * 1.7);
            const contactX = x + Math.cos(contact.angle) * radius * contact.distance;
            const contactY = y + Math.sin(contact.angle) * radius * contact.distance;
            const pulse =
              0.48 + Math.sin(elapsed * 0.003 + contactIndex * 1.9) * 0.22;
            context.shadowBlur = 10;
            context.shadowColor = rgba(SCENE_COLORS.submarineSonar, intensity * afterglow);
            context.fillStyle = rgba(
              SCENE_COLORS.submarineSonar,
              intensity * Math.max(0.18, afterglow) * pulse,
            );
            context.beginPath();
            context.arc(contactX, contactY, 2.3, 0, Math.PI * 2);
            context.fill();
          });
          context.shadowBlur = 0;

          const pingElapsed = ((elapsed - 7_000) % 24_000 + 24_000) % 24_000;
          if (pingElapsed < 2_400) {
            const pingProgress = pingElapsed / 2_400;
            context.strokeStyle = rgba(
              SCENE_COLORS.submarineSonar,
              intensity * (1 - pingProgress) * 0.7,
            );
            context.lineWidth = 2;
            context.beginPath();
            context.arc(x, y, radius * 0.9 * pingProgress, 0, Math.PI * 2);
            context.stroke();
          }
        } else {
          const x = region.left + region.width * 0.48;
          const y = height * 0.4;
          const radius = Math.max(30, Math.min(region.width * 0.36, height * 0.23));
          const ocean = context.createRadialGradient(x, y, 0, x, y, radius);
          ocean.addColorStop(0, rgba(palette.glow, intensity * 0.38));
          ocean.addColorStop(0.7, rgba(palette.water, intensity * 0.7));
          ocean.addColorStop(1, rgba(palette.deep, intensity * 0.96));
          context.fillStyle = ocean;
          context.beginPath();
          context.arc(x, y, radius, 0, Math.PI * 2);
          context.fill();
          context.strokeStyle = rgba(SCENE_COLORS.submarineMetal, intensity);
          context.lineWidth = Math.max(8, radius * 0.15);
          context.stroke();

          bubbles.slice(0, performanceMode ? 8 : 15).forEach((bubble) => {
            const travel = (bubble.y - elapsed * 0.000045 * bubble.speed + 1.2) % 1;
            const bubbleX = x - radius * 0.65 + bubble.x * radius * 1.3;
            const bubbleY = y + radius * 0.72 - travel * radius * 1.45;
            const distance = Math.hypot(bubbleX - x, bubbleY - y);
            if (distance > radius * 0.76) return;
            context.strokeStyle = rgba(palette.foam, intensity * 0.48 * bubble.depth);
            context.lineWidth = 0.8;
            context.beginPath();
            context.arc(bubbleX, bubbleY, 1 + bubble.size * 1.2, 0, Math.PI * 2);
            context.stroke();
          });

          context.fillStyle = rgba(SCENE_COLORS.submarineMetal, intensity * 0.9);
          for (let bolt = 0; bolt < 10; bolt += 1) {
            const angle = (bolt / 10) * Math.PI * 2;
            context.beginPath();
            context.arc(
              x + Math.cos(angle) * radius * 1.08,
              y + Math.sin(angle) * radius * 1.08,
              2.2,
              0,
              Math.PI * 2,
            );
            context.fill();
          }
        }

        const consoleY = height * 0.76;
        context.fillStyle = rgba(SCENE_COLORS.submarinePanel, intensity * 0.98);
        context.beginPath();
        context.roundRect(
          region.left + region.width * 0.08,
          consoleY,
          region.width * 0.84,
          height * 0.18,
          8,
        );
        context.fill();
        for (let light = 0; light < 5; light += 1) {
          const blinking =
            light % 2 ? 0.46 : 0.58 + Math.sin(elapsed * 0.002 + light) * 0.28;
          context.fillStyle = rgba(
            light === 4 ? palette.signal : SCENE_COLORS.submarineSonar,
            intensity * blinking,
          );
          context.beginPath();
          context.arc(
            region.left + region.width * (0.2 + light * 0.15),
            consoleY + height * 0.075,
            2.4,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
      });
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
      if (document.hidden) {
        context.clearRect(0, 0, width, height);
        return;
      }

      const motionReduced = reducedMotion.matches;
      const delta = Math.min(0.05, Math.max(0, (now - lastFrame) / 1_000));
      lastFrame = now;
      const changingEffect = requestedEffect !== currentEffect;
      if (motionReduced) {
        if (changingEffect) {
          currentEffect = requestedEffect;
          effectStartedAt = now;
        }
        intensity = isPlaying && currentEffect !== "none" ? 1 : 0;
      } else {
        const target = changingEffect ? 0 : isPlaying && currentEffect !== "none" ? 1 : 0;
        const easing = target > intensity ? 3 : 2.6;
        intensity += (target - intensity) * (1 - Math.exp(-delta * easing));

        if (changingEffect && intensity < 0.018) {
          currentEffect = requestedEffect;
          effectStartedAt = now;
        }
      }

      context.clearRect(0, 0, width, height);
      context.globalAlpha = effectsIntensity;
      const palette = PALETTES[theme];
      const marinePalette = MARINE_PALETTES[theme];
      const stormPalette = STORM_PALETTES[theme];
      const elapsed = motionReduced ? 12_000 : now - effectStartedAt;
      context.save();
      clipToSides(pageBounds(), 10);
      if (currentEffect === "fireflies") drawFireflies(elapsed, palette);
      if (currentEffect === "rain") drawRain(elapsed, palette);
      if (currentEffect === "dawn") drawDawn(elapsed);
      if (currentEffect === "fireplace") drawFireplace(elapsed);
      if (currentEffect === "shore") drawShore(elapsed);
      if (currentEffect === "train") drawTrain(elapsed);
      if (currentEffect === "zombies") drawZombies(elapsed);
      if (currentEffect === "lofi") drawLofi(elapsed);
      if (currentEffect === "mist" || currentEffect === "breeze") {
        drawMist(elapsed, palette, currentEffect === "breeze");
      }
      if (currentEffect === "harbor") drawHarbor(elapsed, marinePalette);
      if (currentEffect === "underwater") drawUnderwater(elapsed, marinePalette);
      if (currentEffect === "submarine") drawSubmarine(elapsed, marinePalette);
      if (currentEffect === "storm") drawStorm(elapsed, stormPalette);
      context.restore();
      context.globalAlpha = 1;

      if (
        !motionReduced &&
        (isPlaying || intensity > 0.002 || requestedEffect !== currentEffect)
      ) {
        frameId = requestAnimationFrame(render);
      }
    }

    function ensureAnimation() {
      if (!frameId && !document.hidden) {
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
  }, [canvasRef, enabled]);

}
