import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { getDatabase } from "../src/db";
import {
  books,
  booksToSoundscapes,
  soundscapes,
} from "../src/db/schema";
import { createNestedStoragePath } from "../src/storage/paths";

const SAMPLE_RATE = 22_050;
const DURATION_SECONDS = 24;
const SOUNDSCAPE_TITLE = "Clairière nocturne — démo";

function requireEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

const storage = createClient(
  requireEnvironmentVariable("SUPABASE_URL"),
  requireEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  },
).storage.from(requireEnvironmentVariable("SUPABASE_STORAGE_BUCKET"));

async function uploadStorageObject(
  path: string,
  contents: Uint8Array,
  contentType: string,
) {
  const { error } = await storage.upload(path, contents, {
    cacheControl: "3600",
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Impossible d’envoyer « ${path} » : ${error.message}`);
  }
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createNightForestWave() {
  const sampleCount = SAMPLE_RATE * DURATION_SECONDS;
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + sampleCount * bytesPerSample);
  const view = new DataView(buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * bytesPerSample, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * bytesPerSample, true);

  let seed = 0x6c797265;
  let breeze = 0;
  const chirps = [3.2, 7.8, 13.4, 18.7, 22.1];

  function random() {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 4_294_967_295;
  }

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const whiteNoise = random() * 2 - 1;
    breeze = (breeze + whiteNoise * 0.018) / 1.018;
    const windEnvelope = 0.52 + 0.2 * Math.sin(time * 0.31);
    let sample = breeze * 2.8 * windEnvelope;

    for (const start of chirps) {
      const chirpTime = time - start;

      if (chirpTime >= 0 && chirpTime < 0.22) {
        const envelope = Math.sin((Math.PI * chirpTime) / 0.22) ** 2;
        sample += Math.sin(2 * Math.PI * (2_100 + chirpTime * 900) * chirpTime) * envelope * 0.055;
      }
    }

    const normalized = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + index * bytesPerSample, normalized * 32_767, true);
  }

  return new Uint8Array(buffer);
}

const bookSlug = process.argv[2] ?? "la-nuit-des-lucioles";
const database = getDatabase();
const [book] = await database
  .select({ id: books.id, title: books.title })
  .from(books)
  .where(eq(books.slug, bookSlug))
  .limit(1);

if (!book) {
  throw new Error(`Livre introuvable : ${bookSlug}`);
}

const [existingSoundscape] = await database
  .select({ id: soundscapes.id })
  .from(soundscapes)
  .where(eq(soundscapes.title, SOUNDSCAPE_TITLE))
  .limit(1);
const soundscapeId = existingSoundscape?.id ?? crypto.randomUUID();
const audioPath = createNestedStoragePath(
  "audio",
  soundscapeId,
  "night-forest.wav",
);
const manifestPath = createNestedStoragePath(
  "audio",
  soundscapeId,
  "manifest.json",
);
const manifest = {
  version: 1,
  layers: [
    {
      id: "night-forest",
      title: "Brise et lucioles",
      file: "night-forest.wav",
      volume: 0.72,
    },
  ],
};

await uploadStorageObject(audioPath, createNightForestWave(), "audio/wav");
await uploadStorageObject(
  manifestPath,
  new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
  "application/json",
);

if (existingSoundscape) {
  await database
    .update(soundscapes)
    .set({
      description: "Une brise légère ponctuée de chants nocturnes.",
      manifestObjectKey: manifestPath,
      updatedAt: new Date(),
    })
    .where(eq(soundscapes.id, soundscapeId));
} else {
  await database.insert(soundscapes).values({
    id: soundscapeId,
    title: SOUNDSCAPE_TITLE,
    description: "Une brise légère ponctuée de chants nocturnes.",
    manifestObjectKey: manifestPath,
    attribution: "Ambiance de développement générée par Lyreah",
    licenseName: "Création originale de démonstration",
  });
}

await database
  .update(booksToSoundscapes)
  .set({ isDefault: false })
  .where(eq(booksToSoundscapes.bookId, book.id));
await database
  .insert(booksToSoundscapes)
  .values({ bookId: book.id, soundscapeId, isDefault: true })
  .onConflictDoUpdate({
    target: [booksToSoundscapes.bookId, booksToSoundscapes.soundscapeId],
    set: { isDefault: true },
  });

console.log(`✓ Ambiance « ${SOUNDSCAPE_TITLE} » associée à « ${book.title} »`);
