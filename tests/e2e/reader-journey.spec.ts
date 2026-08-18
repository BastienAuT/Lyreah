import { expect, test } from "@playwright/test";
import { expectReaderReady, readerState } from "./helpers";

test.use({ storageState: readerState });
test.skip(!readerState, "Session lecteur de recette absente");

test("ajout à la bibliothèque, lecture et reprise de progression", async ({ page }) => {
  await page.goto("/livres/frankenstein");
  const addButton = page.getByRole("button", { name: "Ajouter à ma bibliothèque" });
  if (await addButton.isVisible()) await addButton.click();

  await page.getByRole("link", { name: "Commencer la lecture" }).click();
  await expectReaderReady(page);
  await page.getByRole("button", { name: "Page suivante" }).click();
  const progress = page.getByRole("progressbar", { name: "Progression du livre" });
  await expect.poll(async () => Number(await progress.getAttribute("aria-valuenow"))).toBeGreaterThan(0);

  const saved = Number(await progress.getAttribute("aria-valuenow"));
  await page.reload();
  await expectReaderReady(page);
  await expect.poll(async () => Number(await progress.getAttribute("aria-valuenow"))).toBeGreaterThanOrEqual(saved);

  await page.goto("/bibliotheque");
  await expect(page.getByRole("heading", { name: "Frankenstein" })).toBeVisible();
  await expect(page.getByText(`${saved} %`)).toBeVisible();
});

test("sélection d’une ambiance et pause lors du passage en arrière-plan", async ({ page, context }) => {
  await page.goto("/lire/frankenstein");
  await expectReaderReady(page);
  await page.getByRole("button", { name: /Ambiance/ }).click();
  const choices = page.locator(".ambient-player__choices button");
  test.skip((await choices.count()) < 2, "Une seule ambiance est associée au livre");
  await choices.nth(1).click();
  await expect(choices.nth(1)).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Lancer l’ambiance" }).click();
  await expect(page.getByRole("button", { name: "Mettre l’ambiance en pause" })).toBeVisible();
  const background = await context.newPage();
  await background.goto("/");
  await expect(page.getByRole("button", { name: "Lancer l’ambiance" })).toBeVisible();
});
