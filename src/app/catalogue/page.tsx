import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getCatalogBooks, getCatalogCategories } from "@/catalog/queries";
import { BookCard } from "@/components/catalog/book-card";
import { createPublicPageMetadata } from "@/site/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Catalogue",
  description:
    "Découvrez les classiques français disponibles dans la liseuse immersive Lyreah.",
  path: "/catalogue",
});

type CatalogSearchParams = Promise<{
  q?: string | string[];
  categorie?: string | string[];
}>;

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function CatalogResults({ searchParams }: { searchParams: CatalogSearchParams }) {
  const params = await searchParams;
  const query = getSingleValue(params.q) ?? "";
  const activeCategory = getSingleValue(params.categorie);
  const [catalogBooks, catalogCategories] = await Promise.all([
    getCatalogBooks({ query, category: activeCategory }),
    getCatalogCategories(),
  ]);

  return (
    <>
      <form className="catalog-search" action="/catalogue">
        <label htmlFor="catalog-query">Rechercher un titre ou un univers</label>
        <div>
          <input id="catalog-query" name="q" type="search" defaultValue={query} placeholder="Frankenstein, aventure…" />
          <button type="submit">Rechercher</button>
        </div>
      </form>

      <nav className="catalog-filters" aria-label="Filtrer par catégorie">
        <Link className={!activeCategory ? "is-active" : undefined} href="/catalogue">Tous</Link>
        {catalogCategories.map((category) => (
          <Link
            className={activeCategory === category.slug ? "is-active" : undefined}
            href={`/catalogue?categorie=${category.slug}`}
            key={category.id}
          >
            {category.name}
          </Link>
        ))}
      </nav>

      {catalogBooks.length > 0 ? (
        <div className="catalog-grid">
          {catalogBooks.map((book) => <BookCard book={book} key={book.id} />)}
        </div>
      ) : (
        <div className="catalog-empty">
          <h2>Aucun livre trouvé</h2>
          <p>Essaie une autre recherche ou retire le filtre sélectionné.</p>
          <Link className="button button--primary" href="/catalogue">Voir tout le catalogue</Link>
        </div>
      )}
    </>
  );
}

export default function CatalogPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <Link className="brand-wordmark" href="/"><span className="brand-letter">L</span>yreah</Link>
        <div>
          <p className="eyebrow">La collection Lyreah</p>
          <h1>Choisissez votre prochaine histoire.</h1>
          <p>Des œuvres du domaine public, préparées pour une lecture calme et immersive.</p>
        </div>
      </header>
      <Suspense fallback={<div className="catalog-loading">La bibliothèque s’ouvre…</div>}>
        <CatalogResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
