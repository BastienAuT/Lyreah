export type LaunchCatalogBook = {
  language: "fr";
  slug: string;
  source:
    | { provider: "gutenberg"; id: number }
    | { provider: "wikisource"; page: string };
  sourceUrl: string;
};

const gutenbergBook = (slug: string, id: number): LaunchCatalogBook => ({
  language: "fr",
  slug,
  source: { provider: "gutenberg", id },
  sourceUrl: `https://www.gutenberg.org/ebooks/${id}`,
});

const wikisourceBook = (slug: string, page: string): LaunchCatalogBook => ({
  language: "fr",
  slug,
  source: { provider: "wikisource", page },
  sourceUrl: `https://fr.wikisource.org/wiki/${encodeURIComponent(page).replaceAll("%2F", "/")}`,
});

export const launchCatalog = [
  wikisourceBook("frankenstein", "Frankenstein, ou le Prométhée moderne (trad. Saladin)"),
  gutenbergBook("alice-au-pays-des-merveilles", 55456),
  gutenbergBook("tour-du-monde-en-80-jours", 800),
  gutenbergBook("vingt-mille-lieues-sous-les-mers", 54873),
  gutenbergBook("voyage-au-centre-de-la-terre", 4791),
  wikisourceBook("la-machine-a-explorer-le-temps", "La Machine à explorer le temps"),
  wikisourceBook("la-guerre-des-mondes", "La Guerre des mondes"),
  gutenbergBook("de-la-terre-a-la-lune", 38674),
  gutenbergBook("le-livre-de-la-jungle", 54183),
  gutenbergBook("les-malheurs-de-sophie", 15058),
  gutenbergBook("l-ile-au-tresor", 76225),
  gutenbergBook("en-famille", 13793),
  gutenbergBook("robinson-crusoe", 57964),
] as const satisfies readonly LaunchCatalogBook[];

export const RETIRED_ENGLISH_BOOK_SLUGS = [
  "dracula", "peter-pan", "le-magicien-d-oz", "le-jardin-secret",
] as const;

export const FRENCH_PUBLIC_DOMAIN_RIGHTS_STATEMENT =
  "Œuvre ou traduction française du domaine public en France. Édition numérique libre, source et crédits conservés dans la fiche.";

export function gutenbergEpubUrl(gutenbergId: number) {
  return `https://www.gutenberg.org/ebooks/${gutenbergId}.epub3.images`;
}

export function gutenbergCompactEpubUrl(gutenbergId: number) {
  return `https://www.gutenberg.org/ebooks/${gutenbergId}.epub.noimages`;
}

export function wikisourceEpubUrl(page: string) {
  const query = new URLSearchParams({ format: "epub", lang: "fr", page });
  return `https://ws-export.wmcloud.org/?${query}`;
}
