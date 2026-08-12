import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentAccess } from "@/admin/access";
import { setBookPublication } from "@/admin/publication";

const publicationRequestSchema = z.object({
  intent: z.enum(["publish", "unpublish"]),
});

export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/books/[id]/publication">,
) {
  const { user, profile } = await getCurrentAccess();

  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (profile?.role !== "admin") {
    return Response.json({ error: "Accès administrateur requis." }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const input = publicationRequestSchema.safeParse(payload);

  if (!input.success) {
    return Response.json({ error: "Demande de publication invalide." }, { status: 400 });
  }

  const { id } = await context.params;

  try {
    const book = await setBookPublication(id, input.data.intent);

    revalidatePath("/");
    revalidatePath("/catalogue");
    revalidatePath(`/livres/${book.slug}`);
    revalidatePath("/admin");

    return Response.json({ book });
  } catch (error) {
    if (error instanceof Error && error.message === "BOOK_NOT_FOUND") {
      return Response.json({ error: "Livre introuvable." }, { status: 404 });
    }

    if (error instanceof Error && error.message === "BOOK_NOT_READY") {
      return Response.json(
        { error: "La rendition EPUB doit être prête avant publication." },
        { status: 409 },
      );
    }

    console.error("Unable to update book publication", error);
    return Response.json(
      { error: "Impossible de mettre à jour la publication." },
      { status: 500 },
    );
  }
}
