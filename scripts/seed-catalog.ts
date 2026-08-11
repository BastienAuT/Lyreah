import { count, eq } from "drizzle-orm";
import { getDatabase } from "../src/db";
import { authors, books, booksToAuthors, booksToCategories, categories } from "../src/db/schema";

const seedBooks = [
  {
    slug: "frankenstein",
    title: "Frankenstein",
    synopsis: "Victor Frankenstein donne vie à une créature et découvre trop tard le poids de son ambition. Un récit gothique sur la solitude, la responsabilité et le désir d’être aimé.",
    publicationYear: 1818,
    language: "en",
    author: { name: "Mary Shelley", slug: "mary-shelley" },
    categories: ["Fantastique", "Science-fiction", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/84",
  },
  {
    slug: "alice-au-pays-des-merveilles",
    title: "Alice au pays des merveilles",
    synopsis: "En suivant un lapin blanc pressé, Alice bascule dans un monde où la logique se dérobe et où chaque rencontre devient une énigme délicieusement absurde.",
    publicationYear: 1865,
    language: "en",
    author: { name: "Lewis Carroll", slug: "lewis-carroll" },
    categories: ["Fantastique", "Jeunesse", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/11",
  },
  {
    slug: "tour-du-monde-en-80-jours",
    title: "Le Tour du monde en quatre-vingts jours",
    synopsis: "Phileas Fogg parie qu’il peut accomplir le tour du monde en quatre-vingts jours. Commence alors une course élégante et mouvementée contre le temps.",
    publicationYear: 1872,
    language: "fr",
    author: { name: "Jules Verne", slug: "jules-verne" },
    categories: ["Aventure", "Voyage", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/800",
  },
  {
    slug: "vingt-mille-lieues-sous-les-mers",
    title: "Vingt mille lieues sous les mers",
    synopsis: "Le professeur Aronnax embarque malgré lui à bord du Nautilus. Sous le commandement du mystérieux capitaine Nemo, il découvre les merveilles et les périls des profondeurs océaniques.",
    publicationYear: 1870,
    language: "fr",
    author: { name: "Jules Verne", slug: "jules-verne" },
    categories: ["Aventure", "Voyage", "Science-fiction", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/54873",
  },
  {
    slug: "voyage-au-centre-de-la-terre",
    title: "Voyage au centre de la Terre",
    synopsis: "Un professeur passionné, son neveu et leur guide s’enfoncent dans un volcan islandais. Leur expédition les conduit vers un monde souterrain aussi prodigieux que dangereux.",
    publicationYear: 1864,
    language: "fr",
    author: { name: "Jules Verne", slug: "jules-verne" },
    categories: ["Aventure", "Voyage", "Science-fiction", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/4791",
  },
  {
    slug: "la-machine-a-explorer-le-temps",
    title: "La Machine à explorer le temps",
    synopsis: "Un inventeur victorien voyage jusqu’à un avenir lointain où l’humanité s’est divisée entre les paisibles Éloïs et les inquiétants Morlocks.",
    publicationYear: 1895,
    language: "en",
    author: { name: "H. G. Wells", slug: "h-g-wells" },
    categories: ["Science-fiction"],
    sourceUrl: "https://www.gutenberg.org/ebooks/35",
  },
  {
    slug: "la-guerre-des-mondes",
    title: "La Guerre des mondes",
    synopsis: "Des cylindres venus de Mars s’écrasent en Angleterre. Face à une technologie écrasante, un témoin traverse un pays bouleversé et lutte pour retrouver les siens.",
    publicationYear: 1898,
    language: "en",
    author: { name: "H. G. Wells", slug: "h-g-wells" },
    categories: ["Science-fiction"],
    sourceUrl: "https://www.gutenberg.org/ebooks/36",
  },
  {
    slug: "dracula",
    title: "Dracula",
    synopsis: "Des journaux et des lettres racontent l’arrivée du comte Dracula en Angleterre, puis la traque menée par Van Helsing et ses compagnons contre cette présence nocturne.",
    publicationYear: 1897,
    language: "en",
    author: { name: "Bram Stoker", slug: "bram-stoker" },
    categories: ["Fantastique"],
    sourceUrl: "https://www.gutenberg.org/ebooks/345",
  },
  {
    slug: "peter-pan",
    title: "Peter Pan",
    synopsis: "Peter Pan entraîne Wendy et ses frères au Pays imaginaire, parmi les Enfants perdus, les fées et les pirates du capitaine Crochet.",
    publicationYear: 1911,
    language: "en",
    author: { name: "J. M. Barrie", slug: "j-m-barrie" },
    categories: ["Fantastique", "Jeunesse"],
    sourceUrl: "https://www.gutenberg.org/ebooks/16",
  },
  {
    slug: "le-magicien-d-oz",
    title: "Le Magicien d’Oz",
    synopsis: "Emportée par un cyclone, Dorothy suit la route de briques jaunes avec trois compagnons inoubliables pour demander au mystérieux magicien de les aider.",
    publicationYear: 1900,
    language: "en",
    author: { name: "L. Frank Baum", slug: "l-frank-baum" },
    categories: ["Fantastique", "Jeunesse", "Aventure"],
    sourceUrl: "https://www.gutenberg.org/ebooks/55",
  },
  {
    slug: "l-ile-au-tresor",
    title: "L’Île au trésor",
    synopsis: "Une carte au trésor entraîne le jeune Jim Hawkins en mer. À bord de l’Hispaniola, il doit déjouer les plans de Long John Silver et de son équipage de pirates.",
    publicationYear: 1883,
    language: "en",
    author: { name: "Robert Louis Stevenson", slug: "robert-louis-stevenson" },
    categories: ["Jeunesse", "Aventure", "Voyage"],
    sourceUrl: "https://www.gutenberg.org/ebooks/120",
  },
  {
    slug: "le-jardin-secret",
    title: "Le Jardin secret",
    synopsis: "Mary Lennox découvre un jardin abandonné dans le domaine de son oncle. En le faisant renaître avec ses nouveaux amis, elle transforme peu à peu leurs vies.",
    publicationYear: 1911,
    language: "en",
    author: { name: "Frances Hodgson Burnett", slug: "frances-hodgson-burnett" },
    categories: ["Jeunesse"],
    sourceUrl: "https://www.gutenberg.org/ebooks/17396",
  },
  {
    slug: "robinson-crusoe",
    title: "Robinson Crusoé",
    synopsis: "Seul survivant d’un naufrage, Robinson organise sa vie sur une île déserte. Les années de solitude mettent à l’épreuve son ingéniosité, ses convictions et son humanité.",
    publicationYear: 1719,
    language: "en",
    author: { name: "Daniel Defoe", slug: "daniel-defoe" },
    categories: ["Voyage"],
    sourceUrl: "https://www.gutenberg.org/ebooks/521",
  },
] as const;

const database = getDatabase();

for (const seedBook of seedBooks) {
  const [author] = await database
    .insert(authors)
    .values(seedBook.author)
    .onConflictDoUpdate({ target: authors.slug, set: { name: seedBook.author.name, updatedAt: new Date() } })
    .returning();

  const [book] = await database
    .insert(books)
    .values({
      slug: seedBook.slug,
      title: seedBook.title,
      synopsis: seedBook.synopsis,
      publicationYear: seedBook.publicationYear,
      language: seedBook.language,
      rightsStatus: "public_domain",
      rightsStatement: "Œuvre du domaine public. Source numérique : Project Gutenberg.",
      sourceUrl: seedBook.sourceUrl,
      isFeatured: true,
      processingStatus: "ready",
      publishedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: books.slug,
      set: {
        title: seedBook.title,
        synopsis: seedBook.synopsis,
        publicationYear: seedBook.publicationYear,
        language: seedBook.language,
        rightsStatus: "public_domain",
        rightsStatement: "Œuvre du domaine public. Source numérique : Project Gutenberg.",
        sourceUrl: seedBook.sourceUrl,
        isFeatured: true,
        processingStatus: "ready",
        updatedAt: new Date(),
      },
    })
    .returning();

  await database.insert(booksToAuthors).values({ bookId: book.id, authorId: author.id }).onConflictDoNothing();

  for (const categoryName of seedBook.categories) {
    const slug = categoryName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const [category] = await database
      .insert(categories)
      .values({ name: categoryName, slug })
      .onConflictDoUpdate({ target: categories.slug, set: { name: categoryName } })
      .returning();

    await database.insert(booksToCategories).values({ bookId: book.id, categoryId: category.id }).onConflictDoNothing();
  }
}

const seeded = await database.select({ title: books.title }).from(books).where(eq(books.isFeatured, true));
const categoryCounts = await database
  .select({ name: categories.name, books: count(booksToCategories.bookId) })
  .from(categories)
  .leftJoin(booksToCategories, eq(categories.id, booksToCategories.categoryId))
  .groupBy(categories.id)
  .orderBy(categories.name);

const incompleteCategories = categoryCounts.filter(({ books: total }) => total < 5);

if (incompleteCategories.length > 0) {
  throw new Error(
    `Catégories incomplètes : ${incompleteCategories.map(({ name, books: total }) => `${name} (${total})`).join(", ")}`,
  );
}

console.log(`✓ Catalogue initialisé avec ${seeded.length} livre(s)`);
console.table(categoryCounts);
