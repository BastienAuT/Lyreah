import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { getDatabase } from "@/db";
import { booksToSoundscapes, soundscapes } from "@/db/schema";

export async function getDefaultSoundscapeForBook(bookId: string) {
  const [soundscape] = await getDatabase()
    .select({
      id: soundscapes.id,
      title: soundscapes.title,
      description: soundscapes.description,
      manifestObjectKey: soundscapes.manifestObjectKey,
      attribution: soundscapes.attribution,
      licenseName: soundscapes.licenseName,
      licenseSourceUrl: soundscapes.licenseSourceUrl,
    })
    .from(booksToSoundscapes)
    .innerJoin(soundscapes, eq(soundscapes.id, booksToSoundscapes.soundscapeId))
    .where(
      and(
        eq(booksToSoundscapes.bookId, bookId),
        eq(soundscapes.isActive, true),
      ),
    )
    .orderBy(desc(booksToSoundscapes.isDefault), asc(soundscapes.title))
    .limit(1);

  return soundscape ?? null;
}
