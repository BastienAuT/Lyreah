import { z } from "zod";

export const MAX_SOUNDSCAPE_LAYERS = 6;
export const MAX_AUDIO_FILE_BYTES = 40 * 1024 * 1024;

export const visualEffectSchema = z.enum([
  "none",
  "fireflies",
  "rain",
  "mist",
  "breeze",
]);

const optionalText = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .transform((value) => value || null);

const audioFileSchema = z.object({
  name: z.string().trim().min(1).max(180),
  size: z.number().int().positive().max(MAX_AUDIO_FILE_BYTES),
  type: z.string().trim().max(100),
});

const layerMetadataSchema = z.object({
  title: z.string().trim().min(1).max(100),
  volume: z.number().min(0).max(1),
});

export const prepareSoundscapeSchema = z.object({
  attribution: optionalText(240),
  bookId: z.uuid(),
  description: optionalText(600),
  files: z.array(audioFileSchema).min(1).max(MAX_SOUNDSCAPE_LAYERS),
  isDefault: z.boolean(),
  layers: z.array(layerMetadataSchema).min(1).max(MAX_SOUNDSCAPE_LAYERS),
  licenseName: z.string().trim().min(1).max(160),
  licenseSourceUrl: z.union([z.url().max(500), z.literal("")]).transform((value) => value || null),
  title: z.string().trim().min(2).max(180),
  visualEffect: visualEffectSchema,
}).refine((value) => value.files.length === value.layers.length, {
  message: "Chaque fichier doit correspondre à une couche audio.",
  path: ["layers"],
});

const preparedLayerSchema = layerMetadataSchema.extend({
  file: z.string().trim().min(1).max(240),
  id: z.string().regex(/^layer-[1-6]$/),
});

export const completeSoundscapeSchema = z.object({
  bookId: z.uuid(),
  isDefault: z.boolean(),
  layers: z.array(preparedLayerSchema).min(1).max(MAX_SOUNDSCAPE_LAYERS),
  visualEffect: visualEffectSchema,
});

export const updateSoundscapeSchema = z.object({
  attribution: optionalText(240),
  bookId: z.uuid(),
  description: optionalText(600),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  licenseName: z.string().trim().min(1).max(160),
  licenseSourceUrl: z.union([z.url().max(500), z.literal("")]).transform((value) => value || null),
  title: z.string().trim().min(2).max(180),
  visualEffect: visualEffectSchema,
});

export type PrepareSoundscapeInput = z.infer<typeof prepareSoundscapeSchema>;
export type CompleteSoundscapeInput = z.infer<typeof completeSoundscapeSchema>;
export type UpdateSoundscapeInput = z.infer<typeof updateSoundscapeSchema>;

export function isAudioFile(file: { name: string; size: number; type: string }) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const validExtension = ["mp3", "m4a", "ogg", "wav"].includes(extension || "");
  const validType = [
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/x-wav",
  ].includes(file.type.toLowerCase());

  return (
    validExtension &&
    validType &&
    file.size > 0 &&
    file.size <= MAX_AUDIO_FILE_BYTES
  );
}
