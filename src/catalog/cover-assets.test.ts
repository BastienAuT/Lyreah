import { describe, expect, test } from "bun:test";
import { catalogCoverPaths, getCatalogCoverPath } from "./cover-assets";

describe("catalogCoverPaths", () => {
  test("ne conserve que les couvertures françaises vérifiées", () => {
    const paths = Object.values(catalogCoverPaths);

    expect(paths).toHaveLength(13);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.startsWith("/covers/") && path.endsWith("-fr.webp"))).toBe(
      true,
    );
  });

  test("keeps the pastel fallback for unknown books", () => {
    expect(getCatalogCoverPath("livre-importe-plus-tard")).toBeUndefined();
    expect(getCatalogCoverPath("frankenstein")).toBe("/covers/frankenstein-fr.webp");
  });
});
