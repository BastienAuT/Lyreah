const languageNames = new Intl.DisplayNames(["fr"], { type: "language" });

export function formatBookLanguage(language: string) {
  const name = languageNames.of(language) || language;
  return `Texte en ${name.toLocaleLowerCase("fr")}`;
}
