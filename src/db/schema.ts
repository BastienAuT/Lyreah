import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const bookProcessingStatus = pgEnum("book_processing_status", [
  "pending",
  "processing",
  "ready",
  "failed",
]);

export const libraryStatus = pgEnum("library_status", [
  "saved",
  "reading",
  "finished",
]);

export const userRole = pgEnum("user_role", ["reader", "admin"]);

export const bookRightsStatus = pgEnum("book_rights_status", [
  "public_domain",
  "licensed",
]);

// Neon Auth owns identities and sessions in the managed `neon_auth` schema.
// This table only stores Lyreah-specific user data and shares the auth user id.
export const profiles = pgTable(
  "profiles",
  {
    id: text("id").primaryKey(),
    displayName: text("display_name").notNull(),
    role: userRole("role").default("reader").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export const authors = pgTable(
  "authors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    biography: text("biography"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("authors_slug_idx").on(table.slug)],
);

export const publishers = pgTable(
  "publishers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [uniqueIndex("publishers_slug_idx").on(table.slug)],
);

export const books = pgTable(
  "books",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    synopsis: text("synopsis").notNull(),
    language: text("language").default("fr").notNull(),
    publicationYear: integer("publication_year"),
    rightsStatus: bookRightsStatus("rights_status").notNull(),
    rightsStatement: text("rights_statement").notNull(),
    sourceUrl: text("source_url").notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),
    publisherId: uuid("publisher_id").references(() => publishers.id, {
      onDelete: "set null",
    }),
    coverObjectKey: text("cover_object_key"),
    epubMasterObjectKey: text("epub_master_object_key"),
    epubRenditionPrefix: text("epub_rendition_prefix"),
    originalEpubFileName: text("original_epub_file_name"),
    epubFileSize: integer("epub_file_size"),
    processingStatus: bookProcessingStatus("processing_status")
      .default("pending")
      .notNull(),
    processingError: text("processing_error"),
    createdByProfileId: text("created_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("books_slug_idx").on(table.slug),
    index("books_status_idx").on(table.processingStatus),
    index("books_published_idx").on(table.publishedAt),
    index("books_featured_idx").on(table.isFeatured),
  ],
);

export const booksToAuthors = pgTable(
  "books_to_authors",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => authors.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.bookId, table.authorId] })],
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
  },
  (table) => [uniqueIndex("categories_slug_idx").on(table.slug)],
);

export const booksToCategories = pgTable(
  "books_to_categories",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.bookId, table.categoryId] })],
);

export const soundscapes = pgTable(
  "soundscapes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    manifestObjectKey: text("manifest_object_key").notNull(),
    attribution: text("attribution"),
    licenseName: text("license_name").notNull(),
    licenseSourceUrl: text("license_source_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("soundscapes_active_idx").on(table.isActive)],
);

export const booksToSoundscapes = pgTable(
  "books_to_soundscapes",
  {
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    soundscapeId: uuid("soundscape_id")
      .notNull()
      .references(() => soundscapes.id, { onDelete: "cascade" }),
    isDefault: boolean("is_default").default(false).notNull(),
  },
  (table) => [primaryKey({ columns: [table.bookId, table.soundscapeId] })],
);

export const libraryEntries = pgTable(
  "library_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    status: libraryStatus("status").default("saved").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("library_user_book_idx").on(table.userId, table.bookId),
    index("library_user_status_idx").on(table.userId, table.status),
  ],
);

export const readingProgress = pgTable(
  "reading_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    bookId: uuid("book_id")
      .notNull()
      .references(() => books.id, { onDelete: "cascade" }),
    cfi: text("cfi").notNull(),
    percentageBasisPoints: integer("percentage_basis_points").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("progress_user_book_idx").on(table.userId, table.bookId),
    index("progress_updated_at_idx").on(table.updatedAt),
  ],
);
