"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  audioPreferencesStorageKey,
  DEFAULT_AUDIO_VOLUME,
  DEFAULT_EFFECTS_INTENSITY,
  parseAudioPreferences,
} from "@/audio/preferences";
import {
  getSignedAudioUrlExpiry,
  SIGNED_AUDIO_URL_REFRESH_LEEWAY_MS,
  shouldRefreshSignedAudioUrl,
} from "@/audio/signed-url-refresh";
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
  expiresIn?: number;
  soundscape: Soundscape | null;
  soundscapes?: Soundscape[];
};

type FreshSoundscapes = {
  expiresAt: number;
  soundscapes: Soundscape[];
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
type SoundscapeLoadController = {
  controller: AbortController;
  version: number;
};

class SoundscapeLoadCancelledError extends Error {
  constructor() {
    super("Soundscape load cancelled");
    this.name = "SoundscapeLoadCancelledError";
  }
}

const CROSSFADE_DURATION_MS = 360;
const LOOP_CROSSFADE_DURATION_MS = 3_000;
const audioKey = (soundscapeId: string, layerId: string) =>
  `${soundscapeId}:${layerId}`;
const continuousAudioKey = (
  soundscapeId: string,
  layerId: string,
  slot: LoopSlot,
) => `${audioKey(soundscapeId, layerId)}:loop-${slot}`;

function getAvailableSoundscapes(data: SoundscapeResponse) {
  return data.soundscapes ?? (data.soundscape ? [data.soundscape] : []);
}

async function requestSoundscapes(bookId: string, signal?: AbortSignal) {
  const response = await fetch(`/api/reader/books/${bookId}/soundscape`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) throw new Error("The soundscape could not be loaded");

  const data = (await response.json()) as SoundscapeResponse;
  return {
    data,
    expiresAt: getSignedAudioUrlExpiry(data.expiresIn),
    soundscapes: getAvailableSoundscapes(data),
  };
}

function waitUntilAudioCanPlay(audio: HTMLAudioElement, signal?: AbortSignal) {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      signal?.removeEventListener("abort", handleAbort);
    };
    const handleCanPlay = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(audio.error ?? new Error("Audio loading failed"));
    };
    const handleAbort = () => {
      cleanup();
      reject(new SoundscapeLoadCancelledError());
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Audio loading timed out"));
    }, 7_000);

    audio.addEventListener("canplay", handleCanPlay, { once: true });
    audio.addEventListener("error", handleError, { once: true });
    if (signal?.aborted) return handleAbort();
    signal?.addEventListener("abort", handleAbort, { once: true });
    audio.preload = "auto";
    audio.load();
  });
}

function abortAudioRequest(audio: HTMLAudioElement) {
  audio.pause();
  try {
    audio.currentTime = 0;
  } catch {
    // Some browsers reject seeking an element whose metadata is not loaded yet.
  }
  audio.preload = "none";
  audio.removeAttribute("src");
  audio.load();
}

function playAudio(audio: HTMLAudioElement, signal?: AbortSignal) {
  if (!signal) return audio.play();
  if (signal.aborted) return Promise.reject(new SoundscapeLoadCancelledError());

  return new Promise<void>((resolve, reject) => {
    const handleAbort = () => {
      reject(new SoundscapeLoadCancelledError());
    };
    signal.addEventListener("abort", handleAbort, { once: true });
    audio.play().then(
      () => {
        signal.removeEventListener("abort", handleAbort);
        resolve();
      },
      (playError: unknown) => {
        signal.removeEventListener("abort", handleAbort);
        reject(playError);
      },
    );
  });
}

async function playAudioReliably(audio: HTMLAudioElement, signal?: AbortSignal) {
  try {
    await playAudio(audio, signal);
  } catch (initialError) {
    if (initialError instanceof SoundscapeLoadCancelledError) throw initialError;
    if (initialError instanceof DOMException && initialError.name === "NotAllowedError") {
      throw initialError;
    }
    await waitUntilAudioCanPlay(audio, signal);
    await playAudio(audio, signal);
  }
}

