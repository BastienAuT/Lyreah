export const LEGAL_PUBLISHER_STATUSES = [
  "individual-non-professional",
  "professional",
] as const;

export type LegalPublisherStatus =
  (typeof LEGAL_PUBLISHER_STATUSES)[number];

export type LegalConfiguration = {
  publisherStatus: LegalPublisherStatus | null;
  publisherName: string | null;
  publisherAddress: string | null;
  contactEmail: string | null;
  hostIdentityConfirmed: boolean;
  hostName: string | null;
  hostAddress: string | null;
  hostPhone: string | null;
  hostContact: string | null;
};

export function parseLegalPublisherStatus(
  value: string | null,
): LegalPublisherStatus | null {
  return LEGAL_PUBLISHER_STATUSES.find((status) => status === value) ?? null;
}

export function isNonProfessionalIndividualPublisher(
  configuration: Pick<LegalConfiguration, "publisherStatus">,
) {
  return configuration.publisherStatus === "individual-non-professional";
}

export function isLegalConfigurationComplete(
  configuration: LegalConfiguration,
) {
  const commonFieldsAreComplete = Boolean(
    configuration.publisherStatus &&
      configuration.publisherName &&
      configuration.contactEmail &&
      configuration.hostName &&
      configuration.hostAddress &&
      configuration.hostPhone &&
      configuration.hostContact,
  );

  if (!commonFieldsAreComplete) return false;

  if (isNonProfessionalIndividualPublisher(configuration)) {
    return configuration.hostIdentityConfirmed;
  }

  return Boolean(configuration.publisherAddress);
}
