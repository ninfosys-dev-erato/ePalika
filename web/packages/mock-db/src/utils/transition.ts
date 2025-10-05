/**
 * Transition guard map per entity.
 */
type ChalaniState =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REGISTERED"
  | "DISPATCHED"
  | "DELIVERED";

const chalaniTransitions: Record<ChalaniState, string[]> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["PENDING_APPROVAL", "DRAFT"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT"],
  APPROVED: ["REGISTERED"],
  REGISTERED: ["SIGNED", "SEALED", "DISPATCHED"],
  DISPATCHED: ["IN_TRANSIT", "DELIVERED", "RETURNED_UNDELIVERED"],
  DELIVERED: ["CLOSED"],
};

export function assertTransition(entity: string, from: ChalaniState, to: string) {
  const valid = chalaniTransitions[from] || [];
  if (!valid.includes(to)) {
    throw new Error(`BAD_TRANSITION: ${entity} cannot move from ${from} → ${to}`);
  }
}
