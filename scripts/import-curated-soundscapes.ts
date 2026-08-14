import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDatabase } from "../src/db";
import { books, booksToSoundscapes, soundscapes } from "../src/db/schema";
import { createNestedStoragePath } from "../src/storage/paths";

type VisualEffect = "breeze" | "fireflies" | "mist" | "none" | "rain";

type CuratedSoundscape = {
  attribution: string;
  description: string;
  downloadUrl: string;
  isDefault: boolean;
  legacyTitles?: string[];
  licenseName: string;
  sourcePageUrl: string;
  title: string;
  visualEffect: VisualEffect;
  wikimediaFileName: string;
  layer: {
    id: string;
    title: string;
    volume: number;
  };
};

const MAX_AUDIO_BYTES = 40 * 1024 * 1024;
const MIN_AUDIO_BYTES = 80 * 1024;
const DOWNLOAD_PAUSE_MS = 1_500;

const CURATED_SOUNDSCAPES: CuratedSoundscape[] = [
  {
    title: "Clairière nocturne",
    legacyTitles: ["Clairière nocturne — démo"],
    description: "Une prairie nocturne vivante, peuplée d’insectes et d’échos lointains.",
    wikimediaFileName: "Grasshoppers.ogg",
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/2/28/Grasshoppers.ogg",
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Grasshoppers.ogg",
    attribution: "Enregistrement par Mysid, via Wikimedia Commons",
    licenseName: "Domaine public",
    visualEffect: "fireflies",
    layer: { id: "night-insects", title: "Insectes nocturnes", volume: 0.56 },
    isDefault: true,
  },
  {
    title: "Pluie contre la vitre",
    legacyTitles: ["Pluie dans les fougères — démo"],
    description: "Une pluie soutenue contre une fenêtre, portée par quelques rafales de vent.",
    wikimediaFileName: "Rain against the window.ogg",
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/41/Rain_against_the_window.ogg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Rain_against_the_window.ogg",
    attribution: "Enregistrement par cori, via Wikimedia Commons / PDSounds",
    licenseName: "Domaine public",
    visualEffect: "rain",
    layer: { id: "window-rain", title: "Pluie et vent", volume: 0.62 },
    isDefault: false,
  },
  {
    title: "Aube aux oiseaux",
    legacyTitles: ["Aube brumeuse — démo"],
    description: "Un réveil naturel d’oiseaux, ample et lumineux, enregistré au petit matin.",
    wikimediaFileName: "Réveil des oiseaux.ogg",
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/3/33/R%C3%A9veil_des_oiseaux.ogg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:R%C3%A9veil_des_oiseaux.ogg",
    attribution: "Enregistrement par Joseph Sardin, via BigSoundBank / Wikimedia Commons",
    licenseName: "CC0 1.0",
    visualEffect: "mist",
    layer: { id: "dawn-birds", title: "Oiseaux du matin", volume: 0.48 },
    isDefault: false,
  },
  {
    title: "Feu de cheminée",
    description: "Le crépitement proche et chaleureux d’un feu dans une cheminée ouverte.",
    wikimediaFileName: "Dry grass burning in open fireplace.ogg",
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/d/d8/Dry_grass_burning_in_open_fireplace.ogg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Dry_grass_burning_in_open_fireplace.ogg",
    attribution: "Enregistrement par ezwa, via Wikimedia Commons / PDSounds",
    licenseName: "Domaine public",
    visualEffect: "none",
    layer: { id: "fireplace", title: "Crépitement du feu", volume: 0.54 },
    isDefault: false,
  },
  {
    title: "Rive tranquille",
    description: "Des vagues moyennes, des remous et quelques sternes entendues au loin.",
    wikimediaFileName: "DenisChardonnet - Vagues et Sternes.ogg",
    downloadUrl:
      "https://upload.wikimedia.org/wikipedia/commons/5/5d/DenisChardonnet_-_Vagues_et_Sternes.ogg",
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:DenisChardonnet_-_Vagues_et_Sternes.ogg",
    attribution: "Enregistrement par Denis Chardonnet, via BigSoundBank / Wikimedia Commons",
    licenseName: "CC0 1.0",
    visualEffect: "breeze",
    layer: { id: "lake-waves", title: "Vagues sur la rive", volume: 0.5 },
    isDefault: false,
  },
];

