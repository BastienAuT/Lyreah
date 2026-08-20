import { describe, expect, test } from "bun:test";
import {
  AUDIO_PREFERENCES_VERSION,
  audioPreferencesStorageKey,
  DEFAULT_AUDIO_VOLUME,
  DEFAULT_EFFECTS_INTENSITY,
  parseAudioPreferences,
} from "./preferences";

describe("audio preferences", () => {
  test("uses a separate storage key for each book", () => {
    expect(audioPreferencesStorageKey("book-42")).toBe(
      "lyreah.audio.preferences.v1.book-42",
    );
  });

  test("restores a selected ambience and volume", () => {
    expect(
      parseAudioPreferences(
        JSON.stringify({
          effectsIntensity: 84,
          performanceMode: true,
          soundscapeId: "forest",
          volume: 72,
        }),
      ),
    ).toEqual({
      effectsIntensity: 84,
      performanceMode: true,
      soundscapeId: "forest",
      volume: 72,
    });
  });

  test("migrates the former default visual intensity to 100 percent", () => {
    expect(
      parseAudioPreferences(
        JSON.stringify({
          effectsIntensity: 72,
          performanceMode: false,
          soundscapeId: "forest",
          volume: 55,
        }),
      ).effectsIntensity,
    ).toBe(100);
    expect(
      parseAudioPreferences(
        JSON.stringify({
          effectsIntensity: 72,
          preferencesVersion: AUDIO_PREFERENCES_VERSION,
        }),
      ).effectsIntensity,
    ).toBe(72);
  });

  test("clamps volume and rejects malformed values", () => {
    expect(
      parseAudioPreferences(
        JSON.stringify({
          effectsIntensity: -20,
          performanceMode: "yes",
          soundscapeId: "",
          volume: 180,
        }),
      ),
    ).toEqual({
      effectsIntensity: 0,
      performanceMode: false,
      soundscapeId: null,
      volume: 100,
    });
    expect(parseAudioPreferences("invalid")).toEqual({
      effectsIntensity: DEFAULT_EFFECTS_INTENSITY,
      performanceMode: false,
      soundscapeId: null,
      volume: DEFAULT_AUDIO_VOLUME,
    });
  });
});
