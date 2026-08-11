import { describe, expect, test } from "bun:test";
import {
  adminBookImportSchema,
  isCoverFile,
  isEpubFile,
  slugify,
} from "./import-schema";

const validImport = {
  title: "Alice au pays des merveilles",
  slug: "alice-au-pays-des-merveilles",
  authorName: "Lewis Carroll",
  synopsis: "Une jeune lectrice traverse un monde rempli de personnages étonnants.",
  language: "fr",
  publicationYear: 1865,
  categories: ["Aventure", "Fantastique"],
  rightsStatus: "public_domain" as const,
  rightsStatement: "Œuvre du domaine public issue de Project Gutenberg.",
  sourceUrl: "https://www.gutenberg.org/ebooks/11",
  epub: {
    name: "alice.epub",
    size: 250_000,
    type: "application/epub+zip",
  },
  cover: null,
};

describe("adminBookImportSchema", () => {
  test("accepts a complete public-domain import", () => {
    expect(adminBookImportSchema.safeParse(validImport).success).toBe(true);
  });

  test("rejects invalid slugs and oversized EPUB files", () => {
    expect(
      adminBookImportSchema.safeParse({
        ...validImport,
        slug: "Alice avec espaces",
        epub: { ...validImport.epub, size: 7 * 1024 * 1024 },
      }).success,
    ).toBe(false);
  });
});

describe("import file helpers", () => {
  test("normalizes accented titles", () => {
    expect(slugify("  L’Étrange Forêt ! ")).toBe("l-etrange-foret");
  });

  test("checks file extension and MIME type together", () => {
    expect(isEpubFile({ name: "book.epub", type: "application/epub+zip" })).toBe(
      true,
    );
    expect(isEpubFile({ name: "book.exe", type: "application/epub+zip" })).toBe(
      false,
    );
    expect(isCoverFile({ name: "cover.webp", type: "image/webp" })).toBe(true);
    expect(isCoverFile({ name: "cover.svg", type: "image/svg+xml" })).toBe(false);
  });
});
