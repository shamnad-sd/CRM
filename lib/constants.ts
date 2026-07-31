export const CONTACT_SOURCES = [
  "Website",
  "Referral",
  "Cold Call",
  "Social Media",
  "Other",
] as const;

export type ContactSource = (typeof CONTACT_SOURCES)[number];
