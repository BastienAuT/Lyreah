import { getCurrentAccess } from "@/admin/access";
import { completeSoundscapeSchema } from "@/admin/soundscape-schema";
import { completeSoundscape } from "@/admin/soundscapes";

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/soundscapes/[id]/complete">,
) {
  const { user, profile } = await getCurrentAccess();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }
  if (profile?.role !== "admin") {
    return Response.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const [{ id }, payload] = await Promise.all([
    context.params,
    request.json().catch(() => null),
  ]);
  const result = completeSoundscapeSchema.safeParse(payload);
  if (!result.success) {
    return Response.json({ error: "Le manifeste audio est invalide." }, { status: 400 });
  }

  try {
    return Response.json(await completeSoundscape(id, result.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "SOUNDSCAPE_NOT_FOUND") {
      return Response.json({ error: "Ambiance introuvable." }, { status: 404 });
    }
    if (message === "UPLOAD_INCOMPLETE") {
      return Response.json(
        { error: "Certains fichiers audio n’ont pas été envoyés." },
        { status: 409 },
      );
    }
    console.error("Unable to complete soundscape", error);
    return Response.json(
      { error: "Impossible d’activer l’ambiance sonore." },
      { status: 500 },
    );
  }
}
