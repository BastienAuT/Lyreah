import { describe, expect, test } from "bun:test";
import JSZip from "jszip";
import {
  contentTypeForEpubPath,
  extractEpubRendition,
  normalizeEpubEntryPath,
} from "./archive";

async function createEpub(
  configure?: (archive: JSZip) => void,
) {
  const archive = new JSZip();
  archive.file("mimetype", "application/epub+zip");
  archive.file(
    "META-INF/container.xml",
    '<?xml version="1.0"?><container><rootfiles><rootfile full-path="EPUB/package.opf"/></rootfiles></container>',
  );
  archive.file("EPUB/package.opf", "<package></package>");
  archive.file("EPUB/chapitre-1.xhtml", "<html><body>Bonjour</body></html>");
  configure?.(archive);
  return archive.generateAsync({ type: "uint8array" });
}

describe("extractEpubRendition", () => {
  test("extracts a valid EPUB and locates its package document", async () => {
    const rendition = await extractEpubRendition(await createEpub());

    expect(rendition.packageDocumentPath).toBe("EPUB/package.opf");
    expect(rendition.files.map((file) => file.path)).toContain(
      "EPUB/chapitre-1.xhtml",
    );
    expect(
      rendition.files.find((file) => file.path.endsWith(".xhtml"))?.contentType,
    ).toBe("application/xhtml+xml");
  });

  test("rejects an EPUB without its required container", async () => {
    const archive = new JSZip();
    archive.file("mimetype", "application/epub+zip");

    await expect(
      extractEpubRendition(await archive.generateAsync({ type: "uint8array" })),
    ).rejects.toThrow("EPUB_STRUCTURE_INVALID");
  });

  test("rejects archive paths that escape the rendition folder", async () => {
    const input = await createEpub((archive) => {
      archive.file("../outside.xhtml", "unsafe");
    });

    await expect(extractEpubRendition(input)).rejects.toThrow(
      "EPUB_UNSAFE_PATH",
    );
  });
});

describe("EPUB path helpers", () => {
  test("preserves safe nested paths and rejects ambiguous paths", () => {
    expect(normalizeEpubEntryPath("EPUB/images/cover image.jpg")).toBe(
      "EPUB/images/cover image.jpg",
    );
    expect(() => normalizeEpubEntryPath("EPUB/../secret.txt")).toThrow();
    expect(() => normalizeEpubEntryPath("EPUB\\secret.txt")).toThrow();
  });

  test("returns safe content types for reader assets", () => {
    expect(contentTypeForEpubPath("styles/book.css")).toBe(
      "text/css; charset=utf-8",
    );
    expect(contentTypeForEpubPath("fonts/book.woff2")).toBe("font/woff2");
    expect(contentTypeForEpubPath("unknown.bin")).toBe(
      "application/octet-stream",
    );
  });
});
