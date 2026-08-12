export const catalogCoverPaths = {
  frankenstein: "/covers/frankenstein.jpg",
  "alice-au-pays-des-merveilles": "/covers/alice-au-pays-des-merveilles.jpg",
  "tour-du-monde-en-80-jours": "/covers/tour-du-monde-en-80-jours.jpg",
  "vingt-mille-lieues-sous-les-mers": "/covers/vingt-mille-lieues-sous-les-mers.jpg",
  "voyage-au-centre-de-la-terre": "/covers/voyage-au-centre-de-la-terre.jpg",
  "la-machine-a-explorer-le-temps": "/covers/la-machine-a-explorer-le-temps.jpg",
  "la-guerre-des-mondes": "/covers/la-guerre-des-mondes.jpg",
  dracula: "/covers/dracula.jpg",
  "peter-pan": "/covers/peter-pan.jpg",
  "le-magicien-d-oz": "/covers/le-magicien-d-oz.jpg",
  "l-ile-au-tresor": "/covers/l-ile-au-tresor.jpg",
  "le-jardin-secret": "/covers/le-jardin-secret.jpg",
  "robinson-crusoe": "/covers/robinson-crusoe.jpg",
} as const;

export function getCatalogCoverPath(slug: string) {
  return catalogCoverPaths[slug as keyof typeof catalogCoverPaths];
}
