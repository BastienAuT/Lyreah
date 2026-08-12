import { describe, expect, test } from "bun:test";
import { parseLibraryBookId } from "./input";

describe("parseLibraryBookId", () => {
  test("accepts a book UUID", () => {
    expect(parseLibraryBookId("38e0d3fa-7c50-4f21-a9a4-26f09d39f84e")).toBe(
      "38e0d3fa-7c50-4f21-a9a4-26f09d39f84e",
    );
  });

  test("rejects missing and malformed identifiers", () => {
    expect(() => parseLibraryBookId(null)).toThrow();
    expect(() => parseLibraryBookId("not-a-book-id")).toThrow();
  });
});
