import { describe, expect, test } from "bun:test";
import { assertFrenchEpub } from "./epub-language";

const file = (path: string, contents: string) => ({
  contentType: path.endsWith(".opf") ? "application/oebps-package+xml" : "application/xhtml+xml",
  contents: new TextEncoder().encode(contents),
  path,
});

describe("assertFrenchEpub", () => {
  test("accepte des métadonnées et un texte réellement français", () => {
    expect(() => assertFrenchEpub([
      file("book.opf", "<package><metadata><dc:language>fr</dc:language></metadata></package>"),
      file("chapter.xhtml", `<p>${"Dans cette maison, elle était avec nous pour tout comprendre. ".repeat(8)}</p>`),
    ], "book.opf")).not.toThrow();
  });

  test("refuse un EPUB anglais étiqueté français", () => {
    expect(() => assertFrenchEpub([
      file("book.opf", "<package><metadata><dc:language>fr</dc:language></metadata></package>"),
      file("chapter.xhtml", `<p>${"The house was there and you were with their friends. ".repeat(12)}</p>`),
    ], "book.opf")).toThrow("EPUB_CONTENT_NOT_FRENCH");
  });
});
