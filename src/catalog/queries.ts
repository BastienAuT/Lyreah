import "server-only";

import { cache } from "react";
import { and, desc, eq, ilike, inArray, isNotNull, or } from "drizzle-orm";
import { getDatabase } from "@/db";
import {
  authors,
  books,
  booksToAuthors,
  booksToCategories,
  categories,
  publishers,
} from "@/db/schema";

export type CatalogBook = Awaited<ReturnType<typeof getCatalogBooks>>[number];

type CatalogFilters = {
  category?: string;
  query?: string;
  featured?: boolean;
  limit?: number;
};

async function hydrateBooks(
  rows: Array<{
    book: typeof books.$inferSelect;
    publisher: typeof publishers.$inferSelect | null;
  }>,
) {
  if (rows.length === 0) {
    return [];
  }

  const bookIds = rows.map(({ book }) => book.id);
  const database = getDatabase();
  const [authorRows, categoryRows] = await Promise.all([
    database
      .select({ bookId: booksToAuthors.bookId, author: authors })
      .from(booksToAuthors)
      .innerJoin(authors, eq(booksToAuthors.authorId, authors.id))
      .where(inArray(booksToAuthors.bookId, bookIds)),
    database
      .select({ bookId: booksToCategories.bookId, category: categories })
      .from(booksToCategories)
      .innerJoin(categories, eq(booksToCategories.categoryId, categories.id))
      .where(inArray(booksToCategories.bookId, bookIds)),
  ]);

  return rows.map(({ book, publisher }) => ({
    ...book,
    publisher,
    authors: authorRows
      .filter((row) => row.bookId === book.id)
      .map((row) => row.author),
    categories: categoryRows
      .filter((row) => row.bookId === book.id)
      .map((row) => row.category),
  }));
}

export async function getCatalogBooks(filters: CatalogFilters = {}) {
  const database = getDatabase();
  const conditions = [isNotNull(books.publishedAt)];
  const normalizedQuery = filters.query?.trim();

  if (normalizedQuery) {
    conditions.push(
      or(
        ilike(books.title, `%${normalizedQuery}%`),
        ilike(books.synopsis, `%${normalizedQuery}%`),
      )!,
    );
  }

  if (filters.featured !== undefined) {
    conditions.push(eq(books.isFeatured, filters.featured));
  }

  if (filters.category) {
    const matchingBookIds = database
      .select({ bookId: booksToCategories.bookId })
      .from(booksToCategories)
      .innerJoin(categories, eq(booksToCategories.categoryId, categories.id))
      .where(eq(categories.slug, filters.category));

    conditions.push(inArray(books.id, matchingBookIds));
  }

  const query = database
    .select({ book: books, publisher: publishers })
    .from(books)
    .leftJoin(publishers, eq(books.publisherId, publishers.id))
    .where(and(...conditions))
    .orderBy(desc(books.isFeatured), desc(books.publishedAt));

  const rows = filters.limit ? await query.limit(filters.limit) : await query;

  return hydrateBooks(rows);
}

export const getCatalogBookBySlug = cache(async (slug: string) => {
  const rows = await getDatabase()
    .select({ book: books, publisher: publishers })
    .from(books)
    .leftJoin(publishers, eq(books.publisherId, publishers.id))
    .where(and(eq(books.slug, slug), isNotNull(books.publishedAt)))
    .limit(1);

  const [book] = await hydrateBooks(rows);
  return book ?? null;
});

export const getCatalogCategories = cache(async () =>
  getDatabase().select().from(categories).orderBy(categories.name),
);
