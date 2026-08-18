"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { authClient } from "@/auth/client";
import { frenchAuthLocalization } from "@/auth/localization";

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <NeonAuthUIProvider
      authClient={authClient}
      navigate={router.push}
      replace={router.replace}
      onSessionChange={() => router.refresh()}
      redirectTo="/bibliotheque"
      defaultTheme="light"
      account={{ basePath: "/compte" }}
      avatar
      localization={frenchAuthLocalization}
      Link={Link}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
