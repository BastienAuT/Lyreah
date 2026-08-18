export const catalogCoverPaths = {
  frankenstein: "/covers/frankenstein-fr.webp",
  "alice-au-pays-des-merveilles": "/covers/alice-au-pays-des-merveilles-fr.webp",
  "tour-du-monde-en-80-jours": "/covers/tour-du-monde-en-80-jours-fr.webp",
  "vingt-mille-lieues-sous-les-mers": "/covers/vingt-mille-lieues-sous-les-mers-fr.webp",
  "voyage-au-centre-de-la-terre": "/covers/voyage-au-centre-de-la-terre-fr.webp",
  "la-machine-a-explorer-le-temps": "/covers/la-machine-a-explorer-le-temps-fr.webp",
  "la-guerre-des-mondes": "/covers/la-guerre-des-mondes-fr.webp",
  "de-la-terre-a-la-lune": "/covers/de-la-terre-a-la-lune-fr.webp",
  "le-livre-de-la-jungle": "/covers/le-livre-de-la-jungle-fr.webp",
  "les-malheurs-de-sophie": "/covers/les-malheurs-de-sophie-fr.webp",
  "l-ile-au-tresor": "/covers/l-ile-au-tresor-fr.webp",
  "en-famille": "/covers/en-famille-fr.webp",
  "robinson-crusoe": "/covers/robinson-crusoe-fr.webp",
} as const;

export function getCatalogCoverPath(slug: string) {
  return catalogCoverPaths[slug as keyof typeof catalogCoverPaths];
}
