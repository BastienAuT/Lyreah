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

type LoopSlot = 0 | 1;
type LoopTransition = {
  elapsedMs: number;
  frameId: number | null;
  from: LoopSlot;
  startedAt: number | null;
  to: LoopSlot;
};
type ContinuousLoopRuntime = {
  activeSlot: LoopSlot;
  audios: [HTMLAudioElement, HTMLAudioElement];
  dispose: () => void;
  disposed: boolean;
  layer: SoundscapeLayer;
  pause: () => void;
  paused: boolean;
  play: () => Promise<void>;
  soundscape: Soundscape;
  transition: LoopTransition | null;
};

const CROSSFADE_DURATION_MS = 360;
const LOOP_CROSSFADE_DURATION_MS = 3_000;
const audioKey = (soundscapeId: string, layerId: string) =>
  `${soundscapeId}:${layerId}`;
const continuousAudioKey = (
  soundscapeId: string,
  layerId: string,
  slot: LoopSlot,
) => `${audioKey(soundscapeId, layerId)}:loop-${slot}`;

function AudioSource({
  audioId,
  preload,
  registerAudio,
  src,
}: {
  audioId: string;
  preload: "metadata" | "none";
  registerAudio: (key: string, audio: HTMLAudioElement | null) => void;
  src: string;
}) {
  return (
    <audio
      aria-hidden="true"
      preload={preload}
      ref={(audio) => registerAudio(audioId, audio)}
      src={src}
    />
  );
}

