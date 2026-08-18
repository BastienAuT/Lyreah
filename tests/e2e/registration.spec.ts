import { expect, test } from "@playwright/test";

test("inscription par e-mail", async ({ page }) => {
  const emailTemplate = process.env.E2E_SIGNUP_EMAIL;
  const password = process.env.E2E_SIGNUP_PASSWORD;
  test.skip(!emailTemplate || !password, "Identifiants d’inscription de recette absents");

  const email = emailTemplate!.replace("{timestamp}", String(Date.now()));
  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Lectrice Recette");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password!);
  await page.getByRole("button", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/(auth\/email-otp|bibliotheque|compte)/, {
    timeout: 20_000,
  });
});
