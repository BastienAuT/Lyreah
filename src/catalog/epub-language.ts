import type { EpubRenditionFile } from "@/epub/archive";

const FRENCH_WORDS = ["alors", "avec", "avoir", "cette", "comme", "dans", "elle", "était", "mais", "nous", "pour", "plus", "quand", "sans", "tout", "une", "vous"];
const ENGLISH_WORDS = ["and", "but", "for", "from", "have", "into", "not", "that", "the", "their", "there", "this", "was", "were", "with", "you"];

function countWords(text: string, words: readonly string[]) {
  const normalized = text.toLocaleLowerCase("fr");
  return words.reduce(
    (total, word) => total + (normalized.match(new RegExp(`\\b${word}\\b`, "gu"))?.length ?? 0),
    0,
  );
}

export function assertFrenchEpub(files: readonly EpubRenditionFile[], packageDocumentPath: string) {
  const decoder = new TextDecoder();
  const packageFile = files.find((file) => file.path === packageDocumentPath);
  if (!packageFile) throw new Error("EPUB_PACKAGE_MISSING");
  const packageDocument = decoder.decode(packageFile.contents);
  const languages = [...packageDocument.matchAll(/<dc:language(?:\s[^>]*)?>([^<]+)<\/dc:language>/giu)]
    .map((match) => match[1].trim().toLocaleLowerCase("fr"));
  if (!languages.some((language) => /^(fr|fra|fre)(-|$)/u.test(language))) {
    throw new Error(`EPUB_LANGUAGE_NOT_FRENCH: ${languages.join(", ") || "absent"}`);
  }

  const sample = files
    .filter((file) => /\.(xhtml|html|htm)$/iu.test(file.path))
    .slice(0, 30)
    .map((file) => decoder.decode(file.contents))
    .join(" ")
    .replace(/<[^>]+>/gu, " ")
    .slice(0, 500_000);
  const frenchScore = countWords(sample, FRENCH_WORDS);
  const englishScore = countWords(sample, ENGLISH_WORDS);
  if (frenchScore < 20 || frenchScore <= englishScore * 1.5) {
    throw new Error(`EPUB_CONTENT_NOT_FRENCH: score fr=${frenchScore}, score en=${englishScore}`);
  }
}
