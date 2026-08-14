import { describe, expect, test } from "bun:test";
import {
  DEFAULT_READER_PREFERENCES,
  parseReaderPreferences,
} from "./preferences";

describe("parseReaderPreferences", () => {
  test("returns defaults for missing or invalid preferences", () => {
    expect(parseReaderPreferences(null)).toEqual(DEFAULT_READER_PREFERENCES);
    expect(parseReaderPreferences("not-json")).toEqual(DEFAULT_READER_PREFERENCES);
  });

  test("restores valid preferences", () => {
    expect(
      parseReaderPreferences(
        JSON.stringify({
          theme: "night",
          font: "accessible",
          fontSize: 124,
          lineHeight: 2,
          texture: false,
        }),
      ),
    ).toEqual({
      theme: "night",
      font: "accessible",
      fontSize: 124,
      lineHeight: 2,
      texture: false,
    });
  });

  test("clamps numeric values and replaces unknown choices", () => {
    expect(
      parseReaderPreferences(
        JSON.stringify({
          theme: "blue",
          font: "comic",
          fontSize: 999,
          lineHeight: 0.8,
          texture: "yes",
        }),
      ),
    ).toEqual({
      ...DEFAULT_READER_PREFERENCES,
      fontSize: 140,
      lineHeight: 1.5,
    });
  });
});
