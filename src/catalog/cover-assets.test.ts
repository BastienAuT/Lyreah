import { describe, expect, test } from "bun:test";
import { catalogCoverPaths, getCatalogCoverPath } from "./cover-assets";

describe("catalogCoverPaths", () => {
  test("contains one unique local cover for each seeded book", () => {
    const paths = Object.values(catalogCoverPaths);

    expect(paths).toHaveLength(13);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((path) => path.startsWith("/covers/") && path.endsWith(".jpg"))).toBe(
      true,
    );
  });

  test("keeps the pastel fallback for unknown books", () => {
    expect(getCatalogCoverPath("livre-importe-plus-tard")).toBeUndefined();
  });
});
