import { z } from "zod";

const safeAudioFile = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .refine(
    (file) =>
      !file.startsWith("/") &&
      !file.includes("\\") &&
      !file.split("/").some((segment) => !segment || segment === "." || segment === ".."),
    "Le chemin du fichier audio est invalide.",
  )
  .refine(
    (file) => /\.(mp3|m4a|ogg|wav)$/i.test(file),
    "Le format du fichier audio n’est pas pris en charge.",
  );

export const soundscapeManifestSchema = z
  .object({
    version: z.literal(1),
    visualEffect: z
      .enum(["none", "fireflies", "rain", "mist", "breeze"])
      .default("none"),
    layers: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(50),
          title: z.string().trim().min(1).max(100),
          file: safeAudioFile,
          volume: z.number().min(0).max(1).default(1),
        }),
      )
      .min(1)
      .max(8),
  })
  .superRefine((manifest, context) => {
    const ids = manifest.layers.map((layer) => layer.id);

    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: "custom",
        message: "Chaque couche audio doit avoir un identifiant unique.",
        path: ["layers"],
      });
    }
  });

export type SoundscapeManifest = z.infer<typeof soundscapeManifestSchema>;

export function parseSoundscapeManifest(contents: string) {
  let manifest: unknown;

  try {
    manifest = JSON.parse(contents);
  } catch {
    throw new Error("Le manifeste de l’ambiance n’est pas un JSON valide.");
  }

  const result = soundscapeManifestSchema.safeParse(manifest);

  if (!result.success) {
    throw new Error("Le manifeste de l’ambiance est invalide.");
  }

  return result.data;
}
