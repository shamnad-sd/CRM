export const CONTACT_SOURCES = [
  "Website",
  "Referral",
  "Cold Call",
  "Social Media",
  "Other",
] as const;

export type ContactSource = (typeof CONTACT_SOURCES)[number];

export const DEAL_STAGES = [
  "new",
  "contacted",
  "proposal",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  new: "New",
  contacted: "Contacted",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

export const ACTIVITY_TYPES = ["call", "email", "meeting", "note"] as const;

export type ActivityTypeConst = (typeof ACTIVITY_TYPES)[number];

export const ACTIVITY_TYPE_LABELS: Record<ActivityTypeConst, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
};
