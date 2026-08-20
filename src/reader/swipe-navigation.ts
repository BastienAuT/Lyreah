export type SwipeDirection = "previous" | "next";

type SwipeGesture = {
  deltaX: number;
  deltaY: number;
  durationMs: number;
  viewportWidth: number;
};

const MAX_SWIPE_DURATION_MS = 850;
const MIN_SWIPE_DISTANCE_PX = 48;
const MAX_SWIPE_DISTANCE_PX = 92;
const VIEWPORT_DISTANCE_RATIO = 0.12;
const HORIZONTAL_INTENT_RATIO = 1.25;

export function getSwipeDirection({
  deltaX,
  deltaY,
  durationMs,
  viewportWidth,
}: SwipeGesture): SwipeDirection | null {
  const minimumDistance = Math.min(
    MAX_SWIPE_DISTANCE_PX,
    Math.max(MIN_SWIPE_DISTANCE_PX, viewportWidth * VIEWPORT_DISTANCE_RATIO),
  );

  if (
    durationMs > MAX_SWIPE_DURATION_MS ||
    Math.abs(deltaX) < minimumDistance ||
    Math.abs(deltaX) <= Math.abs(deltaY) * HORIZONTAL_INTENT_RATIO
  ) {
    return null;
  }

  return deltaX < 0 ? "next" : "previous";
}
