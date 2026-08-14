import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";
import { parseSoundscapeManifest } from "@/audio/manifest";
import { getDatabase } from "@/db";
import { books, booksToSoundscapes, soundscapes } from "@/db/schema";
import {
  createNestedStoragePath,
  createSignedUpload,
  createStorageResourcePrefix,
  downloadStorageObject,
  storageObjectExists,
  uploadStorageObject,
} from "@/storage/supabase";
import type {
  CompleteSoundscapeInput,
  PrepareSoundscapeInput,
  UpdateSoundscapeInput,
} from "./soundscape-schema";

function audioExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase() || "mp3";
}

async function makeDefaultSoundscape(bookId: string, soundscapeId: string) {
  const database = getDatabase();
  await database
    .update(booksToSoundscapes)
    .set({ isDefault: false })
    .where(eq(booksToSoundscapes.bookId, bookId));
  await database
    .update(booksToSoundscapes)
    .set({ isDefault: true })
    .where(
      and(
        eq(booksToSoundscapes.bookId, bookId),
        eq(booksToSoundscapes.soundscapeId, soundscapeId),
      ),
    );
}

export async function prepareSoundscape(input: PrepareSoundscapeInput) {
  const database = getDatabase();
  const [book] = await database
    .select({ id: books.id })
    .from(books)
    .where(eq(books.id, input.bookId))
    .limit(1);

  if (!book) throw new Error("BOOK_NOT_FOUND");

  const soundscapeId = crypto.randomUUID();
  const manifestPath = createNestedStoragePath(
    "audio",
    soundscapeId,
    "manifest.json",
  );

  await database.insert(soundscapes).values({
    id: soundscapeId,
    title: input.title,
    description: input.description,
    manifestObjectKey: manifestPath,
    attribution: input.attribution,
    licenseName: input.licenseName,
    licenseSourceUrl: input.licenseSourceUrl,
    isActive: false,
  });

  try {
    await database.insert(booksToSoundscapes).values({
      bookId: input.bookId,
      soundscapeId,
      isDefault: false,
    });

    const layers = await Promise.all(
      input.files.map(async (file, index) => {
        const id = `layer-${index + 1}`;
        const relativeFile = `${id}.${audioExtension(file.name)}`;
        const path = createNestedStoragePath(
          "audio",
          soundscapeId,
          relativeFile,
        );
        const upload = await createSignedUpload(path);

        return {
          id,
          title: input.layers[index]!.title,
          volume: input.layers[index]!.volume,
          file: relativeFile,
          contentType: file.type,
          ...upload,
        };
      }),
    );

    return {
      bookId: input.bookId,
      isDefault: input.isDefault,
      soundscapeId,
      visualEffect: input.visualEffect,
      layers,
    };
  } catch (error) {
    await database.delete(soundscapes).where(eq(soundscapes.id, soundscapeId));
    throw error;
  }
}

export async function completeSoundscape(
  soundscapeId: string,
  input: CompleteSoundscapeInput,
) {
  const database = getDatabase();
  const [association] = await database
    .select({
      id: soundscapes.id,
      bookId: booksToSoundscapes.bookId,
      manifestObjectKey: soundscapes.manifestObjectKey,
    })
    .from(soundscapes)
    .innerJoin(
      booksToSoundscapes,
      eq(booksToSoundscapes.soundscapeId, soundscapes.id),
    )
    .where(eq(soundscapes.id, soundscapeId))
    .limit(1);

  if (!association || association.bookId !== input.bookId) {
    throw new Error("SOUNDSCAPE_NOT_FOUND");
  }

  const prefix = createStorageResourcePrefix("audio", soundscapeId);
  const layerPaths = input.layers.map((layer) =>
    createNestedStoragePath("audio", soundscapeId, layer.file),
  );

  if (
    !association.manifestObjectKey.startsWith(`${prefix}/`) ||
    layerPaths.some((path) => !path.startsWith(`${prefix}/`))
  ) {
    throw new Error("INVALID_STORAGE_PATH");
  }

  const filesExist = await Promise.all(layerPaths.map(storageObjectExists));
  if (filesExist.some((exists) => !exists)) throw new Error("UPLOAD_INCOMPLETE");

  const manifest = {
    version: 1 as const,
    visualEffect: input.visualEffect,
    layers: input.layers,
  };
  parseSoundscapeManifest(JSON.stringify(manifest));
  await uploadStorageObject(
    association.manifestObjectKey,
    new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
    "application/json",
  );
  await database
    .update(soundscapes)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(soundscapes.id, soundscapeId));

  if (input.isDefault) await makeDefaultSoundscape(input.bookId, soundscapeId);

  return { id: soundscapeId };
}

