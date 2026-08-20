import Link from "next/link";
import styles from "./site-footer.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.identity}>
          <Link className={styles.brand} href="/" aria-label="Lyreah, accueil">
            Lyreah
          </Link>
          <p>Des classiques, une liseuse confortable, l’immersion en option.</p>
        </div>
        <nav className={styles.links} aria-label="Informations du site">
          <Link href="/catalogue">Catalogue</Link>
          <Link href="/politique-de-confidentialite">
            Politique de confidentialité
          </Link>
          <Link href="/mentions-legales">Mentions légales</Link>
        </nav>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} Lyreah · Les œuvres proposées conservent
          leurs informations de droits et de provenance.
        </p>
      </div>
    </footer>
  );
}
