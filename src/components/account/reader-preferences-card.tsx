"use client";

import { useState } from "react";
import {
  DEFAULT_READER_PREFERENCES,
  READER_PREFERENCES_STORAGE_KEY,
  type ReaderFont,
  type ReaderPreferences,
  type ReaderTheme,
} from "@/reader/preferences";

const themes: Array<{ label: string; value: ReaderTheme }> = [
  { label: "Papier", value: "paper" },
  { label: "Sépia", value: "sepia" },
  { label: "Nuit", value: "night" },
];

const fonts: Array<{ label: string; value: ReaderFont }> = [
  { label: "Classique", value: "classic" },
  { label: "Élégante", value: "elegant" },
  { label: "Accessible", value: "accessible" },
];

export function ReaderPreferencesCard({
  initialPreferences,
}: {
  initialPreferences: ReaderPreferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  function update(patch: Partial<ReaderPreferences>) {
    setPreferences((current) => ({ ...current, ...patch }));
    setStatus("idle");
  }

  async function savePreferences() {
    setStatus("saving");

    try {
      const response = await fetch("/api/account/reader-preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) throw new Error("save failed");

      window.localStorage.setItem(
        READER_PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences),
      );
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section className="account-preferences-card" aria-labelledby="reader-preferences-title">
      <div className="account-preferences-card__heading">
        <div>
          <p>Confort de lecture</p>
          <h2 id="reader-preferences-title">Préférences du lecteur</h2>
          <span>
            Ces réglages vous suivent sur tous vos appareils connectés à Lyreah.
          </span>
        </div>
        <div
          aria-hidden="true"
          className={`account-reader-preview account-reader-preview--${preferences.theme} account-reader-preview--${preferences.font}`}
          style={{
            fontSize: `${Math.max(82, preferences.fontSize - 18)}%`,
            lineHeight: preferences.lineHeight,
          }}
        >
          <small>Chapitre I</small>
          <strong>Il était une fois…</strong>
        </div>
      </div>

      <div className="account-preferences-card__controls">
        <fieldset>
          <legend>Thème de la page</legend>
          <div className="account-preference-options">
            {themes.map((theme) => (
              <button
                aria-pressed={preferences.theme === theme.value}
                key={theme.value}
                onClick={() => update({ theme: theme.value })}
                type="button"
              >
                <i className={`account-theme-swatch account-theme-swatch--${theme.value}`} />
                {theme.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend>Police</legend>
          <div className="account-preference-options">
            {fonts.map((font) => (
              <button
                aria-pressed={preferences.font === font.value}
                className={`account-font-option--${font.value}`}
                key={font.value}
                onClick={() => update({ font: font.value })}
                type="button"
              >
                {font.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="account-preference-range">
          <span>
            Taille du texte <output>{preferences.fontSize} %</output>
          </span>
          <input
            max="140"
            min="88"
            onChange={(event) => update({ fontSize: Number(event.target.value) })}
            step="2"
            type="range"
            value={preferences.fontSize}
          />
        </label>

        <label className="account-preference-range">
          <span>
            Interlignage <output>{preferences.lineHeight.toFixed(1)}</output>
          </span>
          <input
            max="2.1"
            min="1.5"
            onChange={(event) => update({ lineHeight: Number(event.target.value) })}
            step="0.1"
            type="range"
            value={preferences.lineHeight}
          />
        </label>

        <label className="account-preference-toggle">
          <span>
            <strong>Grain du papier</strong>
            <small>Ajoute une texture légère à la page.</small>
          </span>
          <input
            checked={preferences.texture}
            onChange={(event) => update({ texture: event.target.checked })}
            type="checkbox"
          />
        </label>
      </div>

      <div className="account-preferences-card__footer">
        <p aria-live="polite" className={`account-save-status account-save-status--${status}`}>
          {status === "saving" && "Enregistrement…"}
          {status === "saved" && "Préférences enregistrées."}
          {status === "error" && "Impossible d’enregistrer les préférences."}
        </p>
        <button
          className="account-reset-button"
          onClick={() => update(DEFAULT_READER_PREFERENCES)}
          type="button"
        >
          Réinitialiser
        </button>
        <button
          className="account-save-button"
          disabled={status === "saving"}
          onClick={savePreferences}
          type="button"
        >
          Enregistrer
        </button>
      </div>
    </section>
  );
}
