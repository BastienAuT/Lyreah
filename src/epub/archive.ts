import JSZip from "jszip";

export const MAX_RENDITION_FILES = 2_000;
export const MAX_RENDITION_BYTES = 64 * 1024 * 1024;
export const MAX_RENDITION_FILE_BYTES = 16 * 1024 * 1024;

export type EpubRenditionFile = {
  path: string;
  contentType: string;
  contents: Uint8Array;
};

type SizedZipObject = JSZip.JSZipObject & {
  _data?: { uncompressedSize?: number };
};

function decodeXmlAttribute(value: string) {
  return value.replace(
    /&(?:amp|apos|gt|lt|quot|#x[0-9a-f]+|#\d+);/gi,
    (entity) => {
      const namedEntities: Record<string, string> = {
        "&amp;": "&",
        "&apos;": "'",
        "&gt;": ">",
        "&lt;": "<",
        "&quot;": '"',
      };
      const named = namedEntities[entity.toLowerCase()];

      if (named) {
        return named;
      }

      const hexadecimal = entity.toLowerCase().startsWith("&#x");
      const codePoint = Number.parseInt(
        entity.slice(hexadecimal ? 3 : 2, -1),
        hexadecimal ? 16 : 10,
      );

      return Number.isSafeInteger(codePoint)
        ? String.fromCodePoint(codePoint)
        : entity;
    },
  );
}

export function normalizeEpubEntryPath(value: string) {
  if (
    !value ||
    value.startsWith("/") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    throw new Error("EPUB_UNSAFE_PATH");
  }

  const segments = value.split("/");

  if (
    segments.some(
      (segment) => !segment || segment === "." || segment === "..",
    )
  ) {
    throw new Error("EPUB_UNSAFE_PATH");
  }

  return segments.join("/");
}

export function contentTypeForEpubPath(path: string) {
  const extension = path.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    avif: "image/avif",
    css: "text/css; charset=utf-8",
    gif: "image/gif",
    html: "text/html; charset=utf-8",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    json: "application/json; charset=utf-8",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    ncx: "application/x-dtbncx+xml",
    ogg: "audio/ogg",
    opf: "application/oebps-package+xml",
    otf: "font/otf",
    png: "image/png",
    svg: "image/svg+xml",
    ttf: "font/ttf",
    webp: "image/webp",
    woff: "font/woff",
    woff2: "font/woff2",
    xhtml: "application/xhtml+xml",
    xml: "application/xml",
  };

  return contentTypes[extension ?? ""] ?? "application/octet-stream";
}

function findPackageDocumentPath(containerXml: string) {
  const rootfile = containerXml.match(
    /<rootfile\b[^>]*\bfull-path\s*=\s*(?:"([^"]+)"|'([^']+)')/i,
  );
  const value = rootfile?.[1] ?? rootfile?.[2];

  if (!value) {
    throw new Error("EPUB_PACKAGE_DOCUMENT_MISSING");
  }

  return normalizeEpubEntryPath(decodeXmlAttribute(value));
}

export async function extractEpubRendition(input: ArrayBuffer | Uint8Array) {
  const archive = await JSZip.loadAsync(input, { checkCRC32: true });
  const entries = Object.values(archive.files).filter((entry) => !entry.dir);

  if (entries.length === 0 || entries.length > MAX_RENDITION_FILES) {
    throw new Error("EPUB_FILE_COUNT_INVALID");
  }

  let declaredSize = 0;

  for (const entry of entries) {
    const originalPath = entry.unsafeOriginalName ?? entry.name;
    const safePath = normalizeEpubEntryPath(originalPath);

    if (safePath !== entry.name) {
      throw new Error("EPUB_UNSAFE_PATH");
    }

    const uncompressedSize = (entry as SizedZipObject)._data?.uncompressedSize;

    if (typeof uncompressedSize === "number") {
      if (uncompressedSize > MAX_RENDITION_FILE_BYTES) {
        throw new Error("EPUB_FILE_TOO_LARGE");
      }

      declaredSize += uncompressedSize;
      if (declaredSize > MAX_RENDITION_BYTES) {
        throw new Error("EPUB_RENDITION_TOO_LARGE");
      }
    }
  }

  const mimetype = archive.file("mimetype");
  const container = archive.file("META-INF/container.xml");

  if (!mimetype || !container) {
    throw new Error("EPUB_STRUCTURE_INVALID");
  }

  if ((await mimetype.async("string")) !== "application/epub+zip") {
    throw new Error("EPUB_MIMETYPE_INVALID");
  }

  const packageDocumentPath = findPackageDocumentPath(
    await container.async("string"),
  );

  if (!archive.file(packageDocumentPath)) {
    throw new Error("EPUB_PACKAGE_DOCUMENT_MISSING");
  }

  const files: EpubRenditionFile[] = [];
  let extractedSize = 0;

  for (const entry of entries) {
    const contents = await entry.async("uint8array");

    if (contents.byteLength > MAX_RENDITION_FILE_BYTES) {
      throw new Error("EPUB_FILE_TOO_LARGE");
    }

    extractedSize += contents.byteLength;
    if (extractedSize > MAX_RENDITION_BYTES) {
      throw new Error("EPUB_RENDITION_TOO_LARGE");
    }

    files.push({
      path: entry.name,
      contentType: contentTypeForEpubPath(entry.name),
      contents,
    });
  }

  return { files, packageDocumentPath };
}
