"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type SoundscapeLayer = {
  id: string;
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
  layers: SoundscapeLayer[];
};

type SoundscapeResponse = {
  soundscape: Soundscape | null;
};

export function AmbientAudioPlayer({ bookId }: { bookId: string }) {
  const playerRef = useRef<HTMLDivElement>(null);
  const audioRefs = useRef<Array<HTMLAudioElement | null>>([]);
  const [soundscape, setSoundscape] = useState<Soundscape | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [volume, setVolume] = useState(55);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSoundscape() {
      try {
        const response = await fetch(`/api/reader/books/${bookId}/soundscape`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("L’ambiance n’a pas pu être chargée.");
        }

        const data = (await response.json()) as SoundscapeResponse;
        setSoundscape(data.soundscape);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError("Ambiance indisponible");
      }
    }

    loadSoundscape();

    return () => {
      controller.abort();
    };
  }, [bookId]);

  useEffect(() => {
    const audioElements = audioRefs.current;

    return () => {
      audioElements.forEach((audio) => audio?.pause());
    };
  }, [soundscape]);

  useEffect(() => {
    if (!isExpanded) return;

    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !playerRef.current?.contains(event.target)
      ) {
        setIsExpanded(false);
      }
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExpanded(false);
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
    audioRefs.current.forEach((audio, index) => {
      const layer = soundscape?.layers[index];

      if (audio && layer) {
        audio.volume = Math.min(1, (volume / 100) * layer.volume);
      }
    });
  }, [soundscape, volume]);

  const togglePlayback = useCallback(async () => {
    const audioElements = audioRefs.current.filter(
      (audio): audio is HTMLAudioElement => Boolean(audio),
    );

    if (isPlaying) {
      audioElements.forEach((audio) => audio.pause());
      setIsPlaying(false);
      return;
    }

    try {
      setError("");
      await Promise.all(audioElements.map((audio) => audio.play()));
      setIsPlaying(true);
    } catch {
      audioElements.forEach((audio) => audio.pause());
      setError("Lecture audio impossible");
    }
  }, [isPlaying]);

  if (!soundscape) {
    return error ? <span className="ambient-player__error">{error}</span> : null;
  }

  return (
    <div className="ambient-player" ref={playerRef}>
      {soundscape.layers.map((layer, index) => (
        <audio
          key={layer.id}
          loop
          preload="none"
          ref={(audio) => {
            audioRefs.current[index] = audio;
          }}
          src={layer.url}
        />
      ))}

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
          <strong>{soundscape.title}</strong>
          {soundscape.description ? <span>{soundscape.description}</span> : null}
          <label>
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
          <small>
            {soundscape.attribution ? `${soundscape.attribution} · ` : ""}
            {soundscape.licenseSourceUrl ? (
              <a href={soundscape.licenseSourceUrl} rel="noreferrer" target="_blank">
                {soundscape.licenseName}
              </a>
            ) : (
              soundscape.licenseName
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
            <strong>{soundscape.title}</strong>
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
