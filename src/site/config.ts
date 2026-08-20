import "server-only";

import {
  parseLegalPublisherStatus,
  type LegalConfiguration,
} from "./legal-configuration";

const DEVELOPMENT_SITE_URL = "http://localhost:3000";

function getOptionalPublicValue(name: string) {
  const value = process.env[name]?.trim();
  return value || null;
}

export function getSiteUrl() {
  const configuredUrl = getOptionalPublicValue("NEXT_PUBLIC_SITE_URL");

  if (!configuredUrl) return new URL(DEVELOPMENT_SITE_URL);

  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return new URL(DEVELOPMENT_SITE_URL);
    }

    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url;
  } catch {
    return new URL(DEVELOPMENT_SITE_URL);
  }
}

export function getLegalConfiguration(): LegalConfiguration {
  return {
    publisherStatus: parseLegalPublisherStatus(
      getOptionalPublicValue("NEXT_PUBLIC_LEGAL_PUBLISHER_STATUS"),
    ),
    publisherName: getOptionalPublicValue("NEXT_PUBLIC_LEGAL_PUBLISHER_NAME"),
    publisherAddress: getOptionalPublicValue(
      "NEXT_PUBLIC_LEGAL_PUBLISHER_ADDRESS",
    ),
    contactEmail: getOptionalPublicValue("NEXT_PUBLIC_LEGAL_CONTACT_EMAIL"),
    hostIdentityConfirmed:
      getOptionalPublicValue("NEXT_PUBLIC_LEGAL_HOST_IDENTITY_CONFIRMED") ===
      "true",
    hostName: getOptionalPublicValue("NEXT_PUBLIC_LEGAL_HOST_NAME"),
    hostAddress: getOptionalPublicValue("NEXT_PUBLIC_LEGAL_HOST_ADDRESS"),
    hostContact: getOptionalPublicValue("NEXT_PUBLIC_LEGAL_HOST_CONTACT"),
  };
}
