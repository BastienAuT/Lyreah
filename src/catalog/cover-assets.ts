export const catalogCoverPaths = {
  "tour-du-monde-en-80-jours": "/covers/tour-du-monde-en-80-jours.jpg",
  "vingt-mille-lieues-sous-les-mers": "/covers/vingt-mille-lieues-sous-les-mers.jpg",
  "voyage-au-centre-de-la-terre": "/covers/voyage-au-centre-de-la-terre.jpg",
} as const;

export function getCatalogCoverPath(slug: string) {
  return catalogCoverPaths[slug as keyof typeof catalogCoverPaths];
}
