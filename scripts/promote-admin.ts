import { eq } from "drizzle-orm";
import { getDatabase } from "../src/db";
import { profiles } from "../src/db/schema";

const requestedProfileId = Bun.argv[2];
const database = getDatabase();
const candidates = await database.select().from(profiles).limit(3);

if (candidates.length === 0) {
  throw new Error("Aucun profil Lyreah. Connecte-toi une première fois avant cette commande.");
}

const selected = requestedProfileId
  ? candidates.find((profile) => profile.id === requestedProfileId) ??
    (await database
      .select()
      .from(profiles)
      .where(eq(profiles.id, requestedProfileId))
      .limit(1))[0]
  : candidates.length === 1
    ? candidates[0]
    : undefined;

if (!selected) {
  console.table(
    candidates.map(({ id, displayName, role }) => ({ id, displayName, role })),
  );
  throw new Error(
    "Plusieurs profils existent. Relance avec : bun run admin:promote -- <profile-id>",
  );
}

await database
  .update(profiles)
  .set({ role: "admin", updatedAt: new Date() })
  .where(eq(profiles.id, selected.id));

console.log(`Le profil ${selected.displayName} possède maintenant le rôle admin.`);
