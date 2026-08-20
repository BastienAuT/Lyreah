import type { MetadataRoute } from "next";
import { getCatalogBooks } from "@/catalog/queries";
import { getSiteUrl } from "@/site/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const books = await getCatalogBooks().catch(() => []);
  const lastEditorialUpdate = new Date("2026-08-20T00:00:00.000Z");
  const page = (
    path: `/${string}` | "/",
    changeFrequency: "weekly" | "monthly" | "yearly",
    priority: number,
  ) => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: lastEditorialUpdate,
    changeFrequency,
    priority,
  });

  return [
    page("/", "weekly", 1),
    page("/catalogue", "weekly", 0.9),
    ...books.map((book) => ({
      url: new URL(`/livres/${book.slug}`, siteUrl).toString(),
      lastModified: book.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    page("/politique-de-confidentialite", "yearly", 0.2),
    page("/mentions-legales", "yearly", 0.2),
  ];
}
