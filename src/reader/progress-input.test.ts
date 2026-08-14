import { describe, expect, test } from "bun:test";
import { parseReadingProgressInput } from "./progress-input";

describe("parseReadingProgressInput", () => {
  test("accepts a valid EPUB position", () => {
    expect(
      parseReadingProgressInput({
        cfi: "epubcfi(/6/4!/4/2/2)",
        percentageBasisPoints: 4_250,
      }),
    ).toEqual({
      cfi: "epubcfi(/6/4!/4/2/2)",
      percentageBasisPoints: 4_250,
    });
  });

  test("rejects malformed positions and percentages", () => {
    expect(() =>
      parseReadingProgressInput({ cfi: "/chapter/2", percentageBasisPoints: 50 }),
    ).toThrow();
    expect(() =>
      parseReadingProgressInput({
        cfi: "epubcfi(/6/4!/4/2/2)",
        percentageBasisPoints: 10_001,
      }),
    ).toThrow();
  });
});
