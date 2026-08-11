import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDatabase } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "@/auth/server";

export async function getCurrentAccess() {
  const { data: session, error } = await auth.getSession();

  if (error || !session?.user) {
    return { user: null, profile: null };
  }

  const [profile] = await getDatabase()
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1);

  return { user: session.user, profile: profile ?? null };
}

export async function requireAdminPage() {
  const access = await getCurrentAccess();

  if (!access.user) {
    redirect("/auth/sign-in");
  }

  if (access.profile?.role !== "admin") {
    redirect("/compte?admin=required");
  }

  return { user: access.user, profile: access.profile };
}
