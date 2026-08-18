import Image from "next/image";
import Link from "next/link";
import { catalogCoverPaths } from "@/catalog/cover-assets";
import { ReaderPreviewCarousel } from "@/components/home/reader-preview-carousel";

const books = [
  {
    title: "Frankenstein",
    author: "Mary Shelley",
    label: "Fantastique gothique",
    slug: "frankenstein",
    cover: catalogCoverPaths.frankenstein,
  },
  {
    title: "Alice au pays des merveilles",
    author: "Lewis Carroll",
    label: "Merveilleux",
    slug: "alice-au-pays-des-merveilles",
    cover: catalogCoverPaths["alice-au-pays-des-merveilles"],
  },
  {
    title: "Vingt mille lieues sous les mers",
    author: "Jules Verne",
    label: "Science-fiction maritime",
    slug: "vingt-mille-lieues-sous-les-mers",
    cover: catalogCoverPaths["vingt-mille-lieues-sous-les-mers"],
  },
];

const categories = [
  { label: "Fantastique", slug: "fantastique" },
  { label: "Aventure", slug: "aventure" },
  { label: "Classiques", slug: "classiques" },
  { label: "Jeunesse", slug: "jeunesse" },
  { label: "Science-fiction", slug: "science-fiction" },
  { label: "Voyage", slug: "voyage" },
];

export default function Home() {
  return (
    <main>
      <section className="hero-shell">
        <header className="site-header" aria-label="Navigation principale">
          <a className="brand" href="#top" aria-label="Lyreah, accueil">
            <span className="brand-wordmark" aria-hidden="true">
              <span className="brand-letter">L</span>yreah
            </span>
          </a>

          <nav className="main-nav" aria-label="Rubriques">
            <Link href="/catalogue">Catalogue</Link>
            <Link href="/bibliotheque">Ma bibliothèque</Link>
            <a href="#experience">Le lecteur</a>
          </nav>

          <div className="header-actions">
            <Link className="search-button" href="/catalogue" aria-label="Rechercher un livre">
              <span aria-hidden="true" />
            </Link>
            <Link className="account-link" href="/auth/sign-in">
              Se connecter
            </Link>
          </div>
        </header>

        <div className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">13 classiques français · lecture immersive</p>
            <h1>Les grands classiques prennent vie.</h1>
            <p className="hero-intro">
              Lisez gratuitement les grands classiques en français dans une liseuse
              confortable, accompagnée d’ambiances sonores que vous gardez toujours
              sous votre contrôle.
            </p>
            <div className="hero-actions">
              <Link className="button button--primary" href="/catalogue">
                Choisir un livre
                <span aria-hidden="true">→</span>
              </Link>
              <a className="text-link" href="#experience">
                Découvrir l’expérience
              </a>
            </div>

            <div className="hero-facts" aria-label="Les avantages de Lyreah">
              <p><strong>11</strong><span>ambiances par livre</span></p>
              <p><strong>100 %</strong><span>en français</span></p>
              <p><strong>Libre</strong><span>domaine public</span></p>
            </div>
          </div>

          <div className="reader-scene" id="experience" aria-label="Aperçu du lecteur Lyreah">
            <div className="orb orb--one" />
            <div className="orb orb--two" />
            <ReaderPreviewCarousel />
          </div>
        </div>

        <nav className="category-row" aria-label="Catégories de livres">
          {categories.map((category) => (
            <Link href={`/catalogue?categorie=${category.slug}`} key={category.slug}>
              {category.label}
            </Link>
          ))}
        </nav>
      </section>

      <section className="catalogue-section" id="catalogue">
        <div className="section-heading">
          <div>
            <p className="eyebrow">La sélection Lyreah</p>
            <h2>Trois univers pour commencer</h2>
          </div>
          <Link className="text-link" href="/catalogue">
            Voir les 13 livres <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="book-grid">
          {books.map((book) => (
            <article className="book-card" key={book.title}>
              <Link
                className="book-cover book-cover--real"
                href={`/livres/${book.slug}`}
                aria-label={`Découvrir ${book.title}`}
              >
                <Image
                  className="book-cover__image"
                  src={book.cover}
                  alt={`Couverture de ${book.title}`}
                  fill
                  sizes="(max-width: 760px) 360px, (max-width: 1180px) 30vw, 340px"
                />
              </Link>
              <p className="book-label">{book.label}</p>
              <h3><Link href={`/livres/${book.slug}`}>{book.title}</Link></h3>
              <p>{book.author}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="promise-section">
        <p className="eyebrow">Le livre reste au centre</p>
        <h2>Une liseuse conçue pour disparaître derrière l’histoire.</h2>
        <div className="promise-grid">
          <article>
            <span>01</span>
            <h3>Votre confort, vraiment</h3>
            <p>Taille, interlignage, police, thème et texture s’adaptent sans perdre votre page.</p>
          </article>
          <article id="bibliotheque">
            <span>02</span>
            <h3>Votre progression préservée</h3>
            <p>Reprenez exactement où vous vous êtes arrêté, sur téléphone comme sur ordinateur.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Le son reste facultatif</h3>
            <p>Choisissez parmi onze ambiances, réglez leur intensité ou lisez dans le silence.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
