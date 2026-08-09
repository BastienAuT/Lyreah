import "server-only";

import { redirect } from "next/navigation";
import { getDatabase } from "@/db";
import { profiles } from "@/db/schema";
import { auth } from "./server";

export async function requireCurrentUser() {
  const { data: session, error } = await auth.getSession();

  if (error || !session?.user) {
    redirect("/auth/sign-in");
  }

  return session.user;
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
