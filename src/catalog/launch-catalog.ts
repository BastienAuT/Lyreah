export type LaunchCatalogBook = {
  gutenbergId: number;
  language: "en" | "fr";
  slug: string;
  sourceUrl: string;
};

const gutenbergBook = (
  slug: string,
  gutenbergId: number,
  language: LaunchCatalogBook["language"],
): LaunchCatalogBook => ({
  gutenbergId,
  language,
  slug,
  sourceUrl: `https://www.gutenberg.org/ebooks/${gutenbergId}`,
});

export const launchCatalog = [
  gutenbergBook("frankenstein", 84, "en"),
  gutenbergBook("alice-au-pays-des-merveilles", 11, "en"),
  gutenbergBook("tour-du-monde-en-80-jours", 800, "fr"),
  gutenbergBook("vingt-mille-lieues-sous-les-mers", 54873, "fr"),
  gutenbergBook("voyage-au-centre-de-la-terre", 4791, "fr"),
  gutenbergBook("la-machine-a-explorer-le-temps", 35, "en"),
  gutenbergBook("la-guerre-des-mondes", 36, "en"),
  gutenbergBook("dracula", 345, "en"),
  gutenbergBook("peter-pan", 16, "en"),
  gutenbergBook("le-magicien-d-oz", 55, "en"),
  gutenbergBook("l-ile-au-tresor", 120, "en"),
  gutenbergBook("le-jardin-secret", 17396, "en"),
  gutenbergBook("robinson-crusoe", 521, "en"),
] as const satisfies readonly LaunchCatalogBook[];

export const GUTENBERG_RIGHTS_STATEMENT =
  "Œuvre du domaine public en France et aux États-Unis. Édition numérique et crédits de transcription : Project Gutenberg.";

export function gutenbergEpubUrl(gutenbergId: number) {
  return `https://www.gutenberg.org/ebooks/${gutenbergId}.epub3.images`;
}

export function gutenbergCompactEpubUrl(gutenbergId: number) {
  return `https://www.gutenberg.org/ebooks/${gutenbergId}.epub.noimages`;
}
