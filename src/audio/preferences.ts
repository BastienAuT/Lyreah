export const DEFAULT_AUDIO_VOLUME = 55;
export const DEFAULT_EFFECTS_INTENSITY = 100;
export const AUDIO_PREFERENCES_VERSION = 2;
const LEGACY_DEFAULT_EFFECTS_INTENSITY = 72;

export type AudioPreferences = {
  effectsIntensity: number;
  performanceMode: boolean;
  soundscapeId: string | null;
  volume: number;
};

export function audioPreferencesStorageKey(bookId: string) {
  return `lyreah.audio.preferences.v1.${bookId}`;
}

export function parseAudioPreferences(value: string | null): AudioPreferences {
  if (!value) {
    return {
      effectsIntensity: DEFAULT_EFFECTS_INTENSITY,
      performanceMode: false,
      soundscapeId: null,
      volume: DEFAULT_AUDIO_VOLUME,
    };
  }

  try {
    const parsed = JSON.parse(value) as Partial<AudioPreferences> & {
      preferencesVersion?: number;
    };
    const volume =
      typeof parsed.volume === "number" && Number.isFinite(parsed.volume)
        ? Math.min(100, Math.max(0, Math.round(parsed.volume)))
        : DEFAULT_AUDIO_VOLUME;
    const storedEffectsIntensity =
      typeof parsed.effectsIntensity === "number" &&
      Number.isFinite(parsed.effectsIntensity)
        ? Math.min(100, Math.max(0, Math.round(parsed.effectsIntensity)))
        : DEFAULT_EFFECTS_INTENSITY;
    const effectsIntensity =
      parsed.preferencesVersion !== AUDIO_PREFERENCES_VERSION &&
      storedEffectsIntensity === LEGACY_DEFAULT_EFFECTS_INTENSITY
        ? DEFAULT_EFFECTS_INTENSITY
        : storedEffectsIntensity;

    return {
      effectsIntensity,
      performanceMode:
        typeof parsed.performanceMode === "boolean"
          ? parsed.performanceMode
          : false,
      soundscapeId:
        typeof parsed.soundscapeId === "string" && parsed.soundscapeId.trim()
          ? parsed.soundscapeId
          : null,
      volume,
    };
  } catch {
    return {
      effectsIntensity: DEFAULT_EFFECTS_INTENSITY,
      performanceMode: false,
      soundscapeId: null,
      volume: DEFAULT_AUDIO_VOLUME,
    };
  }
}
