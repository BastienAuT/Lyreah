// Longer than the longest curated loop, so an audible slot can finish before
// its old URL expires while the paused slot is renewed in the background.
export const SIGNED_AUDIO_URL_REFRESH_LEEWAY_MS = 15 * 60 * 1_000;
export const SIGNED_AUDIO_URL_LIFETIME_SECONDS = 2 * 60 * 60;
export const SIGNED_AUDIO_URL_FALLBACK_LIFETIME_SECONDS =
  SIGNED_AUDIO_URL_LIFETIME_SECONDS;

export function getSignedAudioUrlExpiry(
  expiresIn: unknown,
  receivedAt = Date.now(),
) {
  const lifetimeSeconds =
    typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0
      ? expiresIn
      : SIGNED_AUDIO_URL_FALLBACK_LIFETIME_SECONDS;

  return receivedAt + lifetimeSeconds * 1_000;
}

export function shouldRefreshSignedAudioUrl(
  expiresAt: number | undefined,
  now = Date.now(),
  leewayMs = SIGNED_AUDIO_URL_REFRESH_LEEWAY_MS,
) {
  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) return true;
  return expiresAt <= now + leewayMs;
}
