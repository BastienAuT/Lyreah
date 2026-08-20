import { describe, expect, test } from "bun:test";
import {
  getSignedAudioUrlExpiry,
  SIGNED_AUDIO_URL_FALLBACK_LIFETIME_SECONDS,
  shouldRefreshSignedAudioUrl,
} from "./signed-url-refresh";

describe("signed audio URL refresh", () => {
  test("derives the local expiry from the lifetime returned by the API", () => {
    expect(getSignedAudioUrlExpiry(900, 10_000)).toBe(910_000);
  });

  test("falls back to the server lifetime for malformed responses", () => {
    expect(getSignedAudioUrlExpiry(undefined, 10_000)).toBe(
      10_000 + SIGNED_AUDIO_URL_FALLBACK_LIFETIME_SECONDS * 1_000,
    );
    expect(getSignedAudioUrlExpiry(-1, 10_000)).toBe(
      10_000 + SIGNED_AUDIO_URL_FALLBACK_LIFETIME_SECONDS * 1_000,
    );
  });

  test("refreshes missing and nearly expired URLs, but keeps fresh ones", () => {
    expect(shouldRefreshSignedAudioUrl(undefined, 100_000, 20_000)).toBe(true);
    expect(shouldRefreshSignedAudioUrl(119_999, 100_000, 20_000)).toBe(true);
    expect(shouldRefreshSignedAudioUrl(120_001, 100_000, 20_000)).toBe(false);
  });
});
