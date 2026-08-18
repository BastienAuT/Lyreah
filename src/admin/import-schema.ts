import { z } from "zod";

export const MAX_EPUB_BYTES = 6 * 1024 * 1024;
export const MAX_COVER_BYTES = 4 * 1024 * 1024;

const uploadFileSchema = z.object({
  name: z.string().trim().min(1).max(180),
  size: z.number().int().positive(),
  type: z.string().max(120),
});

export const adminBookImportSchema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  authorName: z.string().trim().min(2).max(140),
  synopsis: z.string().trim().min(20).max(5000),
  language: z.literal("fr"),
  publicationYear: z.number().int().min(0).max(new Date().getFullYear()).nullable(),
  categories: z.array(z.string().trim().min(2).max(80)).min(1).max(8),
  rightsStatus: z.enum(["public_domain", "licensed"]),
  rightsStatement: z.string().trim().min(5).max(1000),
  sourceUrl: z.url().max(1000),
  epub: uploadFileSchema.extend({
    size: z.number().int().positive().max(MAX_EPUB_BYTES),
  }),
  cover: uploadFileSchema
    .extend({
      size: z.number().int().positive().max(MAX_COVER_BYTES),
    })
    .nullable(),
});

export type AdminBookImport = z.infer<typeof adminBookImportSchema>;

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isEpubFile(file: { name: string; type: string }) {
  return (
    file.name.toLowerCase().endsWith(".epub") &&
    ["application/epub+zip", "application/octet-stream", ""].includes(file.type)
  );
}

export function isCoverFile(file: { name: string; type: string }) {
  return (
    /\.(avif|jpe?g|png|webp)$/i.test(file.name) &&
    ["image/avif", "image/jpeg", "image/png", "image/webp"].includes(file.type)
  );
}