const LEGACY_AUDIO_FILES = new Map([
  ["Clairière nocturne", "night-forest.wav"],
  ["Pluie contre la vitre", "soft-rain.wav"],
  ["Aube aux oiseaux", "misty-dawn.wav"],
]);

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

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function downloadWikimediaAudio(fileName: string, url: string) {
  const curl = process.platform === "win32" ? "curl.exe" : "curl";
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "lyreah-audio-"));
  const temporaryFile = join(temporaryDirectory, "source.ogg");
  let contents: Uint8Array;

  try {
    const subprocess = Bun.spawn(
      [
        curl,
        "--fail",
        "--location",
        "--silent",
        "--show-error",
        "--retry",
        "4",
        "--retry-all-errors",
        "--retry-delay",
        "2",
        "--connect-timeout",
        "15",
        "--max-time",
        "90",
        "--user-agent",
        "LyreahSoundscapeImporter/1.0 (local development utility)",
        "--output",
        temporaryFile,
        url,
      ],
      { stderr: "inherit", stdout: "inherit" },
    );
    const exitCode = await subprocess.exited;

    if (exitCode !== 0) {
      throw new Error(`Téléchargement impossible : ${fileName}`);
    }

    contents = new Uint8Array(await readFile(temporaryFile));
  } finally {
    await rm(temporaryDirectory, { force: true, recursive: true });
  }
  const hasOggSignature =
    contents[0] === 0x4f &&
    contents[1] === 0x67 &&
    contents[2] === 0x67 &&
    contents[3] === 0x53;

  if (!hasOggSignature) {
    throw new Error(`Le fichier reçu n’est pas un flux OGG valide : ${fileName}`);
  }

  if (contents.byteLength < MIN_AUDIO_BYTES || contents.byteLength > MAX_AUDIO_BYTES) {
    throw new Error(
      `Taille audio inattendue pour ${fileName} : ${(contents.byteLength / 1024 / 1024).toFixed(2)} Mo`,
    );
  }

  return contents;
}

async function uploadStorageObject(
  path: string,
  contents: Uint8Array,
  contentType: string,
) {
  const { error } = await storage.upload(path, contents, {
    cacheControl: "31536000",
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Impossible d’envoyer « ${path} » : ${error.message}`);
  }
}

async function removeLegacyAudio(soundscapeId: string, title: string) {
  const legacyFile = LEGACY_AUDIO_FILES.get(title);
  if (!legacyFile) return;

  const legacyPath = createNestedStoragePath("audio", soundscapeId, legacyFile);
  const { error } = await storage.remove([legacyPath]);

  if (error) {
    console.warn(`Ancien fichier conservé (${legacyPath}) : ${error.message}`);
  }
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

console.log(`Préparation de ${CURATED_SOUNDSCAPES.length} ambiances pour « ${book.title} »…`);

const downloadedAudio = new Map<string, Uint8Array>();
for (const soundscape of CURATED_SOUNDSCAPES) {
  console.log(`↓ ${soundscape.title}`);
  downloadedAudio.set(
    soundscape.title,
    await downloadWikimediaAudio(soundscape.wikimediaFileName, soundscape.downloadUrl),
  );
  await wait(DOWNLOAD_PAUSE_MS);
}

const existingSoundscapes = await database
  .select({ id: soundscapes.id, title: soundscapes.title })
  .from(soundscapes);

await database
  .update(booksToSoundscapes)
  .set({ isDefault: false })
  .where(eq(booksToSoundscapes.bookId, book.id));

for (const curated of CURATED_SOUNDSCAPES) {
  const acceptedTitles = new Set([curated.title, ...(curated.legacyTitles ?? [])]);
  const existingSoundscape = existingSoundscapes.find(({ title }) =>
    acceptedTitles.has(title),
  );
  const soundscapeId = existingSoundscape?.id ?? crypto.randomUUID();
  const audioFile = curated.wikimediaFileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .toLowerCase();
  const audioPath = createNestedStoragePath("audio", soundscapeId, audioFile);
  const manifestPath = createNestedStoragePath("audio", soundscapeId, "manifest.json");
  const audioContents = downloadedAudio.get(curated.title);

  if (!audioContents) {
    throw new Error(`Audio absent de la mémoire tampon : ${curated.title}`);
  }

  const manifest = {
    version: 1,
    visualEffect: curated.visualEffect,
    layers: [
      {
        id: curated.layer.id,
        title: curated.layer.title,
        file: audioFile,
        volume: curated.layer.volume,
      },
    ],
  } as const;

  console.log(`↑ ${curated.title}`);
  await uploadStorageObject(audioPath, audioContents, "audio/ogg");
  await uploadStorageObject(
    manifestPath,
    new TextEncoder().encode(JSON.stringify(manifest, null, 2)),
    "application/json",
  );

  const values = {
    title: curated.title,
    description: curated.description,
    manifestObjectKey: manifestPath,
    attribution: curated.attribution,
    licenseName: curated.licenseName,
    licenseSourceUrl: curated.sourcePageUrl,
    isActive: true,
    updatedAt: new Date(),
  };

  if (existingSoundscape) {
    await database
      .update(soundscapes)
      .set(values)
      .where(eq(soundscapes.id, soundscapeId));
  } else {
    await database.insert(soundscapes).values({
      id: soundscapeId,
      ...values,
    });
  }

  await database
    .insert(booksToSoundscapes)
    .values({
      bookId: book.id,
      soundscapeId,
      isDefault: curated.isDefault,
    })
    .onConflictDoUpdate({
      target: [booksToSoundscapes.bookId, booksToSoundscapes.soundscapeId],
      set: { isDefault: curated.isDefault },
    });

  await removeLegacyAudio(soundscapeId, curated.title);
  console.log(`✓ « ${curated.title} » est prête`);
}

console.log(`Bibliothèque audio réelle installée pour « ${book.title} ».`);
