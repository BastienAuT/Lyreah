import "server-only";

import { and, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { readingProgress } from "@/db/schema";
import type { ReadingProgressInput } from "./progress-input";

export async function getReadingProgress(userId: string, bookId: string) {
  const [progress] = await getDatabase()
    .select({
      cfi: readingProgress.cfi,
      percentageBasisPoints: readingProgress.percentageBasisPoints,
      updatedAt: readingProgress.updatedAt,
    })
    .from(readingProgress)
    .where(
      and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.bookId, bookId),
      ),
    )
    .limit(1);

  return progress ?? null;
}

export async function saveReadingProgress(
  userId: string,
  bookId: string,
  input: ReadingProgressInput,
) {
  const [progress] = await getDatabase()
    .insert(readingProgress)
    .values({ userId, bookId, ...input })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.bookId],
      set: { ...input, updatedAt: new Date() },
    })
    .returning({
      cfi: readingProgress.cfi,
      percentageBasisPoints: readingProgress.percentageBasisPoints,
      updatedAt: readingProgress.updatedAt,
    });

  return progress;
}
