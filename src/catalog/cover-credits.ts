const catalogCoverCredits = {
  "tour-du-monde-en-80-jours": {
    credit: "Couverture de l’édition numérique Project Gutenberg",
    license: "Illustration d’édition du domaine public",
    sourceUrl: "https://www.gutenberg.org/ebooks/800",
  },
  "vingt-mille-lieues-sous-les-mers": {
    credit: "Illustrations d’Alphonse de Neuville et Édouard Riou",
    license: "Domaine public",
    sourceUrl: "https://www.gutenberg.org/ebooks/54873",
  },
  "voyage-au-centre-de-la-terre": {
    credit: "Couverture de l’édition numérique Project Gutenberg",
    license: "Illustration d’édition du domaine public",
    sourceUrl: "https://www.gutenberg.org/ebooks/4791",
  },
} as const;

export function getCatalogCoverCredit(slug: string) {
  return catalogCoverCredits[slug as keyof typeof catalogCoverCredits];
}
