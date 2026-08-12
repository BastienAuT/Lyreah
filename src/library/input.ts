import { z } from "zod";

const libraryBookIdSchema = z.string().uuid();

export function parseLibraryBookId(value: FormDataEntryValue | null) {
  return libraryBookIdSchema.parse(value);
}
