import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getDatabase } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "./server";

export const getCurrentUser = cache(async () => {
  const { data: session, error } = await auth.getSession();

  if (error || !session?.user) {
    return null;
  }

  return session.user;
});

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  return user;
}

export async function ensureCurrentProfile() {
  const user = await requireCurrentUser();
  const [profile] = await getDatabase()
    .insert(profiles)
    .values({
      id: user.id,
      displayName: user.name || user.email.split("@")[0],
    })
    .onConflictDoUpdate({
      target: profiles.id,
      set: {
        displayName: user.name || user.email.split("@")[0],
        updatedAt: new Date(),
      },
    })
    .returning();

  return { user, profile };
}
