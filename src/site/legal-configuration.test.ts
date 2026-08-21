import { describe, expect, test } from "bun:test";
import {
  isLegalConfigurationComplete,
  parseLegalPublisherStatus,
  type LegalConfiguration,
} from "./legal-configuration";

const completeSharedConfiguration = {
  publisherName: "Nom public",
  publisherAddress: null,
  contactEmail: "contact@example.com",
  hostIdentityConfirmed: true,
  hostName: "Hébergeur",
  hostAddress: "Adresse de l’hébergeur",
  hostPhone: "+33 1 23 45 67 89",
  hostContact: "https://example.com/contact",
} satisfies Omit<LegalConfiguration, "publisherStatus">;

describe("legal configuration", () => {
  test("accepts the supported publisher statuses only", () => {
    expect(parseLegalPublisherStatus("individual-non-professional")).toBe(
      "individual-non-professional",
    );
    expect(parseLegalPublisherStatus("professional")).toBe("professional");
    expect(parseLegalPublisherStatus("unknown")).toBeNull();
    expect(parseLegalPublisherStatus(null)).toBeNull();
  });

  test("does not require a public home address for a non-professional individual", () => {
    expect(
      isLegalConfigurationComplete({
        ...completeSharedConfiguration,
        publisherStatus: "individual-non-professional",
      }),
    ).toBe(true);
  });

  test("requires confirmation that the host received the private identity details", () => {
    expect(
      isLegalConfigurationComplete({
        ...completeSharedConfiguration,
        publisherStatus: "individual-non-professional",
        hostIdentityConfirmed: false,
      }),
    ).toBe(false);
  });

  test("requires a public address for the professional mode", () => {
    expect(
      isLegalConfigurationComplete({
        ...completeSharedConfiguration,
        publisherStatus: "professional",
      }),
    ).toBe(false);
    expect(
      isLegalConfigurationComplete({
        ...completeSharedConfiguration,
        publisherStatus: "professional",
        publisherAddress: "1 rue de l’Exemple, Paris",
      }),
    ).toBe(true);
  });

  test("requires the host phone number", () => {
    expect(
      isLegalConfigurationComplete({
        ...completeSharedConfiguration,
        publisherStatus: "individual-non-professional",
        hostPhone: null,
      }),
    ).toBe(false);
  });
});
