import { describe, expect, test } from "bun:test";
import { getSwipeDirection } from "./swipe-navigation";

describe("reader swipe navigation", () => {
  test("turns to the next page after a deliberate swipe to the left", () => {
    expect(
      getSwipeDirection({
        deltaX: -90,
        deltaY: 12,
        durationMs: 320,
        viewportWidth: 390,
      }),
    ).toBe("next");
  });

  test("turns to the previous page after a deliberate swipe to the right", () => {
    expect(
      getSwipeDirection({
        deltaX: 110,
        deltaY: -18,
        durationMs: 480,
        viewportWidth: 820,
      }),
    ).toBe("previous");
  });

  test("ignores short, vertical, and overly slow gestures", () => {
    expect(
      getSwipeDirection({
        deltaX: 28,
        deltaY: 2,
        durationMs: 200,
        viewportWidth: 390,
      }),
    ).toBeNull();
    expect(
      getSwipeDirection({
        deltaX: 70,
        deltaY: 90,
        durationMs: 300,
        viewportWidth: 390,
      }),
    ).toBeNull();
    expect(
      getSwipeDirection({
        deltaX: -100,
        deltaY: 3,
        durationMs: 1_000,
        viewportWidth: 390,
      }),
    ).toBeNull();
  });
});
