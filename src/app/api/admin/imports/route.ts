import { getCurrentAccess } from "@/admin/access";
import {
  adminBookImportSchema,
  isCoverFile,
  isEpubFile,
} from "@/admin/import-schema";
import { createBookImport } from "@/admin/imports";

export async function POST(request: Request) {
  const { user, profile } = await getCurrentAccess();

  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (profile?.role !== "admin") {
    return Response.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const result = adminBookImportSchema.safeParse(payload);

  if (!result.success) {
    return Response.json(
      { error: "Les données de l’import sont invalides." },
      { status: 400 },
    );
  }

  if (!isEpubFile(result.data.epub)) {
    return Response.json({ error: "Le fichier EPUB est invalide." }, { status: 400 });
  }

  if (result.data.cover && !isCoverFile(result.data.cover)) {
    return Response.json(
      { error: "La couverture doit être une image AVIF, JPEG, PNG ou WebP." },
      { status: 400 },
    );
  }

  try {
    return Response.json(await createBookImport(result.data, profile.id), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOK_SLUG_EXISTS") {
      return Response.json(
        { error: "Un livre utilise déjà cette adresse." },
        { status: 409 },
      );
    }

    console.error("Unable to create book import", error);
    return Response.json(
      { error: "Impossible de préparer l’import pour le moment." },
      { status: 500 },
    );
  }
}
