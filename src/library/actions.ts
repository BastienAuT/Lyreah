"use server";

import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ensureCurrentProfile } from "@/auth/session";
import { getDatabase } from "@/db";
import { books, libraryEntries } from "@/db/schema";
import { parseLibraryBookId } from "./input";

function revalidateLibraryPages(slug?: string) {
  revalidatePath("/bibliotheque");
  if (slug) {
    revalidatePath(`/livres/${slug}`);
  }
}

export async function addBookToLibrary(formData: FormData) {
  const { profile } = await ensureCurrentProfile();
  const bookId = parseLibraryBookId(formData.get("bookId"));
  const [book] = await getDatabase()
    .select({ id: books.id, slug: books.slug })
    .from(books)
    .where(and(eq(books.id, bookId), isNotNull(books.publishedAt)))
    .limit(1);

  if (!book) {
    throw new Error("BOOK_NOT_FOUND");
  }

  await getDatabase()
    .insert(libraryEntries)
    .values({ userId: profile.id, bookId: book.id })
    .onConflictDoNothing({
      target: [libraryEntries.userId, libraryEntries.bookId],
    });

  revalidateLibraryPages(book.slug);
}

export async function removeBookFromLibrary(formData: FormData) {
  const { profile } = await ensureCurrentProfile();
  const bookId = parseLibraryBookId(formData.get("bookId"));
  const [book] = await getDatabase()
    .select({ slug: books.slug })
    .from(books)
    .where(eq(books.id, bookId))
    .limit(1);

  await getDatabase()
    .delete(libraryEntries)
    .where(
      and(
        eq(libraryEntries.userId, profile.id),
        eq(libraryEntries.bookId, bookId),
      ),
    );

  revalidateLibraryPages(book?.slug);
}
