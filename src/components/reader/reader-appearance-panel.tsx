"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ReaderFont,
  ReaderPreferences,
  ReaderTheme,
} from "@/reader/preferences";

const themes: Array<{ value: ReaderTheme; label: string }> = [
  { value: "paper", label: "Papier" },
  { value: "sepia", label: "Sépia" },
  { value: "night", label: "Nuit" },
];

const fonts: Array<{ value: ReaderFont; label: string }> = [
  { value: "classic", label: "Classique" },
  { value: "elegant", label: "Élégante" },
  { value: "accessible", label: "Accessible" },
];

export function ReaderAppearancePanel({
  disabled,
  onChange,
  preferences,
}: {
  disabled: boolean;
  onChange: (preferences: ReaderPreferences) => void;
  preferences: ReaderPreferences;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function update(patch: Partial<ReaderPreferences>) {
    onChange({ ...preferences, ...patch });
  }

  return (
    <div className="reader-appearance" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label="Réglages d’apparence"
        className="reader-appearance__trigger"
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true">Aa</span>
      </button>

      {isOpen ? (
        <div
          aria-label="Apparence de la page"
          className="reader-appearance__panel"
          role="dialog"
        >
          <div className="reader-appearance__heading">
            <div>
              <small>Confort de lecture</small>
              <strong>Apparence</strong>
            </div>
            <button
              aria-label="Fermer les réglages"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>

          <fieldset className="reader-appearance__themes">
            <legend>Ambiance</legend>
            <div>
              {themes.map((theme) => (
                <button
                  aria-pressed={preferences.theme === theme.value}
                  className={`reader-appearance__theme reader-appearance__theme--${theme.value}`}
                  key={theme.value}
                  onClick={() => update({ theme: theme.value })}
                  type="button"
                >
                  <i aria-hidden="true" />
                  {theme.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="reader-appearance__fonts">
            <legend>Police</legend>
            <div>
              {fonts.map((font) => (
                <button
                  aria-pressed={preferences.font === font.value}
                  className={`reader-appearance__font reader-appearance__font--${font.value}`}
                  key={font.value}
                  onClick={() => update({ font: font.value })}
                  type="button"
                >
                  {font.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="reader-appearance__range">
            <span>
              Taille du texte <output>{preferences.fontSize} %</output>
            </span>
            <input
              aria-label="Taille du texte"
              max="140"
              min="88"
              onChange={(event) => update({ fontSize: Number(event.target.value) })}
              step="2"
              type="range"
              value={preferences.fontSize}
            />
          </label>

          <label className="reader-appearance__range">
            <span>
              Interlignage <output>{preferences.lineHeight.toFixed(1)}</output>
            </span>
            <input
              aria-label="Interlignage"
              max="2.1"
              min="1.5"
              onChange={(event) => update({ lineHeight: Number(event.target.value) })}
              step="0.1"
              type="range"
              value={preferences.lineHeight}
            />
          </label>

          <label className="reader-appearance__texture">
            <span>
              <strong>Grain du papier</strong>
              <small>Une texture très légère, comme une vraie page.</small>
            </span>
            <input
              checked={preferences.texture}
              onChange={(event) => update({ texture: event.target.checked })}
              type="checkbox"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
