import { getCurrentAccess } from "@/admin/access";
import { completeBookImport } from "@/admin/imports";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/admin/imports/[id]/complete">,
) {
  const { user, profile } = await getCurrentAccess();

  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (profile?.role !== "admin") {
    return Response.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const book = await completeBookImport(id);
    return Response.json({ book });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOK_IMPORT_NOT_FOUND") {
      return Response.json({ error: "Import introuvable." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "UPLOAD_INCOMPLETE") {
      return Response.json(
        { error: "Supabase n’a pas encore reçu tous les fichiers." },
        { status: 409 },
      );
    }

    console.error("Unable to complete book import", error);
    return Response.json(
      { error: "Impossible de confirmer l’import." },
      { status: 500 },
    );
  }
}
