import { accountViewPaths } from "@neondatabase/auth-ui/server";
import Link from "next/link";
import { ensureCurrentProfile } from "@/auth/session";
import { ReaderPreferencesCard } from "@/components/account/reader-preferences-card";
import { AccountPanel } from "@/components/auth/account-panel";
import { parseReaderPreferences } from "@/reader/preferences";

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
  const [{ path }, { profile }] = await Promise.all([
    params,
    ensureCurrentProfile(),
  ]);
  const isSettings = path === accountViewPaths.SETTINGS;
  const preferences = parseReaderPreferences(
    JSON.stringify(profile.readerPreferences),
  );

  return (
    <main className="account-shell">
      <div className="account-content">
        <div className="account-page-header">
          <Link className="brand-wordmark" href="/">
            <span className="brand-letter">L</span>yreah
          </Link>
          <Link className="account-library-link" href="/bibliotheque">
            ← Ma bibliothèque
          </Link>
        </div>
        <p className="account-eyebrow">Votre espace personnel</p>
        <h1 className="account-heading">Mon compte</h1>
        <p className="account-intro">
          {isSettings
            ? "Personnalisez votre profil et votre expérience de lecture."
            : "Protégez votre compte et contrôlez les appareils qui y ont accès."}
        </p>
        <AccountPanel path={path} />
        {isSettings ? (
          <ReaderPreferencesCard initialPreferences={preferences} />
        ) : null}
      </div>
    </main>
  );
}
