import { expect, test } from "@playwright/test";

test("inscription par e-mail", async ({ page }) => {
  const emailTemplate = process.env.E2E_SIGNUP_EMAIL;
  const password = process.env.E2E_SIGNUP_PASSWORD;
  test.skip(!emailTemplate || !password, "Identifiants d’inscription de recette absents");
  if (!emailTemplate!.includes("{timestamp}")) {
    throw new Error(
      "E2E_SIGNUP_EMAIL doit contenir {timestamp} afin de créer un compte unique.",
    );
  }

  const email = emailTemplate!.replace("{timestamp}", String(Date.now()));
  await page.goto("/auth/sign-up");
  await page.getByLabel("Pseudo", { exact: true }).fill("Lectrice Recette");
  await page.getByLabel("Adresse e-mail", { exact: true }).fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(password!);
  await page
    .getByRole("button", { name: "Créer mon compte", exact: true })
    .click();
  await expect(page).toHaveURL(/\/(auth\/email-otp|bibliotheque|compte)/, {
    timeout: 20_000,
  });
});
