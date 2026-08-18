import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const path of ["/", "/catalogue", "/livres/frankenstein"]) {
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
  expect(motion.animationDuration).toBe("0.00001s");
  expect(motion.transitionDuration).toBe("0.00001s");
});
