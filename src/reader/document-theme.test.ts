import { describe, expect, test } from "bun:test";
import {
  getReaderDocumentThemeCss,
  readerPalettes,
} from "./document-theme";
import { DEFAULT_READER_PREFERENCES } from "./preferences";

describe("getReaderDocumentThemeCss", () => {
  test.each(["paper", "sepia", "night"] as const)(
    "colors the complete EPUB document in %s mode",
    (theme) => {
      const css = getReaderDocumentThemeCss({
        ...DEFAULT_READER_PREFERENCES,
        texture: true,
        theme,
      });

      expect(css).toContain(`background-color: ${readerPalettes[theme].page} !important`);
      expect(css).toContain(`color: ${readerPalettes[theme].text} !important`);
      expect(css).toContain("body {\n  background-color: transparent !important");
      expect(css).toContain(
        `color-scheme: ${theme === "night" ? "dark" : "light"}`,
      );
    },
  );

  test("removes the paper texture from both EPUB layers when disabled", () => {
    const css = getReaderDocumentThemeCss({
      ...DEFAULT_READER_PREFERENCES,
      texture: false,
      theme: "night",
    });

    expect(css).toContain("background-image: none !important");
    expect(css).not.toContain("radial-gradient");
  });

  test("forces font size and line height inside EPUB paragraphs", () => {
    const css = getReaderDocumentThemeCss({
      ...DEFAULT_READER_PREFERENCES,
      font: "accessible",
      fontSize: 88,
      lineHeight: 2.1,
    });

    expect(css).toContain("font-family: Arial, Helvetica, sans-serif !important");
    expect(css).toContain("font-size: 88% !important");
    expect(css).toContain("body p,");
    expect(css).toContain("line-height: 2.1 !important");
  });
});
