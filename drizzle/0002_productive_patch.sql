ALTER TABLE "books" ADD COLUMN "original_epub_file_name" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "epub_file_size" integer;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "processing_error" text;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "created_by_profile_id" text;--> statement-breakpoint
ALTER TABLE "books" ADD CONSTRAINT "books_created_by_profile_id_profiles_id_fk" FOREIGN KEY ("created_by_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;