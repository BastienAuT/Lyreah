import { eq } from "drizzle-orm";
import { ensureCurrentProfile } from "@/auth/session";
import { getDatabase } from "@/db";
import { profiles } from "@/db/schema";
import { parseReaderPreferences } from "@/reader/preferences";

export async function PATCH(request: Request) {
  const { user } = await ensureCurrentProfile();
  const input = await request.json().catch(() => null);

  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json(
      { error: "Préférences de lecture invalides." },
      { status: 400 },
    );
  }

  const preferences = parseReaderPreferences(JSON.stringify(input));

  await getDatabase()
    .update(profiles)
    .set({ readerPreferences: preferences, updatedAt: new Date() })
    .where(eq(profiles.id, user.id));

  return Response.json({ preferences });
}