export function AmbientAudioPlayer({ bookId }: { bookId: string }) {
  const playerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const detailsButtonRef = useRef<HTMLButtonElement>(null);
  const audioRefs = useRef(new Map<string, HTMLAudioElement>());
  const continuousLoopRefs = useRef(new Map<string, ContinuousLoopRuntime>());
  const loopGainRefs = useRef(new Map<string, number>());
  const soundscapeGainRefs = useRef(new Map<string, number>());
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
  const volumeRef = useRef(volume);

  const activeSoundscape = useMemo(
    () =>
      soundscapes.find((soundscape) => soundscape.id === selectedSoundscapeId) ??
      soundscapes[0] ??
      null,
    [selectedSoundscapeId, soundscapes],
  );

  const applyAudioVolume = useCallback(
    (soundscape: Soundscape, layer: SoundscapeLayer, key: string, loopGain: number) => {
      const audio = audioRefs.current.get(key);
      if (!audio) return;

      const soundscapeGain = soundscapeGainRefs.current.get(soundscape.id) ?? 0;
      audio.volume = Math.min(
        1,
        Math.max(
          0,
          (volumeRef.current / 100) * layer.volume * soundscapeGain * loopGain,
        ),
      );
    },
    [],
  );

  const setLoopGain = useCallback(
    (soundscape: Soundscape, layer: SoundscapeLayer, slot: LoopSlot, gain: number) => {
      const key = continuousAudioKey(soundscape.id, layer.id, slot);
      loopGainRefs.current.set(key, gain);
      applyAudioVolume(soundscape, layer, key, gain);
    },
    [applyAudioVolume],
  );

  const setSoundscapeVolume = useCallback(
    (soundscape: Soundscape, multiplier: number) => {
      soundscapeGainRefs.current.set(soundscape.id, multiplier);
      soundscape.layers.forEach((layer) => {
        if (layer.intervalSeconds) {
          applyAudioVolume(soundscape, layer, audioKey(soundscape.id, layer.id), 1);
          return;
        }

        ([0, 1] as const).forEach((slot) => {
          const key = continuousAudioKey(soundscape.id, layer.id, slot);
          const loopGain = loopGainRefs.current.get(key) ?? (slot === 0 ? 1 : 0);
          applyAudioVolume(soundscape, layer, key, loopGain);
        });
      });
    },
    [applyAudioVolume],
  );

  const ensureContinuousLoop = useCallback(
    (soundscape: Soundscape, layer: SoundscapeLayer) => {
      const key = audioKey(soundscape.id, layer.id);
      const existing = continuousLoopRefs.current.get(key);
      if (existing && !existing.disposed) return existing;

      const first = audioRefs.current.get(continuousAudioKey(soundscape.id, layer.id, 0));
      const second = audioRefs.current.get(continuousAudioKey(soundscape.id, layer.id, 1));
      if (!first || !second) return null;

      const runtime: ContinuousLoopRuntime = {
        activeSlot: 0,
        audios: [first, second],
        dispose: () => undefined,
        disposed: false,
        layer,
        pause: () => undefined,
        paused: true,
        play: async () => undefined,
        soundscape,
        transition: null,
      };

      const finishTransition = () => {
        const transition = runtime.transition;
        if (!transition) return;

        const previous = runtime.audios[transition.from];
        previous.pause();
        previous.currentTime = 0;
        setLoopGain(soundscape, layer, transition.from, 0);
        setLoopGain(soundscape, layer, transition.to, 1);
        runtime.activeSlot = transition.to;
        runtime.transition = null;
      };

      const resumeFade = () => {
        const transition = runtime.transition;
        if (!transition || runtime.paused || runtime.disposed) return;

        transition.startedAt = performance.now();
        const step = (now: number) => {
          const currentTransition = runtime.transition;
          if (
            !currentTransition ||
            currentTransition !== transition ||
            runtime.paused ||
            runtime.disposed
          ) {
            return;
          }

          const progress = Math.min(
            1,
            (currentTransition.elapsedMs + now - currentTransition.startedAt!) /
              LOOP_CROSSFADE_DURATION_MS,
          );
          setLoopGain(soundscape, layer, currentTransition.from, 1 - progress);
          setLoopGain(soundscape, layer, currentTransition.to, progress);

          if (progress >= 1) finishTransition();
          else currentTransition.frameId = requestAnimationFrame(step);
        };
        transition.frameId = requestAnimationFrame(step);
      };

      const beginTransition = () => {
        if (runtime.transition || runtime.paused || runtime.disposed) return;

        const from = runtime.activeSlot;
        const to: LoopSlot = from === 0 ? 1 : 0;
        const nextAudio = runtime.audios[to];
        runtime.transition = {
          elapsedMs: 0,
          frameId: null,
          from,
          startedAt: null,
          to,
        };
        nextAudio.currentTime = 0;
        setLoopGain(soundscape, layer, to, 0);
        void nextAudio
          .play()
          .then(() => {
            if (runtime.paused || runtime.disposed) {
              nextAudio.pause();
              return;
            }
            resumeFade();
          })
          .catch(() => {
            if (runtime.paused || runtime.disposed) return;
            runtime.transition = null;
            nextAudio.pause();
            nextAudio.currentTime = 0;
            setLoopGain(soundscape, layer, to, 0);
            setLoopGain(soundscape, layer, from, 1);
            const activeAudio = runtime.audios[from];
            activeAudio.currentTime = 0;
            void activeAudio
              .play()
              .catch(() => setError("Une boucle audio n’a pas pu être enchaînée"));
          });
      };

      const onTimeUpdate = (event: Event) => {
        const activeAudio = runtime.audios[runtime.activeSlot];
        if (event.currentTarget !== activeAudio || runtime.transition) return;

        const duration = activeAudio.duration;
        if (!Number.isFinite(duration) || duration <= 0) return;
        const overlapSeconds = Math.min(
          LOOP_CROSSFADE_DURATION_MS / 1_000,
          duration / 3,
        );
        if (activeAudio.currentTime >= duration - overlapSeconds) beginTransition();
      };

      const onEnded = (event: Event) => {
        const activeAudio = runtime.audios[runtime.activeSlot];
        if (
          event.currentTarget !== activeAudio ||
          runtime.transition ||
          runtime.paused ||
          runtime.disposed
        ) {
          return;
        }
        activeAudio.currentTime = 0;
        void activeAudio.play().catch(() => setError("Lecture audio impossible"));
      };

      runtime.audios.forEach((audio) => {
        audio.addEventListener("timeupdate", onTimeUpdate);
        audio.addEventListener("ended", onEnded);
      });
      setLoopGain(soundscape, layer, 0, 1);
      setLoopGain(soundscape, layer, 1, 0);

      runtime.play = async () => {
        if (runtime.disposed) return;
        runtime.paused = false;
        const transition = runtime.transition;
        if (transition) {
          await Promise.all([
            runtime.audios[transition.from].play(),
            runtime.audios[transition.to].play(),
          ]);
          resumeFade();
          return;
        }
        await runtime.audios[runtime.activeSlot].play();
      };

      runtime.pause = () => {
        if (runtime.disposed || runtime.paused) return;
        runtime.paused = true;
        const transition = runtime.transition;
        if (transition?.startedAt !== null && transition?.startedAt !== undefined) {
          transition.elapsedMs += performance.now() - transition.startedAt;
          transition.startedAt = null;
        }
        if (transition?.frameId !== null && transition?.frameId !== undefined) {
          cancelAnimationFrame(transition.frameId);
          transition.frameId = null;
        }
        runtime.audios.forEach((audio) => audio.pause());
      };

      runtime.dispose = () => {
        if (runtime.disposed) return;
        runtime.pause();
        runtime.disposed = true;
        runtime.audios.forEach((audio) => {
          audio.removeEventListener("timeupdate", onTimeUpdate);
          audio.removeEventListener("ended", onEnded);
          audio.pause();
          audio.currentTime = 0;
        });
        setLoopGain(soundscape, layer, 0, 1);
        setLoopGain(soundscape, layer, 1, 0);
        continuousLoopRefs.current.delete(key);
      };

      continuousLoopRefs.current.set(key, runtime);
      return runtime;
    },
    [setLoopGain],
  );

  const playContinuousLayers = useCallback(
    async (soundscape: Soundscape) => {
      const runtimes = soundscape.layers
        .filter((layer) => !layer.intervalSeconds)
        .map((layer) => ensureContinuousLoop(soundscape, layer))
        .filter((runtime): runtime is ContinuousLoopRuntime => Boolean(runtime));
      await Promise.all(runtimes.map((runtime) => runtime.play()));
    },
    [ensureContinuousLoop],
  );

  const pauseContinuousLayers = useCallback((soundscape: Soundscape) => {
    soundscape.layers.forEach((layer) => {
      continuousLoopRefs.current.get(audioKey(soundscape.id, layer.id))?.pause();
    });
  }, []);

  const stopContinuousLayers = useCallback((soundscape: Soundscape) => {
    soundscape.layers.forEach((layer) => {
      continuousLoopRefs.current.get(audioKey(soundscape.id, layer.id))?.dispose();
    });
  }, []);

  const registerAudio = useCallback((key: string, audio: HTMLAudioElement | null) => {
    if (audio) audioRefs.current.set(key, audio);
    else audioRefs.current.delete(key);
  }, []);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    const controller = new AbortController();
    const audioElements = audioRefs.current;
    const continuousLoops = continuousLoopRefs.current;

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
      continuousLoops.forEach((runtime) => runtime.dispose());
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
  }, [activeSoundscape, setSoundscapeVolume, soundscapes, volume]);

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

    closeButtonRef.current?.focus();

    function closeOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !playerRef.current?.contains(event.target)) {
        setIsExpanded(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExpanded(false);
        detailsButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!activeSoundscape || !isPlaying) return;

    function pauseWhenBackgrounded() {
      if (document.visibilityState === "hidden") {
        pauseContinuousLayers(activeSoundscape!);
        setIsPlaying(false);
      }
    }

    document.addEventListener("visibilitychange", pauseWhenBackgrounded);
    window.addEventListener("pagehide", pauseWhenBackgrounded);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenBackgrounded);
      window.removeEventListener("pagehide", pauseWhenBackgrounded);
    };
  }, [activeSoundscape, isPlaying, pauseContinuousLayers]);

  const togglePlayback = useCallback(async () => {
    if (!activeSoundscape || isTransitioningRef.current) return;

    if (isPlaying) {
      pauseContinuousLayers(activeSoundscape);
      setIsPlaying(false);
      return;
    }

    try {
      setError("");
      setSoundscapeVolume(activeSoundscape, 1);
      await playContinuousLayers(activeSoundscape);
      setIsPlaying(true);
    } catch {
      pauseContinuousLayers(activeSoundscape);
      setError("Lecture audio impossible");
    }
  }, [
    activeSoundscape,
    isPlaying,
    pauseContinuousLayers,
    playContinuousLayers,
    setSoundscapeVolume,
  ]);

  const selectSoundscape = useCallback(
    async (nextSoundscape: Soundscape) => {
      if (
        !activeSoundscape ||
        nextSoundscape.id === activeSoundscape.id ||
        isTransitioningRef.current
      ) {
        return;
      }

      const previousSoundscape = activeSoundscape;
      const transitionId = transitionIdRef.current + 1;
      transitionIdRef.current = transitionId;
      isTransitioningRef.current = isPlaying;
      setSelectedSoundscapeId(nextSoundscape.id);
      setError("");
      if (!isPlaying) {
        stopContinuousLayers(previousSoundscape);
        return;
      }

      try {
        setSoundscapeVolume(nextSoundscape, 0);
        await playContinuousLayers(nextSoundscape);
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
          stopContinuousLayers(previousSoundscape);
          setSoundscapeVolume(nextSoundscape, 1);
          isTransitioningRef.current = false;
        }
      } catch {
        stopContinuousLayers(previousSoundscape);
        stopContinuousLayers(nextSoundscape);
        setIsPlaying(false);
        isTransitioningRef.current = false;
        setError("Changement d’ambiance impossible");
      }
    },
    [
      activeSoundscape,
      isPlaying,
      playContinuousLayers,
      setSoundscapeVolume,
      stopContinuousLayers,
    ],
  );

  if (!activeSoundscape) {
    return error ? <span className="ambient-player__error">{error}</span> : null;
  }

  return (
    <div className="ambient-player" ref={playerRef}>
      {soundscapes.flatMap((soundscape) =>
        soundscape.layers.flatMap((layer) => {
          if (layer.intervalSeconds) {
            const key = audioKey(soundscape.id, layer.id);
            return [
              <AudioSource
                audioId={key}
                key={key}
                preload="none"
                registerAudio={registerAudio}
                src={layer.url}
              />,
            ];
          }

          return ([0, 1] as const).map((slot) => {
            const key = continuousAudioKey(soundscape.id, layer.id, slot);
            return (
              <AudioSource
                audioId={key}
                key={key}
                preload={
                  soundscape.id === activeSoundscape.id && slot === 0
                    ? "metadata"
                    : "none"
                }
                registerAudio={registerAudio}
                src={layer.url}
              />
            );
          });
        }),
      )}

      {isExpanded ? (
        <section
          aria-labelledby="ambient-player-title"
          className="ambient-player__panel"
          id="ambient-player-panel"
          role="dialog"
        >
          <button
            aria-label="Fermer les réglages de l’ambiance"
            className="ambient-player__close"
            onClick={() => {
              setIsExpanded(false);
              detailsButtonRef.current?.focus();
            }}
            ref={closeButtonRef}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
          <p id="ambient-player-title">Ambiance du livre</p>
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
          aria-controls="ambient-player-panel"
          aria-expanded={isExpanded}
          className="ambient-player__details"
          onClick={() => setIsExpanded((current) => !current)}
          ref={detailsButtonRef}
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
      {error ? (
        <span aria-live="polite" className="ambient-player__error" role="status">
          {error}
        </span>
      ) : null}
    </div>
  );
}
