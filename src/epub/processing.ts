import "server-only";

import { eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { books } from "@/db/schema";
import { assertFrenchEpub } from "@/catalog/epub-language";
import {
  createNestedStoragePath,
  createStorageResourcePrefix,
  downloadStorageObject,
  uploadStorageObject,
} from "@/storage/supabase";
import { extractEpubRendition, type EpubRenditionFile } from "./archive";

const UPLOAD_CONCURRENCY = 8;

async function uploadRenditionFiles(
  bookId: string,
  files: EpubRenditionFile[],
) {
  for (let index = 0; index < files.length; index += UPLOAD_CONCURRENCY) {
    const batch = files.slice(index, index + UPLOAD_CONCURRENCY);

    await Promise.all(
      batch.map((file) =>
        uploadStorageObject(
          createNestedStoragePath("renditions", bookId, file.path),
          file.contents,
          file.contentType,
        ),
      ),
    );
  }
}

function processingErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "EPUB_PROCESSING_FAILED";
  return message.slice(0, 1_000);
}

export async function processBookRendition(bookId: string) {
  const database = getDatabase();
  const [book] = await database
    .select({
      id: books.id,
      epubMasterObjectKey: books.epubMasterObjectKey,
    })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  if (!book?.epubMasterObjectKey) {
    throw new Error("BOOK_IMPORT_NOT_FOUND");
  }

  await database
    .update(books)
    .set({
      processingStatus: "processing",
      processingError: null,
      updatedAt: new Date(),
    })
    .where(eq(books.id, book.id));

  try {
    const epub = await downloadStorageObject(book.epubMasterObjectKey);
    const rendition = await extractEpubRendition(epub);
    assertFrenchEpub(rendition.files, rendition.packageDocumentPath);

    await uploadRenditionFiles(book.id, rendition.files);

    const renditionPrefix = createStorageResourcePrefix(
      "renditions",
      book.id,
    );

    await database
      .update(books)
      .set({
        epubRenditionPrefix: renditionPrefix,
        processingStatus: "ready",
        processingError: null,
        updatedAt: new Date(),
      })
      .where(eq(books.id, book.id));

    return {
      status: "ready" as const,
      fileCount: rendition.files.length,
      packageDocumentPath: rendition.packageDocumentPath,
      renditionPrefix,
    };
  } catch (error) {
    await database
      .update(books)
      .set({
        epubRenditionPrefix: null,
        processingStatus: "failed",
        processingError: processingErrorMessage(error),
        updatedAt: new Date(),
      })
      .where(eq(books.id, book.id));

    console.error(`Unable to process EPUB rendition for book ${book.id}`, error);
    return { status: "failed" as const };
  }
}
