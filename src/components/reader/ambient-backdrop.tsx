"use client";

import { useRef } from "react";
import { useAmbientBackdropEngine } from "./ambient-backdrop-engine";

export function AmbientBackdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useAmbientBackdropEngine(canvasRef);

  return <canvas aria-hidden="true" className="ambient-backdrop" ref={canvasRef} />;
}
