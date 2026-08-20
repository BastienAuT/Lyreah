import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/auth/session";
import { getCatalogBookBySlug } from "@/catalog/queries";
import { getCatalogCoverCredit } from "@/catalog/cover-credits";
import { formatBookLanguage } from "@/catalog/languages";
import { BookCover } from "@/components/catalog/book-cover";
import { addBookToLibrary, removeBookFromLibrary } from "@/library/actions";
import { getLibraryEntry } from "@/library/queries";
import { createPublicPageMetadata } from "@/site/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await getCatalogBookBySlug(slug);
  return book
    ? createPublicPageMetadata({
        title: book.title,
        description: book.synopsis,
        path: `/livres/${book.slug}`,
      })
    : {};
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [book, user] = await Promise.all([
    getCatalogBookBySlug(slug),
    getCurrentUser(),
  ]);

  if (!book) notFound();

  const author = book.authors.map((item) => item.name).join(", ") || "Auteur inconnu";
  const isReady = book.processingStatus === "ready" && Boolean(book.epubRenditionPrefix);
  const libraryEntry = user ? await getLibraryEntry(user.id, book.id) : null;
  const coverCredit = getCatalogCoverCredit(book.slug);

  return (
    <main className="book-detail-page">
      <nav className="book-detail-nav">
        <Link className="brand-wordmark" href="/"><span className="brand-letter">L</span>yreah</Link>
        <div className="book-detail-nav__links">
          <Link href="/catalogue">← Retour au catalogue</Link>
          <Link className="page-account-link" href="/compte/settings">Mon compte</Link>
        </div>
      </nav>
      <article className="book-detail">
        <BookCover title={book.title} author={author} slug={book.slug} size="detail" />
        <div className="book-detail__copy">
          <p className="eyebrow">{book.categories.map((category) => category.name).join(" · ")}</p>
          <h1>{book.title}</h1>
          <p className="book-detail__author">
            {author}{book.publicationYear ? ` · ${book.publicationYear}` : ""}
            {` · ${formatBookLanguage(book.language)}`}
          </p>
          <p className="book-detail__synopsis">{book.synopsis}</p>
          <div className="book-detail__actions">
            {isReady ? (
              <Link className="button button--primary" href={`/lire/${book.slug}`}>Commencer la lecture</Link>
            ) : (
              <span className="button button--disabled">Lecture bientôt disponible</span>
            )}
            <form action={libraryEntry ? removeBookFromLibrary : addBookToLibrary}>
              <input name="bookId" type="hidden" value={book.id} />
              <button className="text-link library-action" type="submit">
                {libraryEntry ? "Retirer de ma bibliothèque" : "Ajouter à ma bibliothèque"}
              </button>
            </form>
          </div>
          <aside className="rights-note">
            <strong>Droits et provenance</strong>
            <p>{book.rightsStatement}</p>
            <a href={book.sourceUrl} target="_blank" rel="noreferrer">Consulter la source ↗</a>
            {coverCredit ? (
              <p>
                {coverCredit.credit} · {coverCredit.license}
              </p>
            ) : null}
          </aside>
        </div>
      </article>
    </main>
  );
}
