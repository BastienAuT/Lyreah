"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  audioPreferencesStorageKey,
  DEFAULT_AUDIO_VOLUME,
  DEFAULT_EFFECTS_INTENSITY,
  parseAudioPreferences,
} from "@/audio/preferences";
import type { VisualEffect } from "@/audio/effects";

type SoundscapeLayer = {
  id: string;
  intervalSeconds?: number;
  startDelaySeconds?: number;
  title: string;
  url: string;
  volume: number;
};
type Soundscape = {
  id: string;
  title: string;
  description: string | null;
  attribution: string | null;
  licenseName: string;
  licenseSourceUrl: string | null;
  visualEffect: VisualEffect;
  layers: SoundscapeLayer[];
};
type SoundscapeResponse = {
  defaultSoundscapeId: string | null;
  soundscape: Soundscape | null;
  soundscapes?: Soundscape[];
};

const CROSSFADE_DURATION_MS = 360;
const audioKey = (soundscapeId: string, layerId: string) =>
  `${soundscapeId}:${layerId}`;

export function AmbientAudioPlayer({ bookId }: { bookId: string }) {
  const playerRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const transitionIdRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const preferencesLoadedRef = useRef(false);
  const [soundscapes, setSoundscapes] = useState<Soundscape[]>([]);
  const [selectedSoundscapeId, setSelectedSoundscapeId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_AUDIO_VOLUME);
  const [effectsIntensity, setEffectsIntensity] = useState(
    DEFAULT_EFFECTS_INTENSITY,
  );
  const [performanceMode, setPerformanceMode] = useState(false);
  const [error, setError] = useState("");

  const activeSoundscape = useMemo(
    () =>
      soundscapes.find((soundscape) => soundscape.id === selectedSoundscapeId) ??
      soundscapes[0] ??
      null,
    [selectedSoundscapeId, soundscapes],
  );

  const setSoundscapeVolume = useCallback(
    (soundscape: Soundscape, multiplier: number) => {
      soundscape.layers.forEach((layer) => {
        const audio = audioRefs.current.get(audioKey(soundscape.id, layer.id));
        if (audio) {
          audio.volume = Math.min(
            1,
            Math.max(0, (volume / 100) * layer.volume * multiplier),
          );
        }
      });
    },
    [volume],
  );

  useEffect(() => {
    const controller = new AbortController();
    const audioElements = audioRefs.current;

    async function loadSoundscapes() {
      try {
        const storedPreferences = parseAudioPreferences(
          window.localStorage.getItem(audioPreferencesStorageKey(bookId)),
        );
        const response = await fetch(`/api/reader/books/${bookId}/soundscape`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) throw new Error("L’ambiance n’a pas pu être chargée.");

        const data = (await response.json()) as SoundscapeResponse;
        const available = data.soundscapes ?? (data.soundscape ? [data.soundscape] : []);
        const storedExists = available.some(
          (soundscape) => soundscape.id === storedPreferences.soundscapeId,
        );

        preferencesLoadedRef.current = true;
        setVolume(storedPreferences.volume);
        setEffectsIntensity(storedPreferences.effectsIntensity);
        setPerformanceMode(storedPreferences.performanceMode);
        setSoundscapes(available);
        setSelectedSoundscapeId(
          storedExists
            ? storedPreferences.soundscapeId
            : data.defaultSoundscapeId ?? available[0]?.id ?? null,
        );
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError("Ambiance indisponible");
      }
    }

    loadSoundscapes();
    return () => {
      controller.abort();
      transitionIdRef.current += 1;
      audioElements.forEach((audio) => audio.pause());
    };
  }, [bookId]);

  useEffect(() => {
    if (!preferencesLoadedRef.current) return;
    window.localStorage.setItem(
      audioPreferencesStorageKey(bookId),
      JSON.stringify({
        effectsIntensity,
        performanceMode,
        soundscapeId: selectedSoundscapeId,
        volume,
      }),
    );
  }, [bookId, effectsIntensity, performanceMode, selectedSoundscapeId, volume]);

  useEffect(() => {
    if (!activeSoundscape || isTransitioningRef.current) return;
    soundscapes.forEach((soundscape) => {
      setSoundscapeVolume(soundscape, soundscape.id === activeSoundscape.id ? 1 : 0);
    });
  }, [activeSoundscape, setSoundscapeVolume, soundscapes]);

  useEffect(() => {
    document.documentElement.dataset.soundscapeEffect =
      activeSoundscape?.visualEffect ?? "none";
    document.documentElement.dataset.soundscapeIntensity = String(
      effectsIntensity / 100,
    );
    document.documentElement.dataset.soundscapePerformance = String(
      performanceMode,
    );
    document.documentElement.dataset.soundscapePlaying = String(isPlaying);

    return () => {
      delete document.documentElement.dataset.soundscapeEffect;
      delete document.documentElement.dataset.soundscapeIntensity;
      delete document.documentElement.dataset.soundscapePerformance;
      delete document.documentElement.dataset.soundscapePlaying;
    };
  }, [activeSoundscape, effectsIntensity, isPlaying, performanceMode]);

  useEffect(() => {
    if (!activeSoundscape || !isPlaying) return;

    const scheduledLayers = activeSoundscape.layers
      .filter((layer) => layer.intervalSeconds)
      .map((layer) => {
        const audio = audioRefs.current.get(audioKey(activeSoundscape.id, layer.id));
        if (!audio || !layer.intervalSeconds) return null;
        let timer = 0;

        const playOneShot = () => {
          audio.currentTime = 0;
          void audio.play().catch(() => setError("Un son ponctuel n’a pas pu être lu"));
          timer = window.setTimeout(playOneShot, layer.intervalSeconds! * 1_000);
        };

        timer = window.setTimeout(
          playOneShot,
          (layer.startDelaySeconds ?? layer.intervalSeconds * 0.55) * 1_000,
        );
        return { audio, stop: () => window.clearTimeout(timer) };
      })
      .filter((scheduled): scheduled is { audio: HTMLAudioElement; stop: () => void } =>
        Boolean(scheduled),
      );

    return () => {
      scheduledLayers.forEach(({ audio, stop }) => {
        stop();
        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, [activeSoundscape, isPlaying]);

  useEffect(() => {
    if (!isExpanded) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !playerRef.current?.contains(event.target)) {
        setIsExpanded(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsExpanded(false);
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isExpanded]);

  const togglePlayback = useCallback(async () => {
    if (!activeSoundscape) return;
    const audioElements = activeSoundscape.layers
      .filter((layer) => !layer.intervalSeconds)
      .map((layer) => audioRefs.current.get(audioKey(activeSoundscape.id, layer.id)))
      .filter((audio): audio is HTMLAudioElement => Boolean(audio));

    if (isPlaying) {
      audioElements.forEach((audio) => audio.pause());
      setIsPlaying(false);
      return;
    }

    try {
      setError("");
      setSoundscapeVolume(activeSoundscape, 1);
      await Promise.all(audioElements.map((audio) => audio.play()));
      setIsPlaying(true);
    } catch {
      audioElements.forEach((audio) => audio.pause());
      setError("Lecture audio impossible");
    }
  }, [activeSoundscape, isPlaying, setSoundscapeVolume]);

  const selectSoundscape = useCallback(
    async (nextSoundscape: Soundscape) => {
      if (!activeSoundscape || nextSoundscape.id === activeSoundscape.id) return;

      const previousSoundscape = activeSoundscape;
      const transitionId = transitionIdRef.current + 1;
      transitionIdRef.current = transitionId;
      isTransitioningRef.current = isPlaying;
      setSelectedSoundscapeId(nextSoundscape.id);
      setError("");
      if (!isPlaying) return;

      const nextAudioElements = nextSoundscape.layers
        .filter((layer) => !layer.intervalSeconds)
        .map((layer) => audioRefs.current.get(audioKey(nextSoundscape.id, layer.id)))
        .filter((audio): audio is HTMLAudioElement => Boolean(audio));
      const previousAudioElements = previousSoundscape.layers
        .filter((layer) => !layer.intervalSeconds)
        .map((layer) => audioRefs.current.get(audioKey(previousSoundscape.id, layer.id)))
        .filter((audio): audio is HTMLAudioElement => Boolean(audio));

      try {
        setSoundscapeVolume(nextSoundscape, 0);
        await Promise.all(nextAudioElements.map((audio) => audio.play()));
        const startedAt = performance.now();

        await new Promise<void>((resolve) => {
          function step(now: number) {
            if (transitionIdRef.current !== transitionId) return resolve();
            const progress = Math.min(1, (now - startedAt) / CROSSFADE_DURATION_MS);
            setSoundscapeVolume(previousSoundscape, 1 - progress);
            setSoundscapeVolume(nextSoundscape, progress);
            if (progress < 1) requestAnimationFrame(step);
            else resolve();
          }
          requestAnimationFrame(step);
        });

        if (transitionIdRef.current === transitionId) {
          previousAudioElements.forEach((audio) => audio.pause());
          setSoundscapeVolume(nextSoundscape, 1);
          isTransitioningRef.current = false;
        }
      } catch {
        previousAudioElements.forEach((audio) => audio.pause());
        nextAudioElements.forEach((audio) => audio.pause());
        setIsPlaying(false);
        isTransitioningRef.current = false;
        setError("Changement d’ambiance impossible");
      }
    },
    [activeSoundscape, isPlaying, setSoundscapeVolume],
  );

  if (!activeSoundscape) {
    return error ? <span className="ambient-player__error">{error}</span> : null;
  }

  return (
    <div className="ambient-player" ref={playerRef}>
      {soundscapes.flatMap((soundscape) =>
        soundscape.layers.map((layer) => (
          <audio
            key={audioKey(soundscape.id, layer.id)}
            loop={!layer.intervalSeconds}
            preload="none"
            ref={(audio) => {
              const key = audioKey(soundscape.id, layer.id);
              if (audio) audioRefs.current.set(key, audio);
              else audioRefs.current.delete(key);
            }}
            src={layer.url}
          />
        )),
      )}

      {isExpanded ? (
        <section className="ambient-player__panel" aria-label="Réglages de l’ambiance">
          <button
            aria-label="Fermer les réglages de l’ambiance"
            className="ambient-player__close"
            onClick={() => setIsExpanded(false)}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
          <p>Ambiance du livre</p>
          <strong>{activeSoundscape.title}</strong>
          {activeSoundscape.description ? <span>{activeSoundscape.description}</span> : null}

          {soundscapes.length > 1 ? (
            <fieldset className="ambient-player__choices">
              <legend>Choisir une ambiance</legend>
              {soundscapes.map((soundscape) => (
                <button
                  aria-pressed={soundscape.id === activeSoundscape.id}
                  key={soundscape.id}
                  onClick={() => selectSoundscape(soundscape)}
                  type="button"
                >
                  <span aria-hidden="true">
                    {soundscape.id === activeSoundscape.id ? "♪" : "○"}
                  </span>
                  <span>
                    <strong>{soundscape.title}</strong>
                    {soundscape.description ? <small>{soundscape.description}</small> : null}
                  </span>
                </button>
              ))}
            </fieldset>
          ) : null}

          <label className="ambient-player__volume">
            <span>Volume</span>
            <input
              aria-label="Volume de l’ambiance"
              max="100"
              min="0"
              onChange={(event) => setVolume(Number(event.target.value))}
              type="range"
              value={volume}
            />
          </label>
          <label className="ambient-player__volume">
            <span>
              Effets visuels <output>{effectsIntensity} %</output>
            </span>
            <input
              aria-label="Intensité des effets visuels"
              max="100"
              min="0"
              onChange={(event) =>
                setEffectsIntensity(Number(event.target.value))
              }
              type="range"
              value={effectsIntensity}
            />
          </label>
          <label className="ambient-player__performance">
            <span>
              <strong>Mode performance</strong>
              <small>Réduit les particules et la définition des effets.</small>
            </span>
            <input
              checked={performanceMode}
              onChange={(event) => setPerformanceMode(event.target.checked)}
              type="checkbox"
            />
          </label>
          <small>
            {activeSoundscape.attribution ? `${activeSoundscape.attribution} · ` : ""}
            {activeSoundscape.licenseSourceUrl ? (
              <a href={activeSoundscape.licenseSourceUrl} rel="noreferrer" target="_blank">
                {activeSoundscape.licenseName}
              </a>
            ) : (
              activeSoundscape.licenseName
            )}
          </small>
        </section>
      ) : null}

      <div className="ambient-player__mini">
        <button
          aria-expanded={isExpanded}
          className="ambient-player__details"
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          <span aria-hidden="true">♪</span>
          <span>
            <small>Ambiance</small>
            <strong>{activeSoundscape.title}</strong>
          </span>
        </button>
        <button
          aria-label={isPlaying ? "Mettre l’ambiance en pause" : "Lancer l’ambiance"}
          className="ambient-player__toggle"
          onClick={togglePlayback}
          type="button"
        >
          <span aria-hidden="true">{isPlaying ? "Ⅱ" : "▶"}</span>
        </button>
      </div>
      {error ? <span className="ambient-player__error">{error}</span> : null}
    </div>
  );
}
