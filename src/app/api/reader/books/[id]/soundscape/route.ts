import { getCurrentUser } from "@/auth/session";
import { parseSoundscapeManifest } from "@/audio/manifest";
import { getSoundscapesForBook } from "@/audio/queries";
import { SIGNED_AUDIO_URL_LIFETIME_SECONDS } from "@/audio/signed-url-refresh";
import { getReadableBookById } from "@/reader/queries";
import {
  createNestedStoragePath,
  createSignedReadUrl,
  createStorageResourcePrefix,
  downloadStorageObject,
} from "@/storage/supabase";

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

  const soundscapes = await getSoundscapesForBook(book.id);

  if (!soundscapes.length) {
    return Response.json(
      { defaultSoundscapeId: null, soundscape: null, soundscapes: [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const issuedAt = Date.now();
    const preparedSoundscapes = await Promise.all(
      soundscapes.map(async (soundscape) => {
        const soundscapePrefix = createStorageResourcePrefix("audio", soundscape.id);

        if (!soundscape.manifestObjectKey.startsWith(`${soundscapePrefix}/`)) {
          throw new Error("Soundscape manifest is outside its storage prefix.");
        }

        const manifestBuffer = await downloadStorageObject(
          soundscape.manifestObjectKey,
        );
        const manifest = parseSoundscapeManifest(
          new TextDecoder().decode(manifestBuffer),
        );
        const layers = await Promise.all(
          manifest.layers.map(async (layer) => ({
            id: layer.id,
            intervalSeconds: layer.intervalSeconds,
            startDelaySeconds: layer.startDelaySeconds,
            title: layer.title,
            volume: layer.volume,
            url: await createSignedReadUrl(
              createNestedStoragePath("audio", soundscape.id, layer.file),
              SIGNED_AUDIO_URL_LIFETIME_SECONDS,
            ),
          })),
        );

        return {
          id: soundscape.id,
          title: soundscape.title,
          description: soundscape.description,
          attribution: soundscape.attribution,
          licenseName: soundscape.licenseName,
          licenseSourceUrl: soundscape.licenseSourceUrl,
          visualEffect: manifest.visualEffect,
          layers,
        };
      }),
    );
    const defaultSoundscapeId =
      soundscapes.find((soundscape) => soundscape.isDefault)?.id ??
      preparedSoundscapes[0]?.id ??
      null;

    return Response.json(
      {
        defaultSoundscapeId,
        soundscape:
          preparedSoundscapes.find(
            (soundscape) => soundscape.id === defaultSoundscapeId,
          ) ?? null,
        soundscapes: preparedSoundscapes,
        issuedAt,
        expiresAt: issuedAt + SIGNED_AUDIO_URL_LIFETIME_SECONDS * 1_000,
        expiresIn: SIGNED_AUDIO_URL_LIFETIME_SECONDS,
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
