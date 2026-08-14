import { getCurrentAccess } from "@/admin/access";
import { updateSoundscapeSchema } from "@/admin/soundscape-schema";
import { updateSoundscape } from "@/admin/soundscapes";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/soundscapes/[id]">,
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
  const result = updateSoundscapeSchema.safeParse(payload);
  if (!result.success) {
    return Response.json({ error: "Les réglages sont invalides." }, { status: 400 });
  }

  try {
    return Response.json(await updateSoundscape(id, result.data));
  } catch (error) {
    if (error instanceof Error && error.message === "SOUNDSCAPE_NOT_FOUND") {
      return Response.json({ error: "Ambiance introuvable." }, { status: 404 });
    }
    console.error("Unable to update soundscape", error);
    return Response.json(
      { error: "Impossible de modifier l’ambiance sonore." },
      { status: 500 },
    );
  }
}
