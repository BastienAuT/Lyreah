import Link from "next/link";

const books = [
  {
    title: "Frankenstein",
    author: "Mary Shelley",
    label: "Science-fiction gothique",
    className: "book-cover--sage",
    mark: "F",
  },
  {
    title: "Alice au pays des merveilles",
    author: "Lewis Carroll",
    label: "Conte fantastique",
    className: "book-cover--rose",
    mark: "A",
  },
  {
    title: "Le Tour du monde en 80 jours",
    author: "Jules Verne",
    label: "Aventure",
    className: "book-cover--gold",
    mark: "80",
  },
];

const categories = [
  "Fantastique",
  "Aventure",
  "Classiques",
  "Mystère",
  "Poésie",
  "Science-fiction",
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
            <a href="#catalogue">Découvrir</a>
            <Link href="/bibliotheque">Ma bibliothèque</Link>
            <a href="#ambiances">Ambiances</a>
          </nav>

          <div className="header-actions">
            <button className="search-button" type="button" aria-label="Rechercher">
              <span aria-hidden="true" />
            </button>
            <Link className="account-link" href="/auth/sign-in">
              Se connecter
            </Link>
          </div>
        </header>

        <div className="hero" id="top">
          <div className="hero-copy">
            <p className="eyebrow">Lire. Écouter. S’évader.</p>
            <h1>Chaque histoire mérite son atmosphère.</h1>
            <p className="hero-intro">
              Redécouvrez les grands classiques dans une expérience de lecture
              immersive, accompagnée d’ambiances sonores pensées pour chaque univers.
            </p>
            <div className="hero-actions">
              <a className="button button--primary" href="#catalogue">
                Explorer la bibliothèque
                <span aria-hidden="true">→</span>
              </a>
              <a className="text-link" href="#experience">
                Découvrir l’expérience
              </a>
            </div>

            <div className="hero-note">
              <span className="note-icon" aria-hidden="true">♪</span>
              <p>
                <strong>Lecture synchronisée</strong>
                Reprenez votre livre exactement là où vous l’avez laissé.
              </p>
            </div>
          </div>

          <div className="reader-scene" aria-label="Aperçu du lecteur Lyreah">
            <div className="orb orb--one" />
            <div className="orb orb--two" />
            <article className="reader-card">
              <div className="reader-topbar">
                <span>Chapitre VII</span>
                <span className="reader-progress">42%</span>
              </div>
              <div className="reader-page">
                <p className="drop-cap">
                  La lune éclairait à peine le sentier lorsque les arbres
                  commencèrent à murmurer autour de nous.
                </p>
                <p>
                  Je ralentis le pas. Dans le silence de la forêt, chaque souffle
                  semblait porter le souvenir d’une histoire oubliée.
                </p>
                <p>
                  Au loin, une lumière douce oscillait entre les branches, comme
                  une invitation à poursuivre notre voyage.
                </p>
              </div>
              <div className="reader-footer">
                <span>Aa</span>
                <span className="page-dots"><i /><i className="active" /><i /></span>
                <span>☾</span>
              </div>
            </article>

            <article className="sound-card" id="ambiances">
              <div className="sound-cover" aria-hidden="true">
                <span>♪</span>
              </div>
              <div className="sound-copy">
                <small>Ambiance en cours</small>
                <strong>Forêt enchantée</strong>
                <span>Pluie douce · Feuillage</span>
              </div>
              <button className="pause-button" type="button" aria-label="Mettre en pause">
                <i />
                <i />
              </button>
            </article>
          </div>
        </div>

        <div className="category-row" aria-label="Catégories de livres">
          {categories.map((category) => (
            <a href="#catalogue" key={category}>
              {category}
            </a>
          ))}
        </div>
      </section>

      <section className="catalogue-section" id="catalogue">
        <div className="section-heading">
          <div>
            <p className="eyebrow">La sélection Lyreah</p>
            <h2>Des classiques à vivre autrement</h2>
          </div>
          <a className="text-link" href="#tous-les-livres">
            Voir tous les livres <span aria-hidden="true">→</span>
          </a>
        </div>

        <div className="book-grid">
          {books.map((book) => (
            <article className="book-card" key={book.title}>
              <div className={`book-cover ${book.className}`}>
                <span className="book-mark">{book.mark}</span>
                <span className="book-title">{book.title}</span>
                <span className="book-author">{book.author}</span>
              </div>
              <p className="book-label">{book.label}</p>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="promise-section" id="experience">
        <p className="eyebrow">Une nouvelle manière de lire</p>
        <h2>Le livre reste au centre. L’atmosphère ouvre la porte.</h2>
        <div className="promise-grid">
          <article>
            <span>01</span>
            <h3>Une lecture à votre rythme</h3>
            <p>Typographie, thème et mise en page s’adaptent à votre confort.</p>
          </article>
          <article id="bibliotheque">
            <span>02</span>
            <h3>Votre progression préservée</h3>
            <p>Votre bibliothèque vous attend sur téléphone, tablette et ordinateur.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Une ambiance sur mesure</h3>
            <p>Associez chaque histoire à un paysage sonore discret et immersif.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
