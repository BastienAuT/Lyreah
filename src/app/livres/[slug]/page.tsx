import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalogBookBySlug } from "@/catalog/queries";
import { BookCover } from "@/components/catalog/book-cover";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const book = await getCatalogBookBySlug(slug);
  return book ? { title: `${book.title} — Lyreah`, description: book.synopsis } : {};
}

export default async function BookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const book = await getCatalogBookBySlug(slug);

  if (!book) notFound();

  const author = book.authors.map((item) => item.name).join(", ") || "Auteur inconnu";
  const isReady = book.processingStatus === "ready" && Boolean(book.epubRenditionPrefix);

  return (
    <main className="book-detail-page">
      <nav className="book-detail-nav">
        <Link className="brand-wordmark" href="/"><span className="brand-letter">L</span>yreah</Link>
        <Link href="/catalogue">← Retour au catalogue</Link>
      </nav>
      <article className="book-detail">
        <BookCover title={book.title} author={author} slug={book.slug} size="detail" />
        <div className="book-detail__copy">
          <p className="eyebrow">{book.categories.map((category) => category.name).join(" · ")}</p>
          <h1>{book.title}</h1>
          <p className="book-detail__author">{author}{book.publicationYear ? ` · ${book.publicationYear}` : ""}</p>
          <p className="book-detail__synopsis">{book.synopsis}</p>
          <div className="book-detail__actions">
            {isReady ? (
              <Link className="button button--primary" href={`/lire/${book.slug}`}>Commencer la lecture</Link>
            ) : (
              <span className="button button--disabled">Lecture bientôt disponible</span>
            )}
            <Link className="text-link" href="/bibliotheque">Ajouter à ma bibliothèque</Link>
          </div>
          <aside className="rights-note">
            <strong>Droits et provenance</strong>
            <p>{book.rightsStatement}</p>
            <a href={book.sourceUrl} target="_blank" rel="noreferrer">Consulter la source ↗</a>
          </aside>
        </div>
      </article>
    </main>
  );
}
