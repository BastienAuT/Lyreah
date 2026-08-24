import Link from "next/link";
import type { CatalogBook } from "@/catalog/queries";
import { formatBookLanguage } from "@/catalog/languages";
import { BookCover } from "./book-cover";

export function BookCard({
  book,
  eagerCover = false,
}: {
  book: CatalogBook;
  eagerCover?: boolean;
}) {
  const author = book.authors.map((item) => item.name).join(", ") || "Auteur inconnu";

  return (
    <article className="catalog-book-card">
      <Link href={`/livres/${book.slug}`} aria-label={`Découvrir ${book.title}`}>
        <BookCover
          title={book.title}
          author={author}
          slug={book.slug}
          eager={eagerCover}
        />
      </Link>
      <div className="catalog-book-card__meta">
        <p>
          {book.categories.map((category) => category.name).join(" · ") || "Classique"}
          {` · ${formatBookLanguage(book.language)}`}
        </p>
        <h2>
          <Link href={`/livres/${book.slug}`}>{book.title}</Link>
        </h2>
        <span>{author}</span>
      </div>
    </article>
  );
}
