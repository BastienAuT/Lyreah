import { describe, expect, test } from "bun:test";
import { frenchAuthLocalization } from "./localization";

describe("frenchAuthLocalization", () => {
  test("traduit les deux espaces du compte et leurs actions principales", () => {
    expect(frenchAuthLocalization.ACCOUNT).toBe("Compte");
    expect(frenchAuthLocalization.SECURITY).toBe("Sécurité");
    expect(frenchAuthLocalization.SESSIONS).toBe("Appareils connectés");
    expect(frenchAuthLocalization.CHANGE_PASSWORD).toBe(
      "Modifier le mot de passe",
    );
    expect(frenchAuthLocalization.SAVE).toBe("Enregistrer");
  });
});
