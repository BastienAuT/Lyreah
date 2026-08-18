import { catalogCoverPaths } from "./cover-assets";

const originalCoverCredit = {
  credit: "Illustration originale générée pour Lyreah avec OpenAI",
  license: "Création éditoriale Lyreah",
} as const;

export function getCatalogCoverCredit(slug: string) {
  return slug in catalogCoverPaths ? originalCoverCredit : undefined;
}
