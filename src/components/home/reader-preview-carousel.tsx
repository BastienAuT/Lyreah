"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_ROTATE_MS = 6_000;
const FADE_DURATION_MS = 500;

const slides = [
  {
    ambience: "Orage gothique",
    chapter: "Livre premier · Chapitre IV",
    effect: "storm",
    heading: "L’étrange cylindre",
    page: "Page 3 sur 12",
    paragraphs: [
      "Au-delà des toits, une lueur rouge déchirait le ciel. Puis la première machine se dressa dans le silence.",
      "Personne ne bougeait. Le monde familier venait, en un instant, de devenir immense et inconnu.",
    ],
    slug: "la-guerre-des-mondes",
    title: "La Guerre des mondes",
  },
  {
    ambience: "Clairière nocturne",
    chapter: "Chapitre VII",
    effect: "fireflies",
    heading: "Un thé de fous",
    page: "Page 5 sur 18",
    paragraphs: [
      "Alice s’approcha de la longue table dressée sous les arbres, où chaque place semblait déjà occupée.",
      "Les tasses changeaient de main, les devinettes restaient sans réponse et le temps refusait d’avancer.",
    ],
    slug: "alice-au-pays-des-merveilles",
    title: "Alice au pays des merveilles",
  },
  {
    ambience: "À bord du sous-marin",
    chapter: "Première partie · Chapitre XIV",
    effect: "submarine",
    heading: "Le fleuve noir",
    page: "Page 8 sur 24",
    paragraphs: [
      "Le Nautilus glissait sous les eaux profondes, dans une obscurité que ses fanaux traversaient à peine.",
      "Au-delà des vitres, une forêt silencieuse se balançait sous le courant comme un paysage dans un rêve.",
    ],
    slug: "vingt-mille-lieues-sous-les-mers",
    title: "Vingt mille lieues sous les mers",
  },
] as const;

export function ReaderPreviewCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previousIndex, setPreviousIndex] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSlide = useCallback(
    (nextIndex: number) => {
      if (nextIndex === activeIndex) return;
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setPreviousIndex(activeIndex);
      setActiveIndex(nextIndex);
      fadeTimerRef.current = setTimeout(() => {
        setPreviousIndex(null);
        fadeTimerRef.current = null;
      }, FADE_DURATION_MS);
    },
    [activeIndex],
  );

  const move = useCallback(
    (direction: -1 | 1) => {
      showSlide((activeIndex + direction + slides.length) % slides.length);
    },
    [activeIndex, showSlide],
  );

  useEffect(() => {
    if (isPaused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const timer = window.setTimeout(() => move(1), AUTO_ROTATE_MS);
    return () => window.clearTimeout(timer);
  }, [activeIndex, isPaused, move]);

  useEffect(
    () => () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    },
    [],
  );

  return (
    <div
      aria-label="Aperçus du lecteur Lyreah"
      aria-roledescription="carrousel"
      className="reader-carousel"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
      }}
      onFocus={() => setIsPaused(true)}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      tabIndex={0}
    >
      <div className="reader-carousel__slides">
        {slides.map((slide, index) => {
          const isActive = index === activeIndex;
          const isPrevious = index === previousIndex;

          return (
            <article
              aria-hidden={!isActive}
              aria-label={`${slide.title}, ${index + 1} sur ${slides.length}`}
              className={`reader-preview${isActive ? " is-active" : ""}${isPrevious ? " is-leaving" : ""}`}
              data-effect={slide.effect}
              key={slide.slug}
            >
              <header className="reader-preview__header">
                <span>Lecture</span>
                <strong aria-live={isActive ? "polite" : "off"}>{slide.title}</strong>
                <span className="reader-preview__appearance" aria-hidden="true">Aa</span>
              </header>

              <div className="reader-preview__stage">
                <div className="reader-preview__atmosphere" aria-hidden="true">
                  <i /><i /><i />
                </div>
                <div className="reader-preview__page">
                  <small>{slide.chapter}</small>
                  <h2>{slide.heading}</h2>
                  {slide.paragraphs.map((paragraph, paragraphIndex) => (
                    <p className={paragraphIndex === 0 ? "drop-cap" : undefined} key={paragraph}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              <footer className="reader-preview__footer">
                <div className="reader-preview__player">
                  <span aria-hidden="true">♫</span>
                  <p><small>Ambiance</small><strong>{slide.ambience}</strong></p>
                  <i aria-hidden="true" />
                </div>
                <div className="reader-preview__navigation" aria-hidden="true">
                  <span>← Page précédente</span><span>Page suivante →</span>
                </div>
                <div className="reader-preview__progress" aria-hidden="true">
                  <span>{slide.page}</span>
                </div>
              </footer>

              <Link
                aria-label={`Découvrir ${slide.title}`}
                className="reader-preview__link"
                href={`/livres/${slide.slug}`}
                tabIndex={isActive ? 0 : -1}
              >
                Découvrir cette lecture
              </Link>
            </article>
          );
        })}
      </div>

      <button
        aria-label="Afficher le livre précédent"
        className="reader-carousel__arrow reader-carousel__arrow--previous"
        onClick={() => move(-1)}
        type="button"
      >
        <span aria-hidden="true">←</span>
      </button>
      <button
        aria-label="Afficher le livre suivant"
        className="reader-carousel__arrow reader-carousel__arrow--next"
        onClick={() => move(1)}
        type="button"
      >
        <span aria-hidden="true">→</span>
      </button>

      <div className="reader-carousel__dots" aria-label="Contrôles du carrousel">
        {slides.map((item, index) => (
          <button
            aria-label={`Afficher ${item.title}`}
            aria-pressed={index === activeIndex}
            key={item.slug}
            onClick={() => showSlide(index)}
            type="button"
          />
        ))}
        <button
          aria-label={isPaused ? "Relancer le défilement automatique" : "Suspendre le défilement automatique"}
          className="reader-carousel__autoplay"
          onClick={() => setIsPaused((paused) => !paused)}
          type="button"
        >
          <span aria-hidden="true">{isPaused ? "▶" : "Ⅱ"}</span>
        </button>
      </div>
    </div>
  );
}
