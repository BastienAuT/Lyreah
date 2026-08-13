import { describe, expect, test } from "bun:test";
import { canReadBook } from "./access-rules";

const readableBook = {
  publishedAt: new Date("2026-08-13T00:00:00Z"),
  processingStatus: "ready" as const,
  epubMasterObjectKey: "dev/masters/book-42/master.epub",
  epubRenditionPrefix: "dev/renditions/book-42",
};

describe("canReadBook", () => {
  test("allows a published and fully prepared EPUB", () => {
    expect(canReadBook(readableBook)).toBe(true);
  });

  test("rejects unpublished and incomplete books", () => {
    expect(canReadBook({ ...readableBook, publishedAt: null })).toBe(false);
    expect(
      canReadBook({ ...readableBook, processingStatus: "processing" }),
    ).toBe(false);
    expect(canReadBook({ ...readableBook, epubRenditionPrefix: null })).toBe(
      false,
    );
  });
});
