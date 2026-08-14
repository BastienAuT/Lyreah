export const VISUAL_EFFECTS = [
  "none",
  "fireflies",
  "rain",
  "mist",
  "breeze",
  "harbor",
  "underwater",
  "submarine",
  "storm",
] as const;

export type VisualEffect = (typeof VISUAL_EFFECTS)[number];

export function isVisualEffect(value: unknown): value is VisualEffect {
  return (
    typeof value === "string" &&
    (VISUAL_EFFECTS as readonly string[]).includes(value)
  );
}
