import Link from "next/link";
import { requireAdminPage } from "@/admin/access";
import { getRecentBookImports } from "@/admin/imports";
import { canPublishBook } from "@/admin/publication-rules";
import { getAdminSoundscapeOverview } from "@/admin/soundscapes";
import { BookImportForm } from "@/components/admin/book-import-form";
import { PublicationControl } from "@/components/admin/publication-control";
import { RetryRenditionButton } from "@/components/admin/retry-rendition-button";
import { SoundscapeManager } from "@/components/admin/soundscape-manager";

export const dynamic = "force-dynamic";

const statusLabels = {
  pending: "Fichiers attendus",
  processing: "Préparation en cours",
  ready: "Prêt",
  failed: "Échec",
} as const;

export default async function AdminPage() {
  const { user } = await requireAdminPage();
  const [imports, soundscapeOverview] = await Promise.all([
    getRecentBookImports(),
    getAdminSoundscapeOverview(),
  ]);

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
            <Link className="admin-account-link" href="/compte/settings">
              {user.name || "Mon compte"}
            </Link>
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
                    {book.processingError ? (
                      <span className="admin-processing-error">
                        {book.processingError}
                      </span>
                    ) : null}
                  </div>
                  <div className="admin-import-state">
                    <span className={`admin-status admin-status--${book.processingStatus}`}>
                      {statusLabels[book.processingStatus]}
                    </span>
                    <span className={`admin-publication-state${book.publishedAt ? " is-published" : ""}`}>
                      {book.publishedAt ? "Publié" : "Non publié"}
                    </span>
                    {book.processingStatus === "failed" ? (
                      <RetryRenditionButton bookId={book.id} />
                    ) : null}
                    <PublicationControl
                      bookId={book.id}
                      canPublish={canPublishBook(book)}
                      isPublished={Boolean(book.publishedAt)}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="admin-empty">Aucun import pour le moment.</p>
          )}
        </section>

        <section className="admin-imports admin-soundscapes">
          <div className="admin-section-title">
            <p className="eyebrow">Immersion</p>
            <h2>Ambiances sonores</h2>
            <p>
              Associe plusieurs pistes à un livre, choisis son effet visuel et
              définis l’ambiance proposée par défaut dans la liseuse.
            </p>
          </div>
          <SoundscapeManager
            books={soundscapeOverview.books}
            soundscapes={soundscapeOverview.soundscapes}
          />
        </section>
      </div>
    </main>
  );
}
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Administration",
  robots: { index: false, follow: false },
};
