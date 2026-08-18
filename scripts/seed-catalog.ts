import { count, eq, inArray } from "drizzle-orm";
import { getDatabase } from "../src/db";
import {
  authors,
  books,
  booksToAuthors,
  booksToCategories,
  booksToSoundscapes,
  categories,
  soundscapes,
} from "../src/db/schema";
import {
  FRENCH_PUBLIC_DOMAIN_RIGHTS_STATEMENT,
  RETIRED_ENGLISH_BOOK_SLUGS,
} from "../src/catalog/launch-catalog";

const seedBooks = [
  {
    slug: "frankenstein",
    title: "Frankenstein",
    synopsis: "Victor Frankenstein donne vie à une créature et découvre trop tard le poids de son ambition. Un récit gothique sur la solitude, la responsabilité et le désir d’être aimé.",
    publicationYear: 1818,
    language: "fr",
    author: { name: "Mary Shelley", slug: "mary-shelley" },
    categories: ["Fantastique", "Science-fiction", "Classiques"],
    sourceUrl: "https://fr.wikisource.org/wiki/Frankenstein%2C%20ou%20le%20Prom%C3%A9th%C3%A9e%20moderne%20(trad.%20Saladin)",
  },
  {
    slug: "alice-au-pays-des-merveilles",
    title: "Alice au pays des merveilles",
    synopsis: "En suivant un lapin blanc pressé, Alice bascule dans un monde où la logique se dérobe et où chaque rencontre devient une énigme délicieusement absurde.",
    publicationYear: 1865,
    language: "fr",
    author: { name: "Lewis Carroll", slug: "lewis-carroll" },
    categories: ["Fantastique", "Jeunesse", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/55456",
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
    language: "fr",
    author: { name: "H. G. Wells", slug: "h-g-wells" },
    categories: ["Science-fiction"],
    sourceUrl: "https://fr.wikisource.org/wiki/La%20Machine%20%C3%A0%20explorer%20le%20temps",
  },
  {
    slug: "la-guerre-des-mondes",
    title: "La Guerre des mondes",
    synopsis: "Des cylindres venus de Mars s’écrasent en Angleterre. Face à une technologie écrasante, un témoin traverse un pays bouleversé et lutte pour retrouver les siens.",
    publicationYear: 1898,
    language: "fr",
    author: { name: "H. G. Wells", slug: "h-g-wells" },
    categories: ["Science-fiction"],
    sourceUrl: "https://fr.wikisource.org/wiki/La%20Guerre%20des%20mondes",
  },
  {
    slug: "de-la-terre-a-la-lune",
    title: "De la Terre à la Lune",
    synopsis: "Après la guerre de Sécession, les membres du Gun-Club imaginent d’envoyer un projectile vers la Lune. Leur projet démesuré devient une aventure scientifique et humaine fondatrice de la science-fiction.",
    publicationYear: 1865,
    language: "fr",
    author: { name: "Jules Verne", slug: "jules-verne" },
    categories: ["Science-fiction", "Aventure", "Voyage", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/38674",
  },
  {
    slug: "le-livre-de-la-jungle",
    title: "Le Livre de la jungle",
    synopsis: "Élevé par les loups, Mowgli apprend la loi de la jungle auprès de Baloo et Bagheera, tandis que le tigre Shere Khan menace son équilibre entre le monde animal et celui des hommes.",
    publicationYear: 1894,
    language: "fr",
    author: { name: "Rudyard Kipling", slug: "rudyard-kipling" },
    categories: ["Fantastique", "Jeunesse", "Aventure"],
    sourceUrl: "https://www.gutenberg.org/ebooks/54183",
  },
  {
    slug: "les-malheurs-de-sophie",
    title: "Les Malheurs de Sophie",
    synopsis: "Curieuse, vive et souvent imprudente, Sophie multiplie les expériences et les bêtises dans le château familial, apprenant peu à peu à mesurer les conséquences de ses élans.",
    publicationYear: 1858,
    language: "fr",
    author: { name: "Comtesse de Ségur", slug: "comtesse-de-segur" },
    categories: ["Jeunesse", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/15058",
  },
  {
    slug: "l-ile-au-tresor",
    title: "L’Île au trésor",
    synopsis: "Une carte au trésor entraîne le jeune Jim Hawkins en mer. À bord de l’Hispaniola, il doit déjouer les plans de Long John Silver et de son équipage de pirates.",
    publicationYear: 1883,
    language: "fr",
    author: { name: "Robert Louis Stevenson", slug: "robert-louis-stevenson" },
    categories: ["Jeunesse", "Aventure", "Voyage"],
    sourceUrl: "https://www.gutenberg.org/ebooks/76225",
  },
  {
    slug: "en-famille",
    title: "En famille",
    synopsis: "Orpheline et sans ressources, Perrine traverse seule la France pour retrouver sa famille. Son courage et son intelligence lui ouvrent peu à peu les portes d’un monde qui ignore encore son identité.",
    publicationYear: 1893,
    language: "fr",
    author: { name: "Hector Malot", slug: "hector-malot" },
    categories: ["Jeunesse", "Aventure", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/13793",
  },
  {
    slug: "robinson-crusoe",
    title: "Robinson Crusoé",
    synopsis: "Seul survivant d’un naufrage, Robinson organise sa vie sur une île déserte. Les années de solitude mettent à l’épreuve son ingéniosité, ses convictions et son humanité.",
    publicationYear: 1719,
    language: "fr",
    author: { name: "Daniel Defoe", slug: "daniel-defoe" },
    categories: ["Voyage"],
    sourceUrl: "https://www.gutenberg.org/ebooks/57964",
  },
] as const;

const testBookSlugs = ["la-nuit-des-lucioles", "les-sentiers-de-lyreah"] as const;

const defaultSoundscapeByBook = {
  frankenstein: "Orage gothique",
  "alice-au-pays-des-merveilles": "Clairière nocturne",
  "tour-du-monde-en-80-jours": "Train de nuit",
  "vingt-mille-lieues-sous-les-mers": "À bord du sous-marin",
  "voyage-au-centre-de-la-terre": "Feu de cheminée",
  "la-machine-a-explorer-le-temps": "Minuit studieux",
  "la-guerre-des-mondes": "Orage gothique",
  "de-la-terre-a-la-lune": "Minuit studieux",
  "le-livre-de-la-jungle": "Aube aux oiseaux",
  "les-malheurs-de-sophie": "Aube aux oiseaux",
  "l-ile-au-tresor": "Rive tranquille",
  "en-famille": "Feu de cheminée",
  "robinson-crusoe": "Rive tranquille",
} as const;

const database = getDatabase();

await database.delete(books).where(inArray(books.slug, [...testBookSlugs]));

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
      rightsStatement: FRENCH_PUBLIC_DOMAIN_RIGHTS_STATEMENT,
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
        rightsStatement: FRENCH_PUBLIC_DOMAIN_RIGHTS_STATEMENT,
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

await database
  .update(books)
  .set({ isFeatured: false, publishedAt: null, updatedAt: new Date() })
  .where(inArray(books.slug, [...RETIRED_ENGLISH_BOOK_SLUGS]));

const [launchBooks, activeSoundscapes] = await Promise.all([
  database
    .select({ id: books.id, slug: books.slug })
    .from(books)
    .where(inArray(books.slug, seedBooks.map((book) => book.slug))),
  database
    .select({ id: soundscapes.id, title: soundscapes.title })
    .from(soundscapes)
    .where(eq(soundscapes.isActive, true)),
]);

for (const book of launchBooks) {
  await database
    .update(booksToSoundscapes)
    .set({ isDefault: false })
    .where(eq(booksToSoundscapes.bookId, book.id));

  const defaultTitle =
    defaultSoundscapeByBook[book.slug as keyof typeof defaultSoundscapeByBook];

  for (const soundscape of activeSoundscapes) {
    const isDefault = soundscape.title === defaultTitle;
    await database
      .insert(booksToSoundscapes)
      .values({ bookId: book.id, soundscapeId: soundscape.id, isDefault })
      .onConflictDoUpdate({
        target: [booksToSoundscapes.bookId, booksToSoundscapes.soundscapeId],
        set: { isDefault },
      });
  }
}

const seeded = await database.select({ title: books.title }).from(books).where(eq(books.isFeatured, true));
const categoryCounts = await database
  .select({ name: categories.name, books: count(booksToCategories.bookId) })
  .from(categories)
  .leftJoin(booksToCategories, eq(categories.id, booksToCategories.categoryId))
  .groupBy(categories.id)
  .orderBy(categories.name);

const launchCategoryNames = new Set<string>(
  seedBooks.flatMap((book) => [...book.categories]),
);
const incompleteCategories = categoryCounts.filter(
  ({ books: total, name }) => launchCategoryNames.has(name) && total < 5,
);

if (incompleteCategories.length > 0) {
  throw new Error(
    `Catégories incomplètes : ${incompleteCategories.map(({ name, books: total }) => `${name} (${total})`).join(", ")}`,
  );
}

console.log(`✓ Catalogue initialisé avec ${seeded.length} livre(s)`);
console.table(categoryCounts);
