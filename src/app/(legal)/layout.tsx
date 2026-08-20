import Link from "next/link";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site/site-footer";
import styles from "./legal.module.css";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className={styles.shell}>
        <header className={styles.topbar}>
          <Link className={styles.brand} href="/" aria-label="Lyreah, accueil">
            Lyreah
          </Link>
          <Link className={styles.backLink} href="/">
            ← Retour à Lyreah
          </Link>
        </header>
        <main className={styles.main}>{children}</main>
      </div>
      <SiteFooter />
    </>
  );
}
