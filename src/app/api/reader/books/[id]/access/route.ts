import { getCurrentUser } from "@/auth/session";
import { getReadableBookById } from "@/reader/queries";
import { createSignedReadUrl } from "@/storage/supabase";

const SIGNED_URL_LIFETIME_SECONDS = 5 * 60;

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

  if (!book?.epubMasterObjectKey) {
    return Response.json(
      { error: "Ce livre n’est pas disponible à la lecture." },
      { status: 404 },
    );
  }

  try {
    const url = await createSignedReadUrl(
      book.epubMasterObjectKey,
      SIGNED_URL_LIFETIME_SECONDS,
    );

    return Response.json(
      { url, expiresIn: SIGNED_URL_LIFETIME_SECONDS },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Unable to create EPUB reading access", error);
    return Response.json(
      { error: "Impossible d’ouvrir le livre pour le moment." },
      { status: 500 },
    );
  }
}
