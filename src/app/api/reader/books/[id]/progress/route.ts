import { ensureCurrentProfile, getCurrentUser } from "@/auth/session";
import { getReadableBookById } from "@/reader/queries";
import { parseReadingProgressInput } from "@/reader/progress-input";
import {
  getReadingProgress,
  saveReadingProgress,
} from "@/reader/progress-queries";

async function getProgressContext(bookId: string) {
  const user = await getCurrentUser();

  if (!user) return null;

  const book = await getReadableBookById(bookId);

  if (!book) return { user, book: null, profile: null };

  const { profile } = await ensureCurrentProfile();
  return { user, book, profile };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await getProgressContext(id);

  if (!access) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (!access.book || !access.profile) {
    return Response.json({ error: "Livre introuvable." }, { status: 404 });
  }

  const progress = await getReadingProgress(access.profile.id, access.book.id);

  return Response.json(
    { progress },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const access = await getProgressContext(id);

  if (!access) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  if (!access.book || !access.profile) {
    return Response.json({ error: "Livre introuvable." }, { status: 404 });
  }

  try {
    const input = parseReadingProgressInput(await request.json());
    const progress = await saveReadingProgress(
      access.profile.id,
      access.book.id,
      input,
    );

    return Response.json(
      { progress },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json({ error: "Position de lecture invalide." }, { status: 400 });
  }
}
