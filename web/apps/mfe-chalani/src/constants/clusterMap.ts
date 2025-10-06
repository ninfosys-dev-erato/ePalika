export const ChalaniClusterMap = {
  DRAFT: "compose",
  PENDING_REVIEW: "review",
  PENDING_APPROVAL: "approval",
  APPROVED: "approval",
  NUMBER_RESERVED: "registry",
  REGISTERED: "registry",
  SIGNED: "signing",
  SEALED: "signing",
  DISPATCHED: "dispatch",
  IN_TRANSIT: "dispatch",
  RETURNED_UNDELIVERED: "dispatch",
  DELIVERED: "delivery",
  ACKNOWLEDGED: "delivery",
  CLOSED: "archive",
  SUPERSEDED: "archive",
  VOIDED: "archive",
} as const;

export type ChalaniClusterKey = keyof typeof ChalaniClusterMap;
