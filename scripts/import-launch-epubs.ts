import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { getDatabase } from "../src/db";
import { books } from "../src/db/schema";
import { extractEpubRendition } from "../src/epub/archive";
import { assertFrenchEpub } from "../src/catalog/epub-language";
import {
  FRENCH_PUBLIC_DOMAIN_RIGHTS_STATEMENT,
  gutenbergCompactEpubUrl,
  gutenbergEpubUrl,
  launchCatalog,
  type LaunchCatalogBook,
  wikisourceEpubUrl,
} from "../src/catalog/launch-catalog";
import {
  createNestedStoragePath,
  createStoragePath,
  createStorageResourcePrefix,
} from "../src/storage/paths";

const MAX_EPUB_BYTES = 40 * 1024 * 1024;
const UPLOAD_CONCURRENCY = 8;
const argumentsList = process.argv.slice(2);
const onlyIndex = argumentsList.indexOf("--only");
const onlySlug = onlyIndex >= 0 ? argumentsList[onlyIndex + 1] : undefined;
const force = argumentsList.includes("--force");
const dryRun = argumentsList.includes("--dry-run");
const selectedBooks = onlySlug
  ? launchCatalog.filter((book) => book.slug === onlySlug)
  : launchCatalog;

if (onlySlug && selectedBooks.length === 0) {
  throw new Error(`Livre inconnu : ${onlySlug}`);
}

const database = getDatabase();
const storageUrl = process.env.SUPABASE_URL;
const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
if (!storageUrl || !storageKey || !storageBucket) {
  throw new Error("La configuration Supabase Storage est incomplète.");
}
const storage = createClient(storageUrl, storageKey, {
  auth: { autoRefreshToken: false, persistSession: false },
}).storage.from(storageBucket);

async function upload(
  path: string,
  contents: Uint8Array,
  contentType: string,
) {
  const { error } = await storage.upload(path, contents, {
    cacheControl: "3600",
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Upload impossible (${path}) : ${error.message}`);
}

async function downloadEpub(source: LaunchCatalogBook["source"]) {
  const urls = source.provider === "gutenberg"
    ? [gutenbergCompactEpubUrl(source.id), gutenbergEpubUrl(source.id)]
    : [wikisourceEpubUrl(source.page)];
  for (const url of urls) {
    console.log(`  essai : ${url}`);
    const response = await fetch(url, {
      headers: { "User-Agent": "Lyreah catalog importer (editorial QA)" },
    });
    if (!response.ok) continue;
    const contents = new Uint8Array(await response.arrayBuffer());
    if (contents.byteLength > 0 && contents.byteLength <= MAX_EPUB_BYTES) {
      return { contents, url };
    }
  }
  throw new Error(`Aucun EPUB exploitable pour ${JSON.stringify(source)}`);
}

for (const catalogBook of selectedBooks) {
  const [book] = await database
    .select()
    .from(books)
    .where(eq(books.slug, catalogBook.slug))
    .limit(1);

  if (!book) {
    throw new Error(`Lancez d'abord db:seed : ${catalogBook.slug} est absent.`);
  }

  const isComplete =
    book.processingStatus === "ready" &&
    Boolean(book.epubMasterObjectKey && book.epubRenditionPrefix) &&
    book.language === "fr" &&
    book.sourceUrl === catalogBook.sourceUrl;
  if (isComplete && !force) {
    console.log(`✓ ${catalogBook.slug} : EPUB déjà prêt`);
    continue;
  }

  if (dryRun) {
    console.log(`• ${catalogBook.slug} : EPUB manquant`);
    continue;
  }

  console.log(`↓ ${catalogBook.slug}`);
  const { contents: epub, url: downloadUrl } = await downloadEpub(catalogBook.source);

  const rendition = await extractEpubRendition(epub);
  assertFrenchEpub(rendition.files, rendition.packageDocumentPath);
  const masterPath = createStoragePath("masters", book.id, "master.epub");
  await upload(masterPath, epub, "application/epub+zip");
  await database
    .update(books)
    .set({
      epubFileSize: epub.byteLength,
      epubMasterObjectKey: masterPath,
      language: catalogBook.language,
      originalEpubFileName: `${catalogBook.slug}.epub`,
      processingError: null,
      processingStatus: "pending",
      rightsStatement: FRENCH_PUBLIC_DOMAIN_RIGHTS_STATEMENT,
      sourceUrl: catalogBook.sourceUrl,
      updatedAt: new Date(),
    })
    .where(eq(books.id, book.id));

  for (let index = 0; index < rendition.files.length; index += UPLOAD_CONCURRENCY) {
    const batch = rendition.files.slice(index, index + UPLOAD_CONCURRENCY);
    await Promise.all(
      batch.map((file) =>
        upload(
          createNestedStoragePath("renditions", book.id, file.path),
          file.contents,
          file.contentType,
        ),
      ),
    );
  }

  await database
    .update(books)
    .set({
      epubRenditionPrefix: createStorageResourcePrefix("renditions", book.id),
      processingError: null,
      processingStatus: "ready",
      updatedAt: new Date(),
    })
    .where(eq(books.id, book.id));

  console.log(
    `✓ ${catalogBook.slug} : ${epub.byteLength} octets, ${rendition.files.length} fichiers validés (${downloadUrl})`,
  );
}
