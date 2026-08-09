import { eq } from "drizzle-orm";
import { getDatabase } from "../src/db";
import { authors, books, booksToAuthors, booksToCategories, categories } from "../src/db/schema";

const seedBooks = [
  {
    slug: "frankenstein",
    title: "Frankenstein",
    synopsis: "Victor Frankenstein donne vie à une créature et découvre trop tard le poids de son ambition. Un récit gothique sur la solitude, la responsabilité et le désir d’être aimé.",
    publicationYear: 1818,
    author: { name: "Mary Shelley", slug: "mary-shelley" },
    categories: ["Fantastique", "Science-fiction", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/84",
  },
  {
    slug: "alice-au-pays-des-merveilles",
    title: "Alice au pays des merveilles",
    synopsis: "En suivant un lapin blanc pressé, Alice bascule dans un monde où la logique se dérobe et où chaque rencontre devient une énigme délicieusement absurde.",
    publicationYear: 1865,
    author: { name: "Lewis Carroll", slug: "lewis-carroll" },
    categories: ["Fantastique", "Jeunesse", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/11",
  },
  {
    slug: "tour-du-monde-en-80-jours",
    title: "Le Tour du monde en quatre-vingts jours",
    synopsis: "Phileas Fogg parie qu’il peut accomplir le tour du monde en quatre-vingts jours. Commence alors une course élégante et mouvementée contre le temps.",
    publicationYear: 1872,
    author: { name: "Jules Verne", slug: "jules-verne" },
    categories: ["Aventure", "Voyage", "Classiques"],
    sourceUrl: "https://www.gutenberg.org/ebooks/103",
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
      language: "fr",
      rightsStatus: "public_domain",
      rightsStatement: "Œuvre du domaine public. Source numérique : Project Gutenberg.",
      sourceUrl: seedBook.sourceUrl,
      isFeatured: true,
      publishedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: books.slug,
      set: {
        title: seedBook.title,
        synopsis: seedBook.synopsis,
        sourceUrl: seedBook.sourceUrl,
        isFeatured: true,
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
console.log(`✓ Catalogue initialisé avec ${seeded.length} livre(s)`);
