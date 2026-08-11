import Link from "next/link";
import { requireAdminPage } from "@/admin/access";
import { getRecentBookImports } from "@/admin/imports";
import { BookImportForm } from "@/components/admin/book-import-form";

export const dynamic = "force-dynamic";

const statusLabels = {
  pending: "Fichiers attendus",
  processing: "À préparer",
  ready: "Prêt",
  failed: "Échec",
} as const;

export default async function AdminPage() {
  const { user } = await requireAdminPage();
  const imports = await getRecentBookImports();

  return (
    <main className="admin-shell">
      <div className="admin-page">
        <header className="admin-header">
          <div>
            <Link className="brand-wordmark" href="/">
              <span className="brand-letter">L</span>yreah
            </Link>
            <p className="eyebrow">Atelier éditorial</p>
            <h1>Importer un nouveau livre</h1>
            <p>
              Les fichiers restent privés. Le catalogue ne publie rien avant la
              préparation et la validation de l’ouvrage.
            </p>
          </div>
          <div className="admin-identity">
            <span>Administrateur</span>
            <strong>{user.name || user.email}</strong>
          </div>
        </header>

        <section className="admin-panel">
          <BookImportForm />
        </section>

        <section className="admin-imports">
          <div className="admin-section-title">
            <p className="eyebrow">Suivi</p>
            <h2>Imports récents</h2>
          </div>
          {imports.length ? (
            <div className="admin-import-list">
              {imports.map((book) => (
                <article key={book.id}>
                  <div>
                    <strong>{book.title}</strong>
                    <span>{book.originalEpubFileName || "Livre du catalogue"}</span>
                  </div>
                  <span className={`admin-status admin-status--${book.processingStatus}`}>
                    {statusLabels[book.processingStatus]}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-empty">Aucun import pour le moment.</p>
          )}
        </section>
      </div>
    </main>
  );
}
