CREATE TYPE "public"."book_rights_status" AS ENUM('public_domain', 'licensed');--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "rights_status" "book_rights_status" NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "rights_statement" text NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "source_url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "books_published_idx" ON "books" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "books_featured_idx" ON "books" USING btree ("is_featured");