import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureCurrentProfile } from "@/auth/session";
import { getCatalogBookBySlug } from "@/catalog/queries";
import { EpubReader } from "@/components/reader/epub-reader";
import { canReadBook } from "@/reader/access-rules";
import { parseReaderPreferences } from "@/reader/preferences";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const book = await getCatalogBookBySlug(slug);

  return book
    ? {
        title: `Lire ${book.title}`,
        robots: { index: false, follow: false },
      }
    : {};
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { profile } = await ensureCurrentProfile();
  const { slug } = await params;
  const book = await getCatalogBookBySlug(slug);

  if (!book || !canReadBook(book)) {
    notFound();
  }

  const author =
    book.authors.map((item) => item.name).join(", ") || "Auteur inconnu";

  return (
    <main className="reader-shell">
      <nav className="reader-shell__nav">
        <Link className="brand-wordmark" href="/">
          <span className="brand-letter">L</span>yreah
        </Link>
        <div className="reader-shell__book">
          <strong>{book.title}</strong>
          <span>{author}</span>
        </div>
        <Link href={`/livres/${book.slug}`}>
          <span aria-hidden="true">×</span> Quitter
        </Link>
      </nav>
      <EpubReader
        bookId={book.id}
        initialPreferences={parseReaderPreferences(
          JSON.stringify(profile.readerPreferences),
        )}
        title={book.title}
      />
    </main>
  );
}