export async function updateSoundscape(
  soundscapeId: string,
  input: UpdateSoundscapeInput,
) {
  const database = getDatabase();
  const [soundscape] = await database
    .select({
      id: soundscapes.id,
      bookId: booksToSoundscapes.bookId,
      manifestObjectKey: soundscapes.manifestObjectKey,
    })
    .from(soundscapes)
    .innerJoin(
      booksToSoundscapes,
      eq(booksToSoundscapes.soundscapeId, soundscapes.id),
    )
    .where(eq(soundscapes.id, soundscapeId))
    .limit(1);

  if (!soundscape || soundscape.bookId !== input.bookId) {
    throw new Error("SOUNDSCAPE_NOT_FOUND");
  }

  const manifestBuffer = await downloadStorageObject(soundscape.manifestObjectKey);
  const manifest = parseSoundscapeManifest(
    new TextDecoder().decode(manifestBuffer),
  );
  const updatedManifest = { ...manifest, visualEffect: input.visualEffect };
  await uploadStorageObject(
    soundscape.manifestObjectKey,
    new TextEncoder().encode(JSON.stringify(updatedManifest, null, 2)),
    "application/json",
  );

  await database
    .update(soundscapes)
    .set({
      attribution: input.attribution,
      description: input.description,
      isActive: input.isDefault ? true : input.isActive,
      licenseName: input.licenseName,
      licenseSourceUrl: input.licenseSourceUrl,
      title: input.title,
      updatedAt: new Date(),
    })
    .where(eq(soundscapes.id, soundscapeId));

  if (input.isDefault) {
    await makeDefaultSoundscape(input.bookId, soundscapeId);
  } else {
    await database
      .update(booksToSoundscapes)
      .set({ isDefault: false })
      .where(
        and(
          eq(booksToSoundscapes.bookId, input.bookId),
          eq(booksToSoundscapes.soundscapeId, soundscapeId),
        ),
      );
  }

  return { id: soundscapeId };
}

export async function getAdminSoundscapeOverview() {
  const database = getDatabase();
  const [bookOptions, rows] = await Promise.all([
    database
      .select({ id: books.id, title: books.title })
      .from(books)
      .orderBy(asc(books.title)),
    database
      .select({
        id: soundscapes.id,
        title: soundscapes.title,
        description: soundscapes.description,
        attribution: soundscapes.attribution,
        licenseName: soundscapes.licenseName,
        licenseSourceUrl: soundscapes.licenseSourceUrl,
        isActive: soundscapes.isActive,
        manifestObjectKey: soundscapes.manifestObjectKey,
        bookId: books.id,
        bookTitle: books.title,
        isDefault: booksToSoundscapes.isDefault,
        updatedAt: soundscapes.updatedAt,
      })
      .from(booksToSoundscapes)
      .innerJoin(soundscapes, eq(soundscapes.id, booksToSoundscapes.soundscapeId))
      .innerJoin(books, eq(books.id, booksToSoundscapes.bookId))
      .orderBy(desc(soundscapes.updatedAt)),
  ]);

  const items = await Promise.all(
    rows.map(async (row) => {
      try {
        const manifest = parseSoundscapeManifest(
          new TextDecoder().decode(
            await downloadStorageObject(row.manifestObjectKey),
          ),
        );
        return {
          ...row,
          updatedAt: row.updatedAt.toISOString(),
          layerCount: manifest.layers.length,
          manifestReady: true,
          visualEffect: manifest.visualEffect,
        };
      } catch {
        return {
          ...row,
          updatedAt: row.updatedAt.toISOString(),
          layerCount: 0,
          manifestReady: false,
          visualEffect: "none" as const,
        };
      }
    }),
  );

  return { books: bookOptions, soundscapes: items };
}
