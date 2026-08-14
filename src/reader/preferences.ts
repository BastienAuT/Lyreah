export const READER_PREFERENCES_STORAGE_KEY = "lyreah.reader.preferences.v1";

export type ReaderTheme = "paper" | "sepia" | "night";
export type ReaderFont = "classic" | "elegant" | "accessible";

export type ReaderPreferences = {
  theme: ReaderTheme;
  font: ReaderFont;
  fontSize: number;
  lineHeight: number;
  texture: boolean;
};

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  theme: "paper",
  font: "classic",
  fontSize: 108,
  lineHeight: 1.8,
  texture: true,
};

const themes = new Set<ReaderTheme>(["paper", "sepia", "night"]);
const fonts = new Set<ReaderFont>(["classic", "elegant", "accessible"]);

function clamp(value: unknown, minimum: number, maximum: number, fallback: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(maximum, Math.max(minimum, value))
    : fallback;
}

export function parseReaderPreferences(value: string | null): ReaderPreferences {
  if (!value) return DEFAULT_READER_PREFERENCES;

  try {
    const parsed = JSON.parse(value) as Partial<ReaderPreferences>;

    return {
      theme:
        typeof parsed.theme === "string" && themes.has(parsed.theme as ReaderTheme)
          ? (parsed.theme as ReaderTheme)
          : DEFAULT_READER_PREFERENCES.theme,
      font:
        typeof parsed.font === "string" && fonts.has(parsed.font as ReaderFont)
          ? (parsed.font as ReaderFont)
          : DEFAULT_READER_PREFERENCES.font,
      fontSize: Math.round(
        clamp(parsed.fontSize, 88, 140, DEFAULT_READER_PREFERENCES.fontSize),
      ),
      lineHeight:
        Math.round(
          clamp(parsed.lineHeight, 1.5, 2.1, DEFAULT_READER_PREFERENCES.lineHeight) *
            10,
        ) / 10,
      texture:
        typeof parsed.texture === "boolean"
          ? parsed.texture
          : DEFAULT_READER_PREFERENCES.texture,
    };
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}
