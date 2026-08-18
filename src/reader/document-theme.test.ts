import { describe, expect, test } from "bun:test";
import {
  getReaderDocumentThemeCss,
  readerPalettes,
} from "./document-theme";

describe("getReaderDocumentThemeCss", () => {
  test.each(["paper", "sepia", "night"] as const)(
    "colors the complete EPUB document in %s mode",
    (theme) => {
      const css = getReaderDocumentThemeCss({ texture: true, theme });

      expect(css).toContain(`background-color: ${readerPalettes[theme].page} !important`);
      expect(css).toContain(`color: ${readerPalettes[theme].text} !important`);
      expect(css).toContain("body {\n  background-color: transparent !important");
      expect(css).toContain(
        `color-scheme: ${theme === "night" ? "dark" : "light"}`,
      );
    },
  );

  test("removes the paper texture from both EPUB layers when disabled", () => {
    const css = getReaderDocumentThemeCss({ texture: false, theme: "night" });

    expect(css).toContain("background-image: none !important");
    expect(css).not.toContain("radial-gradient");
  });
});
