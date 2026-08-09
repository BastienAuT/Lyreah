import "server-only";

import { createNeonAuth } from "@neondatabase/auth/next/server";

function requireEnvironmentVariable(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export const auth = createNeonAuth({
  baseUrl: requireEnvironmentVariable("NEON_AUTH_BASE_URL"),
  cookies: {
    secret: requireEnvironmentVariable("NEON_AUTH_COOKIE_SECRET"),
    sessionDataTtl: 300,
    sameSite: "lax",
  },
});
