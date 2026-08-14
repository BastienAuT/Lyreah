import "server-only";

import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { getDatabase } from "@/db";
import {
  authors,
  books,
  booksToAuthors,
  libraryEntries,
  readingProgress,
} from "@/db/schema";

export async function getLibraryEntry(userId: string, bookId: string) {
  const [entry] = await getDatabase()
    .select({ id: libraryEntries.id, status: libraryEntries.status })
    .from(libraryEntries)
    .where(
      and(
        eq(libraryEntries.userId, userId),
        eq(libraryEntries.bookId, bookId),
      ),
    )
    .limit(1);

  return entry ?? null;
}

export async function getLibraryBooks(userId: string) {
  const rows = await getDatabase()
    .select({
      entryId: libraryEntries.id,
      status: libraryEntries.status,
      addedAt: libraryEntries.addedAt,
      percentageBasisPoints: readingProgress.percentageBasisPoints,
      book: books,
    })
    .from(libraryEntries)
    .innerJoin(books, eq(libraryEntries.bookId, books.id))
    .leftJoin(
      readingProgress,
      and(
        eq(readingProgress.bookId, books.id),
        eq(readingProgress.userId, libraryEntries.userId),
      ),
    )
    .where(
      and(eq(libraryEntries.userId, userId), isNotNull(books.publishedAt)),
    )
    .orderBy(desc(libraryEntries.updatedAt));

  if (rows.length === 0) {
    return [];
  }

  const bookIds = rows.map(({ book }) => book.id);
  const authorRows = await getDatabase()
    .select({ bookId: booksToAuthors.bookId, authorName: authors.name })
    .from(booksToAuthors)
    .innerJoin(authors, eq(booksToAuthors.authorId, authors.id))
    .where(inArray(booksToAuthors.bookId, bookIds));

  return rows.map((row) => ({
    ...row,
    authors: authorRows
      .filter((author) => author.bookId === row.book.id)
      .map((author) => author.authorName),
  }));
}
