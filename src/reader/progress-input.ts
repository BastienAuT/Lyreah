import { z } from "zod";

export const readingProgressInputSchema = z.object({
  cfi: z
    .string()
    .trim()
    .min(1)
    .max(2_000)
    .refine((value) => value.startsWith("epubcfi("), "CFI EPUB invalide."),
  percentageBasisPoints: z.number().int().min(0).max(10_000),
});

export type ReadingProgressInput = z.infer<typeof readingProgressInputSchema>;

export function parseReadingProgressInput(value: unknown) {
  return readingProgressInputSchema.parse(value);
}
