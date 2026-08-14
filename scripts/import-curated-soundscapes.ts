import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getDatabase } from "../src/db";
import { books, booksToSoundscapes, soundscapes } from "../src/db/schema";
import { createNestedStoragePath } from "../src/storage/paths";
import type { VisualEffect } from "../src/audio/effects";

type CuratedLayer = {
  contentType: "audio/mpeg" | "audio/ogg";
  downloadUrl: string;
  fileName: string;
  id: string;
  intervalSeconds?: number;
  startDelaySeconds?: number;
  title: string;
  volume: number;
};

type CuratedSoundscape = {
  attribution: string;
  description: string;
  isDefault: boolean;
  layers: CuratedLayer[];
  legacyTitles?: string[];
  licenseName: string;
  sourcePageUrl: string;
  title: string;
  visualEffect: VisualEffect;
};

const MAX_AUDIO_BYTES = 40 * 1024 * 1024;
const MIN_AUDIO_BYTES = 10 * 1024;
const DOWNLOAD_PAUSE_MS = 1_500;

const CURATED_SOUNDSCAPES: CuratedSoundscape[] = [
  {
    title: "Clairière nocturne",
    legacyTitles: ["Clairière nocturne — démo"],
    description: "Une prairie nocturne vivante, peuplée d’insectes et d’échos lointains.",
    layers: [
      {
        contentType: "audio/ogg",
        downloadUrl:
          "https://upload.wikimedia.org/wikipedia/commons/2/28/Grasshoppers.ogg",
        fileName: "Grasshoppers.ogg",
        id: "night-insects",
        title: "Insectes nocturnes",
        volume: 0.56,
      },
    ],
    sourcePageUrl: "https://commons.wikimedia.org/wiki/File:Grasshoppers.ogg",
    attribution: "Enregistrement par Mysid, via Wikimedia Commons",
    licenseName: "Domaine public",
    visualEffect: "fireflies",
    isDefault: true,
  },
  {
    title: "Pluie contre la vitre",
    legacyTitles: ["Pluie dans les fougères — démo"],
    description: "Une pluie soutenue contre une fenêtre, portée par quelques rafales de vent.",
    layers: [
      {
        contentType: "audio/ogg",
        downloadUrl:
          "https://upload.wikimedia.org/wikipedia/commons/4/41/Rain_against_the_window.ogg",
        fileName: "Rain against the window.ogg",
        id: "window-rain",
        title: "Pluie et vent",
        volume: 0.62,
      },
    ],
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Rain_against_the_window.ogg",
    attribution: "Enregistrement par cori, via Wikimedia Commons / PDSounds",
    licenseName: "Domaine public",
    visualEffect: "rain",
    isDefault: false,
  },
  {
    title: "Aube aux oiseaux",
    legacyTitles: ["Aube brumeuse — démo"],
    description: "Un réveil naturel d’oiseaux, ample et lumineux, enregistré au petit matin.",
    layers: [
      {
        contentType: "audio/ogg",
        downloadUrl:
          "https://upload.wikimedia.org/wikipedia/commons/3/33/R%C3%A9veil_des_oiseaux.ogg",
        fileName: "Réveil des oiseaux.ogg",
        id: "dawn-birds",
        title: "Oiseaux du matin",
        volume: 0.48,
      },
    ],
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:R%C3%A9veil_des_oiseaux.ogg",
    attribution: "Enregistrement par Joseph Sardin, via BigSoundBank / Wikimedia Commons",
    licenseName: "CC0 1.0",
    visualEffect: "mist",
    isDefault: false,
  },
  {
    title: "Feu de cheminée",
    description: "Le crépitement proche et chaleureux d’un feu dans une cheminée ouverte.",
    layers: [
      {
        contentType: "audio/ogg",
        downloadUrl:
          "https://upload.wikimedia.org/wikipedia/commons/d/d8/Dry_grass_burning_in_open_fireplace.ogg",
        fileName: "Dry grass burning in open fireplace.ogg",
        id: "fireplace",
        title: "Crépitement du feu",
        volume: 0.54,
      },
    ],
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Dry_grass_burning_in_open_fireplace.ogg",
    attribution: "Enregistrement par ezwa, via Wikimedia Commons / PDSounds",
    licenseName: "Domaine public",
    visualEffect: "none",
    isDefault: false,
  },
  {
    title: "Rive tranquille",
    description: "Des vagues moyennes, des remous et quelques sternes entendues au loin.",
    layers: [
      {
        contentType: "audio/ogg",
        downloadUrl:
          "https://upload.wikimedia.org/wikipedia/commons/5/5d/DenisChardonnet_-_Vagues_et_Sternes.ogg",
        fileName: "DenisChardonnet - Vagues et Sternes.ogg",
        id: "lake-waves",
        title: "Vagues sur la rive",
        volume: 0.5,
      },
    ],
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:DenisChardonnet_-_Vagues_et_Sternes.ogg",
    attribution: "Enregistrement par Denis Chardonnet, via BigSoundBank / Wikimedia Commons",
    licenseName: "CC0 1.0",
    visualEffect: "breeze",
    isDefault: false,
  },
  {
    title: "Port dans la brume",
    description: "Le clapotis et les mouvements d’un ponton flottant dans le port de Deauville.",
    layers: [
      {
        contentType: "audio/ogg",
        downloadUrl: "https://lasonotheque.org/UPLOAD/ogg/1444.ogg",
        fileName: "port-de-plaisance-ponton.ogg",
        id: "harbor-wharf",
        title: "Ponton et clapotis",
        volume: 0.54,
      },
    ],
    sourcePageUrl:
      "https://lasonotheque.org/ponton-port-de-plaisance-s1444.html",
    attribution: "Enregistrement par Joseph Sardin, via LaSonothèque",
    licenseName: "CC0 / équivalent domaine public",
    visualEffect: "harbor",
    isDefault: false,
  },
  {
    title: "Sous la surface",
    description: "Une masse d’eau enveloppante enregistrée sous une cascade avec un hydrophone.",
    layers: [
      {
        contentType: "audio/mpeg",
        downloadUrl: "https://bigsoundbank.com/UPLOAD/mp3/3430.mp3",
        fileName: "underwater-hydrophone.mp3",
        id: "underwater-flow",
        title: "Courants sous-marins",
        volume: 0.48,
      },
    ],
    sourcePageUrl: "https://bigsoundbank.com/underwater-s3430.html",
    attribution: "Enregistrement par Joseph Sardin et Axeline T., via BigSoundBank",
    licenseName: "CC0 1.0",
    visualEffect: "underwater",
    isDefault: false,
  },
  {
    title: "À bord du sous-marin",
    description: "Un grondement de coque continu, traversé à intervalles espacés par le sonar.",
    layers: [
      {
        contentType: "audio/ogg",
        downloadUrl:
          "https://opengameart.org/sites/default/files/underwater_or_space_engine_0.ogg",
        fileName: "underwater-engine.ogg",
        id: "submarine-engine",
        title: "Moteur et pression",
        volume: 0.46,
      },
      {
        contentType: "audio/mpeg",
        downloadUrl:
          "https://opengameart.org/sites/default/files/sonar_ping_0.mp3",
        fileName: "sonar-ping.mp3",
        id: "sonar-ping",
        intervalSeconds: 24,
        startDelaySeconds: 7,
        title: "Sonar lointain",
        volume: 0.24,
      },
    ],
    sourcePageUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
    attribution: "Créations de gmason et Spiceman, via OpenGameArt",
    licenseName: "CC0 1.0",
    visualEffect: "submarine",
    isDefault: false,
  },
  {
    title: "Orage gothique",
    description: "Une longue tempête en forêt, sombre et pesante, avec pluie, vent et éclairs.",
    layers: [
      {
        contentType: "audio/ogg",
        downloadUrl:
          "https://upload.wikimedia.org/wikipedia/commons/c/ce/Summer_thunderstorm_in_the_woods.ogg",
        fileName: "Summer thunderstorm in the woods.ogg",
        id: "gothic-storm",
        title: "Orage dans les bois",
        volume: 0.56,
      },
    ],
    sourcePageUrl:
      "https://commons.wikimedia.org/wiki/File:Summer_thunderstorm_in_the_woods.ogg",
    attribution: "Enregistrement par Serg Childed, via Wikimedia Commons",
    licenseName: "CC BY-SA 4.0",
    visualEffect: "storm",
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

async function downloadAudio(layer: CuratedLayer) {
  const curl = process.platform === "win32" ? "curl.exe" : "curl";
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "lyreah-audio-"));
  const temporaryFile = join(temporaryDirectory, layer.fileName);
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
        layer.downloadUrl,
      ],
      { stderr: "inherit", stdout: "inherit" },
    );
    const exitCode = await subprocess.exited;

    if (exitCode !== 0) {
      throw new Error(`Téléchargement impossible : ${layer.fileName}`);
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

  const hasMp3Signature =
    (contents[0] === 0x49 && contents[1] === 0x44 && contents[2] === 0x33) ||
    (contents[0] === 0xff && (contents[1]! & 0xe0) === 0xe0);
  const signatureIsValid =
    layer.contentType === "audio/ogg" ? hasOggSignature : hasMp3Signature;

  if (!signatureIsValid) {
    throw new Error(`Le fichier reçu n’est pas un audio valide : ${layer.fileName}`);
  }

  if (contents.byteLength < MIN_AUDIO_BYTES || contents.byteLength > MAX_AUDIO_BYTES) {
    throw new Error(
      `Taille audio inattendue pour ${layer.fileName} : ${(contents.byteLength / 1024 / 1024).toFixed(2)} Mo`,
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
  for (const layer of soundscape.layers) {
    console.log(`↓ ${soundscape.title} · ${layer.title}`);
    downloadedAudio.set(
      `${soundscape.title}:${layer.id}`,
      await downloadAudio(layer),
    );
    await wait(DOWNLOAD_PAUSE_MS);
  }
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
  const manifestPath = createNestedStoragePath("audio", soundscapeId, "manifest.json");
  const preparedLayers = curated.layers.map((layer) => {
    const file = layer.fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .toLowerCase();
    return { ...layer, file };
  });
  const manifest = {
    version: 1,
    visualEffect: curated.visualEffect,
    layers: preparedLayers.map((layer) => ({
      id: layer.id,
      title: layer.title,
      file: layer.file,
      volume: layer.volume,
      intervalSeconds: layer.intervalSeconds,
      startDelaySeconds: layer.startDelaySeconds,
    })),
  } as const;

  console.log(`↑ ${curated.title}`);
  for (const layer of preparedLayers) {
    const audioContents = downloadedAudio.get(`${curated.title}:${layer.id}`);
    if (!audioContents) {
      throw new Error(`Audio absent de la mémoire tampon : ${curated.title} / ${layer.title}`);
    }
    await uploadStorageObject(
      createNestedStoragePath("audio", soundscapeId, layer.file),
      audioContents,
      layer.contentType,
    );
  }
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
