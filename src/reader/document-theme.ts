import type { ReaderPreferences, ReaderTheme } from "./preferences";

export const READER_DOCUMENT_THEME_STYLE_ID = "lyreah-reader-document-theme";

export const readerPalettes = {
  paper: {
    heading: "#332b31",
    link: "#665b82",
    page: "#f4eadb",
    text: "#30292d",
  },
  sepia: {
    heading: "#36271f",
    link: "#76563f",
    page: "#ead8b9",
    text: "#392d25",
  },
  night: {
    heading: "#f2e8dc",
    link: "#c2b5e0",
    page: "#211f27",
    text: "#e8dfd2",
  },
} as const satisfies Record<ReaderTheme, Record<string, string>>;

export const readerFontFamilies = {
  classic: "Georgia, 'Times New Roman', serif",
  elegant: "'Palatino Linotype', Palatino, 'Book Antiqua', serif",
  accessible: "Arial, Helvetica, sans-serif",
} as const;

const paperTexture =
  "radial-gradient(circle at 18% 24%, rgba(90,70,48,.025) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 62%, rgba(90,70,48,.02) 0 1px, transparent 1.5px)";

export function getReaderDocumentThemeCss(
  preferences: ReaderPreferences,
) {
  const palette = readerPalettes[preferences.theme];
  const texture = preferences.texture ? paperTexture : "none";
  const fontFamily = readerFontFamilies[preferences.font];

  return `
html {
  background-color: ${palette.page} !important;
  background-image: ${texture} !important;
  background-size: 17px 19px, 23px 29px !important;
  color: ${palette.text} !important;
  color-scheme: ${preferences.theme === "night" ? "dark" : "light"};
}
body {
  background-color: transparent !important;
  background-image: none !important;
  color: ${palette.text} !important;
  font-family: ${fontFamily} !important;
  font-size: ${preferences.fontSize}% !important;
  line-height: ${preferences.lineHeight} !important;
}
body p,
body li,
body blockquote,
body dd,
body dt {
  font-family: inherit !important;
  line-height: ${preferences.lineHeight} !important;
}
`;
}
