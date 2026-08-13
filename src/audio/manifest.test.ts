import { describe, expect, test } from "bun:test";
import { parseSoundscapeManifest } from "./manifest";

describe("parseSoundscapeManifest", () => {
  test("accepts a layered audio ambience", () => {
    const manifest = parseSoundscapeManifest(
      JSON.stringify({
        version: 1,
        layers: [
          { id: "rain", title: "Pluie douce", file: "layers/rain.mp3", volume: 0.65 },
          { id: "leaves", title: "Feuillage", file: "leaves.ogg" },
        ],
      }),
    );

    expect(manifest.layers).toHaveLength(2);
    expect(manifest.layers[1]?.volume).toBe(1);
  });

  test("rejects unsafe files and duplicate layer identifiers", () => {
    expect(() =>
      parseSoundscapeManifest(
        JSON.stringify({
          version: 1,
          layers: [
            { id: "forest", title: "Forêt", file: "../forest.mp3" },
            { id: "forest", title: "Vent", file: "wind.exe" },
          ],
        }),
      ),
    ).toThrow("Le manifeste de l’ambiance est invalide.");
  });

  test("rejects malformed JSON", () => {
    expect(() => parseSoundscapeManifest("not-json")).toThrow(
      "Le manifeste de l’ambiance n’est pas un JSON valide.",
    );
  });
});
