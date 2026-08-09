"use client";

import { AccountView } from "@neondatabase/auth-ui";

export function AccountPanel({ path }: { path: string }) {
  return <AccountView path={path} />;
}
