import { expect, test } from "@playwright/test";
import { expectReaderReady, readerState } from "./helpers";

test.use({ storageState: readerState });
test.skip(!readerState, "Session lecteur de recette absente");

test("la liseuse reste exploitable sur chaque format d’écran", async ({
  page,
}, testInfo) => {
  await page.route("**/api/reader/books/*/progress", async (route) => {
    if (route.request().method() === "PUT") {
      await route.fulfill({ status: 204 });
      return;
    }
    await route.continue();
  });
  await page.route("**/api/account/reader-preferences", async (route) => {
    if (route.request().method() === "PATCH") {
      await route.fulfill({ status: 204 });
      return;
    }
    await route.continue();
  });

  await page.goto("/lire/frankenstein");
  await expectReaderReady(page);

  await expect(page.locator(".epub-reader__viewer iframe")).toHaveAttribute(
    "title",
    "Contenu du livre « Frankenstein »",
  );
  await expect(page.locator(".epub-reader__progress-wrap > span")).toHaveText(
    /Page \d+ \/ \d+/,
    { timeout: 20_000 },
  );
  await expect(page.getByRole("button", { name: "Page précédente" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Page suivante" })).toBeVisible();

  const backdrop = page.locator(".ambient-backdrop");
  if (["mobile-webkit", "tablet-webkit"].includes(testInfo.project.name)) {
    await expect(backdrop).toHaveCount(0);
  } else {
    await expect(backdrop).toHaveCount(1);
  }
});
