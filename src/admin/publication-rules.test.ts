import { describe, expect, test } from "bun:test";
import { canPublishBook } from "./publication-rules";

describe("canPublishBook", () => {
  test("allows a ready book with an EPUB rendition", () => {
    expect(
      canPublishBook({
        language: "fr",
        processingStatus: "ready",
        epubRenditionPrefix: "dev/renditions/book-42",
      }),
    ).toBe(true);
  });

  test("rejects books that are incomplete or missing their rendition", () => {
    expect(
      canPublishBook({
        language: "fr",
        processingStatus: "processing",
        epubRenditionPrefix: "dev/renditions/book-42",
      }),
    ).toBe(false);
    expect(
      canPublishBook({ language: "fr", processingStatus: "ready", epubRenditionPrefix: null }),
    ).toBe(false);
    expect(
      canPublishBook({
        language: "en",
        processingStatus: "ready",
        epubRenditionPrefix: "dev/renditions/book-42",
      }),
    ).toBe(false);
  });
});
