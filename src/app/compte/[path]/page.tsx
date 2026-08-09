import { accountViewPaths } from "@neondatabase/auth-ui/server";
import Link from "next/link";
import { ensureCurrentProfile } from "@/auth/session";
import { AccountPanel } from "@/components/auth/account-panel";

export const dynamic = "force-dynamic";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(accountViewPaths).map((path) => ({ path }));
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const [{ path }] = await Promise.all([params, ensureCurrentProfile()]);

  return (
    <main className="account-shell">
      <div className="account-content">
        <Link className="brand-wordmark" href="/">
          <span className="brand-letter">L</span>yreah
        </Link>
        <h1 className="account-heading">Mon compte</h1>
        <AccountPanel path={path} />
      </div>
    </main>
  );
}
