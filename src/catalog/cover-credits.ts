import { launchCatalog } from "./launch-catalog";

export const catalogCoverCredits = Object.fromEntries(
  launchCatalog.map((book) => [
    book.slug,
    {
      credit: "Couverture de l’édition numérique Project Gutenberg",
      license: "Illustration d’édition du domaine public",
      sourceUrl: book.sourceUrl,
    },
  ]),
) as Record<
  (typeof launchCatalog)[number]["slug"],
  { credit: string; license: string; sourceUrl: string }
>;

export function getCatalogCoverCredit(slug: string) {
  return catalogCoverCredits[slug as keyof typeof catalogCoverCredits];
}
