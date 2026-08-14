import { getCurrentAccess } from "@/admin/access";
import {
  isAudioFile,
  prepareSoundscapeSchema,
} from "@/admin/soundscape-schema";
import { prepareSoundscape } from "@/admin/soundscapes";

export async function POST(request: Request) {
  const { user, profile } = await getCurrentAccess();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (profile?.role !== "admin") {
    return Response.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const result = prepareSoundscapeSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!result.success || result.data.files.some((file) => !isAudioFile(file))) {
    return Response.json(
      { error: "Les informations ou fichiers audio sont invalides." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await prepareSoundscape(result.data), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOK_NOT_FOUND") {
      return Response.json({ error: "Livre introuvable." }, { status: 404 });
    }
    console.error("Unable to prepare soundscape", error);
    return Response.json(
      { error: "Impossible de préparer l’ambiance sonore." },
      { status: 500 },
    );
  }
}
