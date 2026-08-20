import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { getCurrentUser } from "@/auth/session";

type AccountLinkProps = {
  className?: string;
};

function AccountLinkFallback({ className }: AccountLinkProps) {
  return (
    <Link className={className} href="/compte/settings">
      Mon compte
    </Link>
  );
}

async function ResolvedAccountLink({ className }: AccountLinkProps) {
  await connection();
  const user = await getCurrentUser();
  const accountLabel = user?.name?.trim() || "Mon compte";

  return (
    <Link
      aria-label={user ? `Ouvrir le compte de ${accountLabel}` : undefined}
      className={className}
      href={user ? "/compte/settings" : "/auth/sign-in"}
    >
      {user ? accountLabel : "Se connecter"}
    </Link>
  );
}

export function AccountLink(props: AccountLinkProps) {
  return (
    <Suspense fallback={<AccountLinkFallback {...props} />}>
      <ResolvedAccountLink {...props} />
    </Suspense>
  );
}
