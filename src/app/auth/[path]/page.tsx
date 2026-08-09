import { AuthView } from "@neondatabase/auth-ui";
import { authViewPaths } from "@neondatabase/auth-ui/server";
import Link from "next/link";

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.values(authViewPaths).map((path) => ({ path }));
}

export default async function AuthPage({
  params,
}: {
  params: Promise<{ path: string }>;
}) {
  const { path } = await params;

  return (
    <main className="auth-shell">
      <div className="auth-panel">
        <Link className="auth-brand brand-wordmark" href="/" aria-label="Lyreah, accueil">
          <span className="brand-letter">L</span>yreah
        </Link>
        <AuthView path={path} />
      </div>
    </main>
  );
}
