import "server-only";

import { eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { books } from "@/db/schema";
import { canPublishBook } from "./publication-rules";

export type PublicationIntent = "publish" | "unpublish";

export async function setBookPublication(
  bookId: string,
  intent: PublicationIntent,
) {
  const database = getDatabase();
  const [book] = await database
    .select({
      id: books.id,
      slug: books.slug,
      processingStatus: books.processingStatus,
      epubRenditionPrefix: books.epubRenditionPrefix,
      publishedAt: books.publishedAt,
    })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  if (!book) {
    throw new Error("BOOK_NOT_FOUND");
  }

  if (intent === "publish" && !canPublishBook(book)) {
    throw new Error("BOOK_NOT_READY");
  }

  const publishedAt =
    intent === "publish" ? book.publishedAt ?? new Date() : null;

  const [updatedBook] = await database
    .update(books)
    .set({ publishedAt, updatedAt: new Date() })
    .where(eq(books.id, book.id))
    .returning({ id: books.id, slug: books.slug, publishedAt: books.publishedAt });

  return updatedBook;
}
