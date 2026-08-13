import "server-only";

import { and, eq, isNotNull } from "drizzle-orm";
import { getDatabase } from "@/db";
import { books } from "@/db/schema";
import { canReadBook } from "./access-rules";

export async function getReadableBookById(bookId: string) {
  const [book] = await getDatabase()
    .select({
      id: books.id,
      slug: books.slug,
      processingStatus: books.processingStatus,
      publishedAt: books.publishedAt,
      epubMasterObjectKey: books.epubMasterObjectKey,
      epubRenditionPrefix: books.epubRenditionPrefix,
    })
    .from(books)
    .where(and(eq(books.id, bookId), isNotNull(books.publishedAt)))
    .limit(1);

  return book && canReadBook(book) ? book : null;
}
