import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of [
  "/",
  "/catalogue",
  "/livres/frankenstein",
  "/politique-de-confidentialite",
  "/mentions-legales",
]) {
  test(`${path} ne présente pas de violation axe critique`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator("main")).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test("la navigation publique est utilisable au clavier", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus-visible");
  await expect(focused).toBeVisible();
  await expect(focused).not.toHaveCSS("outline-style", "none");

  await page.goto("/catalogue");
  const search = page.getByRole("searchbox", {
    name: "Rechercher un titre ou un univers",
  });
  await search.focus();
  await expect(search).toHaveCSS("outline-style", "solid");
});

test("les couvertures de la sélection se chargent sur petit écran", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const covers = page.locator(".book-grid img");
  await expect(covers).toHaveCount(3);

  for (let index = 0; index < (await covers.count()); index += 1) {
    const cover = covers.nth(index);
    await cover.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        cover.evaluate(
          (node) =>
            node instanceof HTMLImageElement &&
            node.complete &&
            node.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
});

test("les informations de publication sont exposées aux moteurs et aux visiteurs", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const canonical = await page
    .locator('link[rel="canonical"]')
    .getAttribute("href");
  expect(canonical).not.toBeNull();
  expect(new URL(canonical!).pathname).toBe("/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    /Lyreah/,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(
    page.getByRole("link", { name: "Politique de confidentialité" }),
  ).toHaveAttribute("href", "/politique-de-confidentialite");

  const robots = await request.get("/robots.txt");
  expect(robots.ok()).toBe(true);
  await expect(robots.text()).resolves.toContain("Disallow: /admin");

  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBe(true);
  await expect(sitemap.text()).resolves.toContain(
    "/politique-de-confidentialite",
  );
});

test("prefers-reduced-motion neutralise les animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const motion = await page.locator("body").evaluate(() => {
    const probe = document.createElement("span");
    probe.className = "hero-ornament";
    document.body.append(probe);
    const style = getComputedStyle(probe);
    const result = {
      animationDuration: style.animationDuration,
      transitionDuration: style.transitionDuration,
    };
    probe.remove();
    return result;
  });
  expect(Number.parseFloat(motion.animationDuration)).toBeLessThanOrEqual(0.00001);
  expect(Number.parseFloat(motion.transitionDuration)).toBeLessThanOrEqual(
    0.00001,
  );
});
