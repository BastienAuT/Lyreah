import { describe, expect, test } from "bun:test";
import { parseSoundscapeManifest } from "./manifest";

describe("parseSoundscapeManifest", () => {
  test("accepts a layered audio ambience", () => {
    const manifest = parseSoundscapeManifest(
      JSON.stringify({
        version: 1,
        visualEffect: "rain",
        layers: [
          { id: "rain", title: "Pluie douce", file: "layers/rain.mp3", volume: 0.65 },
          { id: "leaves", title: "Feuillage", file: "leaves.ogg" },
        ],
      }),
    );

    expect(manifest.layers).toHaveLength(2);
    expect(manifest.layers[1]?.volume).toBe(1);
    expect(manifest.visualEffect).toBe("rain");
  });

  test("keeps existing manifests compatible without a visual effect", () => {
    const manifest = parseSoundscapeManifest(
      JSON.stringify({
        version: 1,
        layers: [{ id: "wind", title: "Vent", file: "wind.ogg" }],
      }),
    );

    expect(manifest.visualEffect).toBe("none");
  });

  test("accepts maritime effects and an intermittent sonar layer", () => {
    const manifest = parseSoundscapeManifest(
      JSON.stringify({
        version: 1,
        visualEffect: "submarine",
        layers: [
          { id: "engine", title: "Moteur", file: "engine.ogg", volume: 0.5 },
          {
            id: "sonar",
            title: "Sonar",
            file: "sonar.mp3",
            volume: 0.2,
            intervalSeconds: 24,
            startDelaySeconds: 7,
          },
        ],
      }),
    );

    expect(manifest.visualEffect).toBe("submarine");
    expect(manifest.layers[1]?.intervalSeconds).toBe(24);
  });

  test.each(["dawn", "fireplace", "shore", "train", "zombies", "lofi"] as const)(
    "accepts the %s illustrated scene",
    (visualEffect) => {
      const manifest = parseSoundscapeManifest(
        JSON.stringify({
          version: 1,
          visualEffect,
          layers: [{ id: "ambience", title: "Ambiance", file: "ambience.ogg" }],
        }),
      );

      expect(manifest.visualEffect).toBe(visualEffect);
    },
  );

  test("rejects a start delay without a repetition interval", () => {
    expect(() =>
      parseSoundscapeManifest(
        JSON.stringify({
          version: 1,
          visualEffect: "underwater",
          layers: [
            {
              id: "bubbles",
              title: "Bulles",
              file: "bubbles.ogg",
              startDelaySeconds: 5,
            },
          ],
        }),
      ),
    ).toThrow("Le manifeste de l’ambiance est invalide.");
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
