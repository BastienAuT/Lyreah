import { getCurrentUser } from "@/auth/session";
import { parseSoundscapeManifest } from "@/audio/manifest";
import { getDefaultSoundscapeForBook } from "@/audio/queries";
import { getReadableBookById } from "@/reader/queries";
import {
  createNestedStoragePath,
  createSignedReadUrl,
  createStorageResourcePrefix,
  downloadStorageObject,
} from "@/storage/supabase";

const SIGNED_URL_LIFETIME_SECONDS = 15 * 60;

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id } = await context.params;
  const book = await getReadableBookById(id);

  if (!book) {
    return Response.json({ error: "Livre introuvable." }, { status: 404 });
  }

  const soundscape = await getDefaultSoundscapeForBook(book.id);

  if (!soundscape) {
    return Response.json(
      { soundscape: null },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const soundscapePrefix = createStorageResourcePrefix("audio", soundscape.id);

    if (!soundscape.manifestObjectKey.startsWith(`${soundscapePrefix}/`)) {
      throw new Error("Soundscape manifest is outside its storage prefix.");
    }

    const manifestBuffer = await downloadStorageObject(soundscape.manifestObjectKey);
    const manifest = parseSoundscapeManifest(new TextDecoder().decode(manifestBuffer));
    const layers = await Promise.all(
      manifest.layers.map(async (layer) => ({
        id: layer.id,
        title: layer.title,
        volume: layer.volume,
        url: await createSignedReadUrl(
          createNestedStoragePath("audio", soundscape.id, layer.file),
          SIGNED_URL_LIFETIME_SECONDS,
        ),
      })),
    );

    return Response.json(
      {
        soundscape: {
          id: soundscape.id,
          title: soundscape.title,
          description: soundscape.description,
          attribution: soundscape.attribution,
          licenseName: soundscape.licenseName,
          licenseSourceUrl: soundscape.licenseSourceUrl,
          layers,
        },
        expiresIn: SIGNED_URL_LIFETIME_SECONDS,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Unable to prepare book soundscape", error);
    return Response.json(
      { error: "L’ambiance sonore n’est pas disponible pour le moment." },
      { status: 500 },
    );
  }
}
