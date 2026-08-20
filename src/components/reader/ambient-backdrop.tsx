"use client";

import { useRef, useSyncExternalStore } from "react";
import { useAmbientBackdropEngine } from "./ambient-backdrop-engine";

const COMPACT_READER_QUERY =
  "(max-width: 680px), (min-width: 681px) and (max-width: 1024px) and (orientation: portrait)";

function subscribeToViewport(onChange: () => void) {
  const media = window.matchMedia(COMPACT_READER_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getVisualsEnabled() {
  return !window.matchMedia(COMPACT_READER_QUERY).matches;
}

export function AmbientBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const visualsEnabled = useSyncExternalStore(
    subscribeToViewport,
    getVisualsEnabled,
    () => false,
  );

  useAmbientBackdropEngine(canvasRef, visualsEnabled);

  return visualsEnabled ? (
    <canvas aria-hidden="true" className="ambient-backdrop" ref={canvasRef} />
  ) : null;
}
