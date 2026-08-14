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
type DemoMood = "night" | "rain" | "dawn";

const DEMO_SOUNDSCAPES: Array<{
  description: string;
  file: string;
  isDefault: boolean;
  layerTitle: string;
  mood: DemoMood;
  title: string;
}> = [
  {
    title: "Clairière nocturne — démo",
    description: "Une brise légère ponctuée de chants nocturnes.",
    file: "night-forest.wav",
    layerTitle: "Brise et lucioles",
    mood: "night",
    isDefault: true,
  },
  {
    title: "Pluie dans les fougères — démo",
    description: "Une pluie régulière et douce sous un feuillage dense.",
    file: "soft-rain.wav",
    layerTitle: "Pluie et feuillage",
    mood: "rain",
    isDefault: false,
  },
  {
    title: "Aube brumeuse — démo",
    description: "Un souffle calme accompagné des premiers oiseaux.",
    file: "misty-dawn.wav",
    layerTitle: "Vent matinal et oiseaux",
    mood: "dawn",
    isDefault: false,
  },
];

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

function createAmbientWave(mood: DemoMood) {
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

  let seed = mood === "rain" ? 0x7261696e : mood === "dawn" ? 0x6461776e : 0x6c797265;
  let breeze = 0;
  const events =
    mood === "rain"
      ? [1.3, 4.8, 8.1, 11.7, 15.2, 19.4, 22.3]
      : mood === "dawn"
        ? [2.4, 5.1, 9.8, 14.6, 17.2, 21.3]
        : [3.2, 7.8, 13.4, 18.7, 22.1];

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
    let sample =
      mood === "rain"
        ? whiteNoise * 0.018 + breeze * 1.9
        : mood === "dawn"
          ? breeze * 1.7 * windEnvelope + Math.sin(2 * Math.PI * 110 * time) * 0.008
          : breeze * 2.8 * windEnvelope;

    for (const start of events) {
      const eventTime = time - start;

      if (eventTime >= 0 && eventTime < 0.22) {
        const envelope = Math.sin((Math.PI * eventTime) / 0.22) ** 2;
        const frequency = mood === "rain" ? 720 : mood === "dawn" ? 2_850 : 2_100;
        const strength = mood === "rain" ? 0.025 : mood === "dawn" ? 0.065 : 0.055;
        sample +=
          Math.sin(2 * Math.PI * (frequency + eventTime * 900) * eventTime) *
          envelope *
          strength;
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

await database
  .update(booksToSoundscapes)
  .set({ isDefault: false })
  .where(eq(booksToSoundscapes.bookId, book.id));

for (const demo of DEMO_SOUNDSCAPES) {
  const [existingSoundscape] = await database
    .select({ id: soundscapes.id })
    .from(soundscapes)
    .where(eq(soundscapes.title, demo.title))
    .limit(1);
  const soundscapeId = existingSoundscape?.id ?? crypto.randomUUID();
  const audioPath = createNestedStoragePath("audio", soundscapeId, demo.file);
  const manifestPath = createNestedStoragePath(
    "audio",
    soundscapeId,
    "manifest.json",
  );
  const manifest = {
    version: 1,
    visualEffect:
      demo.mood === "night"
        ? "fireflies"
        : demo.mood === "rain"
          ? "rain"
          : "mist",
    layers: [
      {
        id: demo.mood,
        title: demo.layerTitle,
        file: demo.file,
        volume: 0.72,
      },
    ],
  };

  await uploadStorageObject(audioPath, createAmbientWave(demo.mood), "audio/wav");
  await uploadStorageObject(
    manifestPath,
    new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
    "application/json",
  );

  if (existingSoundscape) {
    await database
      .update(soundscapes)
      .set({
        description: demo.description,
        manifestObjectKey: manifestPath,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(soundscapes.id, soundscapeId));
  } else {
    await database.insert(soundscapes).values({
      id: soundscapeId,
      title: demo.title,
      description: demo.description,
      manifestObjectKey: manifestPath,
      attribution: "Ambiance de développement générée par Lyreah",
      licenseName: "Création originale de démonstration",
    });
  }

  await database
    .insert(booksToSoundscapes)
    .values({ bookId: book.id, soundscapeId, isDefault: demo.isDefault })
    .onConflictDoUpdate({
      target: [booksToSoundscapes.bookId, booksToSoundscapes.soundscapeId],
      set: { isDefault: demo.isDefault },
    });

  console.log(`✓ Ambiance « ${demo.title} » associée à « ${book.title} »`);
}
