import "server-only";

import { desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import {
  authors,
  books,
  booksToAuthors,
  booksToCategories,
  categories,
} from "@/db/schema";
import {
  createSignedUpload,
  createStoragePath,
  removeStorageObjects,
  storageObjectExists,
} from "@/storage/supabase";
import { type AdminBookImport, slugify } from "./import-schema";

function coverExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "jpg";
}

export async function createBookImport(
  input: AdminBookImport,
  profileId: string,
) {
  const database = getDatabase();
  const [existingBook] = await database
    .select({
      id: books.id,
      language: books.language,
      processingStatus: books.processingStatus,
      createdByProfileId: books.createdByProfileId,
      epubMasterObjectKey: books.epubMasterObjectKey,
      coverObjectKey: books.coverObjectKey,
    })
    .from(books)
    .where(eq(books.slug, input.slug))
    .limit(1);

  if (existingBook) {
    const canReplaceAbandonedImport =
      existingBook.processingStatus === "pending" &&
      existingBook.createdByProfileId === profileId;

    if (!canReplaceAbandonedImport) {
      throw new Error("BOOK_SLUG_EXISTS");
    }

    await removeStorageObjects([
      existingBook.epubMasterObjectKey,
      existingBook.coverObjectKey,
    ]);
    await database.delete(books).where(eq(books.id, existingBook.id));
  }

  const bookId = crypto.randomUUID();
  const epubPath = createStoragePath("masters", bookId, "master.epub");
  const coverPath = input.cover
    ? createStoragePath(
        "covers",
        bookId,
        `cover.${coverExtension(input.cover.name)}`,
      )
    : null;

  try {
    const authorSlug = slugify(input.authorName);
    const [author] = await database
      .insert(authors)
      .values({ name: input.authorName, slug: authorSlug })
      .onConflictDoUpdate({
        target: authors.slug,
        set: { name: input.authorName, updatedAt: new Date() },
      })
      .returning();

    await database.insert(books).values({
      id: bookId,
      slug: input.slug,
      title: input.title,
      synopsis: input.synopsis,
      language: input.language,
      publicationYear: input.publicationYear,
      rightsStatus: input.rightsStatus,
      rightsStatement: input.rightsStatement,
      sourceUrl: input.sourceUrl,
      coverObjectKey: coverPath,
      epubMasterObjectKey: epubPath,
      originalEpubFileName: input.epub.name,
      epubFileSize: input.epub.size,
      createdByProfileId: profileId,
    });

    await database.insert(booksToAuthors).values({
      bookId,
      authorId: author.id,
    });

    for (const categoryName of [...new Set(input.categories)]) {
      const categorySlug = slugify(categoryName);
      const [category] = await database
        .insert(categories)
        .values({ name: categoryName, slug: categorySlug })
        .onConflictDoUpdate({
          target: categories.slug,
          set: { name: categoryName },
        })
        .returning();

      await database.insert(booksToCategories).values({
        bookId,
        categoryId: category.id,
      });
    }

    const [epubUpload, coverUpload] = await Promise.all([
      createSignedUpload(epubPath),
      coverPath ? createSignedUpload(coverPath) : Promise.resolve(null),
    ]);

    return { bookId, uploads: { epub: epubUpload, cover: coverUpload } };
  } catch (error) {
    await database.delete(books).where(eq(books.id, bookId));
    throw error;
  }
}

export async function completeBookImport(bookId: string) {
  const database = getDatabase();
  const [book] = await database
    .select()
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  if (!book?.epubMasterObjectKey) {
    throw new Error("BOOK_IMPORT_NOT_FOUND");
  }

  const [epubExists, coverExists] = await Promise.all([
    storageObjectExists(book.epubMasterObjectKey),
    book.coverObjectKey
      ? storageObjectExists(book.coverObjectKey)
      : Promise.resolve(true),
  ]);

  if (!epubExists || !coverExists) {
    throw new Error("UPLOAD_INCOMPLETE");
  }

  const [updatedBook] = await database
    .update(books)
    .set({
      processingStatus: "processing",
      processingError: null,
      updatedAt: new Date(),
    })
    .where(eq(books.id, bookId))
    .returning();

  return updatedBook;
}

export async function getRecentBookImports() {
  return getDatabase()
    .select({
      id: books.id,
      title: books.title,
      slug: books.slug,
      language: books.language,
      processingStatus: books.processingStatus,
      processingError: books.processingError,
      epubRenditionPrefix: books.epubRenditionPrefix,
      publishedAt: books.publishedAt,
      originalEpubFileName: books.originalEpubFileName,
      createdAt: books.createdAt,
    })
    .from(books)
    .orderBy(desc(books.createdAt))
    .limit(20);
}
