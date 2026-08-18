"use client";

import Link from "next/link";
import { useState } from "react";

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
    progress: 42,
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
    progress: 28,
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
    progress: 61,
    slug: "vingt-mille-lieues-sous-les-mers",
    title: "Vingt mille lieues sous les mers",
  },
] as const;

export function ReaderPreviewCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const slide = slides[activeIndex];

  function move(direction: -1 | 1) {
    setActiveIndex((current) => (current + direction + slides.length) % slides.length);
  }

  return (
    <div
      aria-label="Aperçus du lecteur Lyreah"
      aria-roledescription="carrousel"
      className="reader-carousel"
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
      role="region"
      tabIndex={0}
    >
      <article
        aria-label={`${slide.title}, ${activeIndex + 1} sur ${slides.length}`}
        className="reader-preview"
        data-effect={slide.effect}
        key={slide.slug}
      >
        <header className="reader-preview__header">
          <span>{slide.page}</span>
          <strong aria-live="polite">{slide.title}</strong>
          <span className="reader-preview__appearance" aria-hidden="true">Aa</span>
        </header>

        <div className="reader-preview__stage">
          <div className="reader-preview__atmosphere" aria-hidden="true">
            <i /><i /><i />
          </div>
          <div className="reader-preview__page">
            <small>{slide.chapter}</small>
            <h2>{slide.heading}</h2>
            {slide.paragraphs.map((paragraph, index) => (
              <p className={index === 0 ? "drop-cap" : undefined} key={paragraph}>
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
            <span>{slide.progress} %</span>
            <b><i style={{ width: `${slide.progress}%` }} /></b>
          </div>
        </footer>

        <Link
          aria-label={`Découvrir ${slide.title}`}
          className="reader-preview__link"
          href={`/livres/${slide.slug}`}
        >
          Découvrir cette lecture
        </Link>
      </article>

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

      <div className="reader-carousel__dots" aria-label="Choisir un aperçu">
        {slides.map((item, index) => (
          <button
            aria-label={`Afficher ${item.title}`}
            aria-pressed={index === activeIndex}
            key={item.slug}
            onClick={() => setActiveIndex(index)}
            type="button"
          />
        ))}
      </div>
    </div>
  );
}