function AudioSource({
  audioId,
  preload,
  registerAudio,
  src,
}: {
  audioId: string;
  preload: "auto" | "metadata" | "none";
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
  const audioSourceExpiryRefs = useRef(new Map<string, number>());
  const latestSoundscapesRef = useRef<Soundscape[]>([]);
  const latestSignedUrlsExpireAtRef = useRef(0);
  const refreshSoundscapesPromiseRef = useRef<Promise<FreshSoundscapes> | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const transitionIdRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const pendingSoundscapeRef = useRef<Soundscape | null>(null);
  const transitionTargetRef = useRef<Soundscape | null>(null);
  const soundscapeLoadVersionsRef = useRef(new Map<string, number>());
  const soundscapeLoadControllersRef = useRef(
    new Map<string, SoundscapeLoadController>(),
  );
  const selectedSoundscapeIdRef = useRef<string | null>(null);
  const preferencesLoadedRef = useRef(false);
  const [soundscapes, setSoundscapes] = useState<Soundscape[]>([]);
  const [signedUrlsExpireAt, setSignedUrlsExpireAt] = useState(0);
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

  const refreshSoundscapes = useCallback(
    async (force = false): Promise<FreshSoundscapes> => {
      if (
        !force &&
        !shouldRefreshSignedAudioUrl(latestSignedUrlsExpireAtRef.current)
      ) {
        return {
          expiresAt: latestSignedUrlsExpireAtRef.current,
          soundscapes: latestSoundscapesRef.current,
        };
      }

      const inFlight = refreshSoundscapesPromiseRef.current;
      if (inFlight) return inFlight;

      const request = requestSoundscapes(
        bookId,
        requestControllerRef.current?.signal,
      ).then(({ expiresAt, soundscapes: refreshedSoundscapes }) => {
        latestSoundscapesRef.current = refreshedSoundscapes;
        latestSignedUrlsExpireAtRef.current = expiresAt;
        setSignedUrlsExpireAt(expiresAt);
        return { expiresAt, soundscapes: refreshedSoundscapes };
      });
      refreshSoundscapesPromiseRef.current = request;

      try {
        return await request;
      } finally {
        if (refreshSoundscapesPromiseRef.current === request) {
          refreshSoundscapesPromiseRef.current = null;
        }
      }
    },
    [bookId],
  );

  const getSoundscapeLoadSignal = useCallback(
    (soundscapeId: string, expectedLoadVersion: number) => {
      if (
        (soundscapeLoadVersionsRef.current.get(soundscapeId) ?? 0) !==
        expectedLoadVersion
      ) {
        throw new SoundscapeLoadCancelledError();
      }

      const existing = soundscapeLoadControllersRef.current.get(soundscapeId);
      if (
        existing &&
        existing.version === expectedLoadVersion &&
        !existing.controller.signal.aborted
      ) {
        return existing.controller.signal;
      }

      existing?.controller.abort();
      const controller = new AbortController();
      soundscapeLoadControllersRef.current.set(soundscapeId, {
        controller,
        version: expectedLoadVersion,
      });
      return controller.signal;
    },
    [],
  );

  const refreshAudioSource = useCallback(
    async (
      soundscapeId: string,
      layerId: string,
      key: string,
      audio: HTMLAudioElement,
      force = false,
      preload: "auto" | "metadata" | "none" = "auto",
      expectedLoadVersion?: number,
    ) => {
      const assertLoadIsCurrent = () => {
        if (
          expectedLoadVersion !== undefined &&
          (soundscapeLoadVersionsRef.current.get(soundscapeId) ?? 0) !==
            expectedLoadVersion
        ) {
          throw new SoundscapeLoadCancelledError();
        }
      };

      assertLoadIsCurrent();
      const currentExpiry = audioSourceExpiryRefs.current.get(key);
      if (
        !force &&
        audio.getAttribute("src") &&
        !shouldRefreshSignedAudioUrl(currentExpiry)
      ) {
        audio.preload = preload;
        return;
      }

      // Replacing src reloads an HTMLAudioElement. Never do it while that slot is audible.
      if (!audio.paused && !audio.ended) return;

      let freshSoundscapes: FreshSoundscapes;
      try {
        freshSoundscapes = await refreshSoundscapes(force);
      } catch (refreshError) {
        if (!force && currentExpiry !== undefined && currentExpiry > Date.now()) {
          return;
        }
        throw refreshError;
      }

      assertLoadIsCurrent();
      if (!audio.paused && !audio.ended) return;

      const refreshedLayer = freshSoundscapes.soundscapes
        .find((soundscape) => soundscape.id === soundscapeId)
        ?.layers.find((layer) => layer.id === layerId);
      if (!refreshedLayer) {
        throw new Error("The requested soundscape layer is no longer available");
      }

      if (audio.getAttribute("src") !== refreshedLayer.url) {
        audio.src = refreshedLayer.url;
      }
      audio.preload = preload;
      if (
        preload === "auto" &&
        audio.readyState === HTMLMediaElement.HAVE_NOTHING
      ) {
        audio.load();
      }
      audioSourceExpiryRefs.current.set(key, freshSoundscapes.expiresAt);
    },
    [refreshSoundscapes],
  );

  const playAudioWithFreshSource = useCallback(
    async (
      soundscape: Soundscape,
      layer: SoundscapeLayer,
      key: string,
      audio: HTMLAudioElement,
      expectedLoadVersion?: number,
    ) => {
      const loadSignal =
        expectedLoadVersion === undefined
          ? undefined
          : getSoundscapeLoadSignal(soundscape.id, expectedLoadVersion);
      await refreshAudioSource(
        soundscape.id,
        layer.id,
        key,
        audio,
        false,
        "auto",
        expectedLoadVersion,
      );

      try {
        await playAudioReliably(audio, loadSignal);
      } catch (playError) {
        if (playError instanceof SoundscapeLoadCancelledError) throw playError;
        if (playError instanceof DOMException && playError.name === "NotAllowedError") {
          throw playError;
        }
        await refreshAudioSource(
          soundscape.id,
          layer.id,
          key,
          audio,
          true,
          "auto",
          expectedLoadVersion,
        );
        await playAudioReliably(audio, loadSignal);
      }
    },
    [getSoundscapeLoadSignal, refreshAudioSource],
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

  const prepareSoundscapeSources = useCallback(
    async (soundscape: Soundscape, expectedLoadVersion?: number) => {
      const loadVersion =
        expectedLoadVersion ??
        (soundscapeLoadVersionsRef.current.get(soundscape.id) ?? 0);
      if (!soundscapeLoadVersionsRef.current.has(soundscape.id)) {
        soundscapeLoadVersionsRef.current.set(soundscape.id, loadVersion);
      }
      const existingRuntimes = continuousLoopRefs.current;

      await Promise.all(
        soundscape.layers.flatMap((layer) => {
          if (layer.intervalSeconds) {
            const key = audioKey(soundscape.id, layer.id);
            const audio = audioRefs.current.get(key);
            return audio
              ? [
                  refreshAudioSource(
                    soundscape.id,
                    layer.id,
                    key,
                    audio,
                    false,
                    "none",
                    loadVersion,
                  ),
                ]
              : [];
          }

          const runtime = existingRuntimes.get(
            audioKey(soundscape.id, layer.id),
          );
          const activeSlot = runtime?.activeSlot ?? 0;
          return ([0, 1] as const).flatMap((slot) => {
            const key = continuousAudioKey(soundscape.id, layer.id, slot);
            const audio = audioRefs.current.get(key);
            return audio
              ? [
                  refreshAudioSource(
                    soundscape.id,
                    layer.id,
                    key,
                    audio,
                    false,
                    slot === activeSlot ? "auto" : "none",
                    loadVersion,
                  ),
                ]
              : [];
          });
        }),
      );
    },
    [refreshAudioSource],
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
      const runtimeLoadVersion =
        soundscapeLoadVersionsRef.current.get(soundscape.id) ?? 0;

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
        void refreshAudioSource(
          soundscape.id,
          layer.id,
          continuousAudioKey(soundscape.id, layer.id, transition.from),
          previous,
          false,
          "none",
          runtimeLoadVersion,
        ).catch(() => undefined);
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
        void playAudioWithFreshSource(
          soundscape,
          layer,
          continuousAudioKey(soundscape.id, layer.id, to),
          nextAudio,
          runtimeLoadVersion,
        )
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
            void playAudioWithFreshSource(
              soundscape,
              layer,
              continuousAudioKey(soundscape.id, layer.id, from),
              activeAudio,
              runtimeLoadVersion,
            )
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
        void playAudioWithFreshSource(
          soundscape,
          layer,
          continuousAudioKey(soundscape.id, layer.id, runtime.activeSlot),
          activeAudio,
          runtimeLoadVersion,
        ).catch(() => {
          if (!runtime.disposed) setError("Lecture audio impossible");
        });
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
            playAudioWithFreshSource(
              soundscape,
              layer,
              continuousAudioKey(soundscape.id, layer.id, transition.from),
              runtime.audios[transition.from],
              runtimeLoadVersion,
            ),
            playAudioWithFreshSource(
              soundscape,
              layer,
              continuousAudioKey(soundscape.id, layer.id, transition.to),
              runtime.audios[transition.to],
              runtimeLoadVersion,
            ),
          ]);
          resumeFade();
          return;
        }
        await playAudioWithFreshSource(
          soundscape,
          layer,
          continuousAudioKey(soundscape.id, layer.id, runtime.activeSlot),
          runtime.audios[runtime.activeSlot],
          runtimeLoadVersion,
        );
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
        runtime.audios.forEach((audio, slot) => {
          audio.removeEventListener("timeupdate", onTimeUpdate);
          audio.removeEventListener("ended", onEnded);
          abortAudioRequest(audio);
          audioSourceExpiryRefs.current.delete(
            continuousAudioKey(soundscape.id, layer.id, slot as LoopSlot),
          );
        });
        setLoopGain(soundscape, layer, 0, 1);
        setLoopGain(soundscape, layer, 1, 0);
        continuousLoopRefs.current.delete(key);
      };

      continuousLoopRefs.current.set(key, runtime);
      return runtime;
    },
    [playAudioWithFreshSource, refreshAudioSource, setLoopGain],
  );

  const playContinuousLayers = useCallback(
    async (soundscape: Soundscape, expectedLoadVersion?: number) => {
      const loadVersion =
        expectedLoadVersion ??
        (soundscapeLoadVersionsRef.current.get(soundscape.id) ?? 0);
      const assertLoadIsCurrent = () => {
        if (
          (soundscapeLoadVersionsRef.current.get(soundscape.id) ?? 0) !==
          loadVersion
        ) {
          throw new SoundscapeLoadCancelledError();
        }
      };

      await prepareSoundscapeSources(soundscape, loadVersion);
      assertLoadIsCurrent();
      const runtimes = soundscape.layers
        .filter((layer) => !layer.intervalSeconds)
        .map((layer) => ensureContinuousLoop(soundscape, layer))
        .filter((runtime): runtime is ContinuousLoopRuntime => Boolean(runtime));
      runtimes.forEach((runtime) => {
        runtime.audios.forEach((audio, slot) => {
          audio.preload = slot === runtime.activeSlot ? "auto" : "none";
        });
      });
      try {
        await Promise.all(runtimes.map((runtime) => runtime.play()));
      } catch (playError) {
        assertLoadIsCurrent();
        throw playError;
      }
      assertLoadIsCurrent();
    },
    [ensureContinuousLoop, prepareSoundscapeSources],
  );

  const pauseContinuousLayers = useCallback((soundscape: Soundscape) => {
    soundscape.layers.forEach((layer) => {
      continuousLoopRefs.current.get(audioKey(soundscape.id, layer.id))?.pause();
    });
  }, []);

  const cancelSoundscapeAudio = useCallback((soundscape: Soundscape) => {
    const nextLoadVersion =
      (soundscapeLoadVersionsRef.current.get(soundscape.id) ?? 0) + 1;
    soundscapeLoadVersionsRef.current.set(soundscape.id, nextLoadVersion);
    soundscapeLoadControllersRef.current
      .get(soundscape.id)
      ?.controller.abort();
    soundscapeLoadControllersRef.current.delete(soundscape.id);

    soundscape.layers.forEach((layer) => {
      const runtime = continuousLoopRefs.current.get(
        audioKey(soundscape.id, layer.id),
      );
      if (runtime) {
        runtime.dispose();
        return;
      }

      const keys = layer.intervalSeconds
        ? [audioKey(soundscape.id, layer.id)]
        : ([0, 1] as const).map((slot) =>
            continuousAudioKey(soundscape.id, layer.id, slot),
          );
      keys.forEach((key) => {
        const audio = audioRefs.current.get(key);
        if (audio) abortAudioRequest(audio);
        audioSourceExpiryRefs.current.delete(key);
      });
    });
  }, []);

  const registerAudio = useCallback((key: string, audio: HTMLAudioElement | null) => {
    if (audio) {
      audioRefs.current.set(key, audio);
      if (!audioSourceExpiryRefs.current.has(key)) {
        audioSourceExpiryRefs.current.set(
          key,
          latestSignedUrlsExpireAtRef.current,
        );
      }
    } else {
      audioRefs.current.delete(key);
    }
  }, []);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    const controller = new AbortController();
    const audioElements = audioRefs.current;
    const audioSourceExpiries = audioSourceExpiryRefs.current;
    const continuousLoops = continuousLoopRefs.current;
    const soundscapeLoadVersions = soundscapeLoadVersionsRef.current;
    const soundscapeLoadControllers = soundscapeLoadControllersRef.current;
    requestControllerRef.current = controller;
    refreshSoundscapesPromiseRef.current = null;
    latestSoundscapesRef.current = [];
    latestSignedUrlsExpireAtRef.current = 0;
    audioSourceExpiries.clear();

    async function loadSoundscapes() {
      try {
        const storedPreferences = parseAudioPreferences(
          window.localStorage.getItem(audioPreferencesStorageKey(bookId)),
        );
        const { data, expiresAt, soundscapes: available } =
          await requestSoundscapes(bookId, controller.signal);
        const storedExists = available.some(
          (soundscape) => soundscape.id === storedPreferences.soundscapeId,
        );

        latestSoundscapesRef.current = available;
        latestSignedUrlsExpireAtRef.current = expiresAt;
        setSignedUrlsExpireAt(expiresAt);
        preferencesLoadedRef.current = true;
        setVolume(storedPreferences.volume);
        setEffectsIntensity(storedPreferences.effectsIntensity);
        setPerformanceMode(storedPreferences.performanceMode);
        const initialSoundscapeId = storedExists
          ? storedPreferences.soundscapeId
          : data.defaultSoundscapeId ?? available[0]?.id ?? null;
        setSoundscapes(available);
        selectedSoundscapeIdRef.current = initialSoundscapeId;
        setSelectedSoundscapeId(initialSoundscapeId);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError("Ambiance indisponible");
      }
    }

    loadSoundscapes();
    return () => {
      controller.abort();
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
      refreshSoundscapesPromiseRef.current = null;
      transitionIdRef.current += 1;
      isTransitioningRef.current = false;
      pendingSoundscapeRef.current = null;
      transitionTargetRef.current = null;
      soundscapeLoadControllers.forEach(({ controller: loadController }) =>
        loadController.abort(),
      );
      soundscapeLoadControllers.clear();
      soundscapeLoadVersions.forEach((loadVersion, soundscapeId) =>
        soundscapeLoadVersions.set(soundscapeId, loadVersion + 1),
      );
      selectedSoundscapeIdRef.current = null;
      continuousLoops.forEach((runtime) => runtime.dispose());
      audioElements.forEach((audio) => abortAudioRequest(audio));
      audioSourceExpiries.clear();
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
        const loadVersion =
          soundscapeLoadVersionsRef.current.get(activeSoundscape.id) ?? 0;
        let timer = 0;

        const playOneShot = () => {
          audio.currentTime = 0;
          void playAudioWithFreshSource(
            activeSoundscape,
            layer,
            audioKey(activeSoundscape.id, layer.id),
            audio,
            loadVersion,
          ).catch((playError) => {
            if (!(playError instanceof SoundscapeLoadCancelledError)) {
              setError("Un son ponctuel n’a pas pu être lu");
            }
          });
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
  }, [activeSoundscape, isPlaying, playAudioWithFreshSource]);

  useEffect(() => {
    if (!activeSoundscape || !signedUrlsExpireAt) return;

    const delay = Math.max(
      0,
      signedUrlsExpireAt -
        Date.now() -
        SIGNED_AUDIO_URL_REFRESH_LEEWAY_MS,
    );
    const timer = window.setTimeout(() => {
      void refreshSoundscapes()
        .then(() => prepareSoundscapeSources(activeSoundscape))
        .catch(() => undefined);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [
    activeSoundscape,
    bookId,
    prepareSoundscapeSources,
    refreshSoundscapes,
    signedUrlsExpireAt,
  ]);

  useEffect(() => {
    if (!activeSoundscape) return;

    const refreshWhenForegrounded = () => {
      if (document.visibilityState !== "visible") return;
      void refreshSoundscapes()
        .then(() => prepareSoundscapeSources(activeSoundscape))
        .catch(() => undefined);
    };

    document.addEventListener("visibilitychange", refreshWhenForegrounded);
    window.addEventListener("focus", refreshWhenForegrounded);
    window.addEventListener("pageshow", refreshWhenForegrounded);
    return () => {
      document.removeEventListener("visibilitychange", refreshWhenForegrounded);
      window.removeEventListener("focus", refreshWhenForegrounded);
      window.removeEventListener("pageshow", refreshWhenForegrounded);
    };
  }, [activeSoundscape, prepareSoundscapeSources, refreshSoundscapes]);

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

  const takePendingSoundscape = useCallback(() => {
    const pendingSoundscape = pendingSoundscapeRef.current;
    pendingSoundscapeRef.current = null;
    return pendingSoundscape;
  }, []);

  const selectSoundscape = useCallback(
    async (nextSoundscape: Soundscape) => {
      if (!activeSoundscape || nextSoundscape.id === selectedSoundscapeIdRef.current) {
        return;
      }

      selectedSoundscapeIdRef.current = nextSoundscape.id;
      setSelectedSoundscapeId(nextSoundscape.id);
      setError("");

      if (isTransitioningRef.current) {
        pendingSoundscapeRef.current = nextSoundscape;
        const transitionTarget = transitionTargetRef.current;
        if (transitionTarget && transitionTarget.id !== nextSoundscape.id) {
          cancelSoundscapeAudio(transitionTarget);
          setSoundscapeVolume(transitionTarget, 0);
        }
        return;
      }

      if (!isPlaying) {
        pendingSoundscapeRef.current = null;
        cancelSoundscapeAudio(activeSoundscape);
        return;
      }

      const transitionId = transitionIdRef.current + 1;
      transitionIdRef.current = transitionId;
      isTransitioningRef.current = true;
      let previousSoundscape = activeSoundscape;
      let requestedSoundscape = nextSoundscape;

      while (transitionIdRef.current === transitionId) {
        if (requestedSoundscape.id === previousSoundscape.id) {
          setSoundscapeVolume(previousSoundscape, 1);
          transitionTargetRef.current = null;
          break;
        }

        transitionTargetRef.current = requestedSoundscape;
        const requestedLoadVersion =
          soundscapeLoadVersionsRef.current.get(requestedSoundscape.id) ?? 0;

        try {
          setSoundscapeVolume(requestedSoundscape, 0);
          await playContinuousLayers(requestedSoundscape, requestedLoadVersion);

          if (
            (soundscapeLoadVersionsRef.current.get(requestedSoundscape.id) ?? 0) !==
            requestedLoadVersion
          ) {
            throw new SoundscapeLoadCancelledError();
          }

          const queuedBeforeFade = takePendingSoundscape();
          if (
            queuedBeforeFade &&
            queuedBeforeFade.id !== requestedSoundscape.id
          ) {
            cancelSoundscapeAudio(requestedSoundscape);
            setSoundscapeVolume(requestedSoundscape, 0);
            requestedSoundscape = queuedBeforeFade;
            continue;
          }

          const startedAt = performance.now();
          await new Promise<void>((resolve) => {
            function step(now: number) {
              if (
                transitionIdRef.current !== transitionId ||
                (soundscapeLoadVersionsRef.current.get(requestedSoundscape.id) ??
                  0) !== requestedLoadVersion
              ) {
                return resolve();
              }
              const progress = Math.min(
                1,
                (now - startedAt) / CROSSFADE_DURATION_MS,
              );
              setSoundscapeVolume(previousSoundscape, 1 - progress);
              setSoundscapeVolume(requestedSoundscape, progress);
              if (progress < 1) requestAnimationFrame(step);
              else resolve();
            }
            requestAnimationFrame(step);
          });

          if (transitionIdRef.current !== transitionId) break;
          if (
            (soundscapeLoadVersionsRef.current.get(requestedSoundscape.id) ?? 0) !==
            requestedLoadVersion
          ) {
            cancelSoundscapeAudio(requestedSoundscape);
            setSoundscapeVolume(requestedSoundscape, 0);
            setSoundscapeVolume(previousSoundscape, 1);

            const queuedDuringFade = takePendingSoundscape();
            if (
              queuedDuringFade &&
              queuedDuringFade.id !== previousSoundscape.id
            ) {
              requestedSoundscape = queuedDuringFade;
              continue;
            }
            selectedSoundscapeIdRef.current = previousSoundscape.id;
            setSelectedSoundscapeId(previousSoundscape.id);
            break;
          }

          cancelSoundscapeAudio(previousSoundscape);
          setSoundscapeVolume(requestedSoundscape, 1);
          previousSoundscape = requestedSoundscape;
          transitionTargetRef.current = null;

          const queuedAfterFade = takePendingSoundscape();
          if (
            queuedAfterFade &&
            queuedAfterFade.id !== previousSoundscape.id
          ) {
            requestedSoundscape = queuedAfterFade;
            continue;
          }

          break;
        } catch (switchError) {
          const wasCancelled =
            switchError instanceof SoundscapeLoadCancelledError;
          cancelSoundscapeAudio(requestedSoundscape);
          setSoundscapeVolume(requestedSoundscape, 0);
          setSoundscapeVolume(previousSoundscape, 1);

          const queuedAfterError = takePendingSoundscape();
          if (
            queuedAfterError &&
            queuedAfterError.id !== previousSoundscape.id
          ) {
            requestedSoundscape = queuedAfterError;
            continue;
          }

          selectedSoundscapeIdRef.current = previousSoundscape.id;
          setSelectedSoundscapeId(previousSoundscape.id);
          if (!wasCancelled) {
            setError("Changement d’ambiance impossible");
          }
          break;
        }
      }

      if (transitionIdRef.current === transitionId) {
        isTransitioningRef.current = false;
        transitionTargetRef.current = null;
      }
    },
    [
      activeSoundscape,
      cancelSoundscapeAudio,
      isPlaying,
      playContinuousLayers,
      setSoundscapeVolume,
      takePendingSoundscape,
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
                    ? "auto"
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
