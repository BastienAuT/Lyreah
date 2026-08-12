import { describe, expect, test } from "bun:test";
import {
  createNestedStoragePath,
  createStoragePath,
  createStorageResourcePrefix,
} from "./paths";

describe("createStoragePath", () => {
  test("separates environments and folders", () => {
    expect(createStoragePath("masters", "book-42", "book.epub", "dev")).toBe(
      "dev/masters/book-42/book.epub",
    );
    expect(createStoragePath("audio", "track-1", "rain.mp3", "prod")).toBe(
      "prod/audio/track-1/rain.mp3",
    );
  });

  test("sanitizes user-controlled segments", () => {
    expect(
      createStoragePath("covers", "Jane Doe/../", "cover final.webp", "/dev/preview/"),
    ).toBe("dev/preview/covers/Jane-Doe-..-/cover-final.webp");
  });

  test("rejects empty required segments", () => {
    expect(() => createStoragePath("covers", "", "cover.webp", "dev")).toThrow();
  });

  test("keeps safe nested rendition paths", () => {
    expect(createStorageResourcePrefix("renditions", "book-42", "dev")).toBe(
      "dev/renditions/book-42",
    );
    expect(
      createNestedStoragePath(
        "renditions",
        "book-42",
        "EPUB/images/cover image.jpg",
        "dev",
      ),
    ).toBe("dev/renditions/book-42/EPUB/images/cover image.jpg");
  });

  test("rejects nested storage traversal", () => {
    expect(() =>
      createNestedStoragePath(
        "renditions",
        "book-42",
        "EPUB/../../secret.txt",
        "dev",
      ),
    ).toThrow();
  });
});
