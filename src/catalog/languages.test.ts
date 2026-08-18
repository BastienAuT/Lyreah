import { describe, expect, test } from "bun:test";
import { formatBookLanguage } from "./languages";

describe("formatBookLanguage", () => {
  test("rend la langue de lecture explicite", () => {
    expect(formatBookLanguage("fr")).toBe("Texte en français");
    expect(formatBookLanguage("en")).toBe("Texte en anglais");
  });
});
