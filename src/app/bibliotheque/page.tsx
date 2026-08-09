import Link from "next/link";
import { ensureCurrentProfile } from "@/auth/session";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const { user } = await ensureCurrentProfile();

  return (
    <main className="library-shell">
      <div className="library-content">
        <Link className="brand-wordmark" href="/">
          <span className="brand-letter">L</span>yreah
        </Link>
        <h1 className="library-heading">Ma bibliothèque</h1>
        <section className="library-card">
          <p>Bienvenue, {user.name || user.email}.</p>
          <p>Ta bibliothèque personnelle accueillera bientôt tes prochaines lectures.</p>
          <Link className="text-link" href="/compte">
            Gérer mon compte
          </Link>
        </section>
      </div>
    </main>
  );
}
