import { expect, test } from "@playwright/test";
import { adminState, createMinimalEpub } from "./helpers";

test.use({ storageState: adminState });
test.skip(!adminState, "Session administrateur de recette absente");

test("import administrateur d’un EPUB valide", async ({ page }) => {
  const suffix = Date.now();
  await page.goto("/admin");
  await page.getByLabel("Titre").fill(`Recette E2E ${suffix}`);
  await page.getByLabel("Auteur").fill("Équipe Lyreah");
  await page.getByLabel("Catégories").fill("Recette");
  await page.getByLabel("Synopsis").fill("Livre temporaire créé automatiquement pour valider le parcours administrateur.");
  await page.getByLabel("Source officielle").fill("https://www.gutenberg.org/");
  await page.getByLabel("Justification des droits").fill("Fichier de recette original, sans contenu tiers.");
  await page.getByLabel("Fichier EPUB").setInputFiles({
    buffer: await createMinimalEpub(),
    mimeType: "application/epub+zip",
    name: `recette-e2e-${suffix}.epub`,
  });
  await page.getByRole("button", { name: "Importer le livre" }).click();
  await expect(page.getByText("Livre importé. Sa préparation EPUB a démarré.")).toBeVisible({
    timeout: 30_000,
  });
});
