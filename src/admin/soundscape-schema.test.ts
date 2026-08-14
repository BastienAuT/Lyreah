import { describe, expect, test } from "bun:test";
import {
  isAudioFile,
  MAX_AUDIO_FILE_BYTES,
  prepareSoundscapeSchema,
  updateSoundscapeSchema,
} from "./soundscape-schema";

const validPrepareInput = {
  attribution: "Studio Lyreah",
  bookId: "c5c37366-5305-41b8-bfc8-ab0aa732c7d9",
  description: "Une pluie douce.",
  files: [{ name: "rain.ogg", size: 2048, type: "audio/ogg" }],
  isDefault: true,
  layers: [{ title: "Pluie", volume: 0.7 }],
  licenseName: "Création originale",
  licenseSourceUrl: "",
  title: "Pluie nocturne",
  visualEffect: "rain",
};

describe("soundscape admin schemas", () => {
  test("accepts a complete layered soundscape", () => {
    expect(prepareSoundscapeSchema.safeParse(validPrepareInput).success).toBe(true);
  });

  test("requires one metadata entry per uploaded file", () => {
    expect(
      prepareSoundscapeSchema.safeParse({
        ...validPrepareInput,
        files: [...validPrepareInput.files, validPrepareInput.files[0]],
      }).success,
    ).toBe(false);
  });

  test("validates effect and update metadata", () => {
    expect(
      updateSoundscapeSchema.safeParse({
        ...validPrepareInput,
        files: undefined,
        layers: undefined,
        isActive: true,
      }).success,
    ).toBe(true);
    expect(
      updateSoundscapeSchema.safeParse({
        ...validPrepareInput,
        files: undefined,
        layers: undefined,
        isActive: true,
        visualEffect: "snow",
      }).success,
    ).toBe(false);
    expect(
      prepareSoundscapeSchema.safeParse({
        ...validPrepareInput,
        visualEffect: "harbor",
      }).success,
    ).toBe(true);
  });
});

describe("isAudioFile", () => {
  test("accepts supported audio formats", () => {
    expect(isAudioFile(validPrepareInput.files[0])).toBe(true);
  });

  test("rejects mismatched and oversized files", () => {
    expect(isAudioFile({ name: "rain.exe", size: 10, type: "audio/ogg" })).toBe(false);
    expect(
      isAudioFile({
        name: "rain.ogg",
        size: MAX_AUDIO_FILE_BYTES + 1,
        type: "audio/ogg",
      }),
    ).toBe(false);
  });
});
