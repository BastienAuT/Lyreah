import Link from "next/link";
import { ensureCurrentProfile } from "@/auth/session";
import { BookCover } from "@/components/catalog/book-cover";
import { removeBookFromLibrary } from "@/library/actions";
import { getLibraryBooks } from "@/library/queries";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const { user, profile } = await ensureCurrentProfile();
  const entries = await getLibraryBooks(profile.id);

  return (
    <main className="library-shell">
      <div className="library-content">
        <Link className="brand-wordmark" href="/">
          <span className="brand-letter">L</span>yreah
        </Link>
        <header className="library-header">
          <div>
            <p className="eyebrow">L’espace de {user.name || user.email}</p>
            <h1 className="library-heading">Ma bibliothèque</h1>
          </div>
          <Link className="text-link" href="/catalogue">Découvrir des livres →</Link>
        </header>

        {entries.length > 0 ? (
          <section className="library-grid" aria-label="Livres enregistrés">
            {entries.map(({ book, authors, status, percentageBasisPoints }) => {
              const author = authors.join(", ") || "Auteur inconnu";
              const progress = Math.round((percentageBasisPoints ?? 0) / 100);
              const hasStarted = progress > 0;
              const statusLabel = {
                saved: "À lire",
                reading: "Lecture en cours",
                finished: "Terminé",
              }[status];

              return (
                <article className="library-book" key={book.id}>
                  <Link href={`/livres/${book.slug}`}>
                    <BookCover title={book.title} author={author} slug={book.slug} />
                  </Link>
                  <div className="library-book__meta">
                    <p>{hasStarted && status === "saved" ? "Lecture en cours" : statusLabel}</p>
                    <h2><Link href={`/livres/${book.slug}`}>{book.title}</Link></h2>
                    <span>{author}</span>
                    {hasStarted ? (
                      <div
                        aria-label={`Progression de lecture : ${progress} %`}
                        className="library-book__progress"
                      >
                        <span><i style={{ width: `${progress}%` }} /></span>
                        <strong>{progress} %</strong>
                      </div>
                    ) : null}
                    <div className="library-book__actions">
                      {book.processingStatus === "ready" && book.epubRenditionPrefix ? (
                        <Link className="button button--primary" href={`/lire/${book.slug}`}>
                          {hasStarted || status !== "saved" ? "Reprendre" : "Commencer"}
                        </Link>
                      ) : (
                        <Link className="button button--secondary" href={`/livres/${book.slug}`}>
                          Voir le livre
                        </Link>
                      )}
                      <form action={removeBookFromLibrary}>
                        <input name="bookId" type="hidden" value={book.id} />
                        <button className="library-remove" type="submit">Retirer</button>
                      </form>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="library-card library-empty">
            <span aria-hidden="true">✦</span>
            <h2>Votre prochaine histoire vous attend.</h2>
            <p>Enregistrez des livres depuis le catalogue pour les retrouver ici.</p>
            <Link className="button button--primary" href="/catalogue">Explorer le catalogue</Link>
          </section>
        )}
      </div>
    </main>
  );
}
