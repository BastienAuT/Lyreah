import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3000";
const vercelProtectionBypass =
  process.env.E2E_VERCEL_PROTECTION_BYPASS?.trim();
const responsiveSmokeTests = [
  "**/public-accessibility.spec.ts",
  "**/reader-responsive.spec.ts",
];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL,
    extraHTTPHeaders: vercelProtectionBypass
      ? { "x-vercel-protection-bypass": vercelProtectionBypass }
      : undefined,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-webkit",
      testMatch: responsiveSmokeTests,
      use: { ...devices["iPhone 13"] },
    },
    {
      name: "tablet-webkit",
      testMatch: responsiveSmokeTests,
      use: { ...devices["iPad Pro 11"] },
    },
    {
      name: "tablet-landscape-webkit",
      testMatch: responsiveSmokeTests,
      use: { ...devices["iPad Pro 11 landscape"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "bun run dev -- --hostname 127.0.0.1",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: baseURL,
      },
});
