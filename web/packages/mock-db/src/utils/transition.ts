/**
 * Transition guard map per entity.
 */
import type { ChalaniStatus } from "@egov/api-types";

type ChalaniState = ChalaniStatus;

const chalaniTransitions: Partial<Record<ChalaniState, string[]>> = {
  DRAFT: ["PENDING_REVIEW"],
  PENDING_REVIEW: ["PENDING_APPROVAL", "DRAFT"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT"],
  APPROVED: ["NUMBER_RESERVED", "REGISTERED"],
  NUMBER_RESERVED: ["REGISTERED"],
  REGISTERED: ["SIGNED", "SEALED", "DISPATCHED"],
  SIGNED: ["SEALED", "DISPATCHED"],
  SEALED: ["DISPATCHED"],
  DISPATCHED: ["IN_TRANSIT", "ACKNOWLEDGED", "DELIVERED", "RETURNED_UNDELIVERED"],
  IN_TRANSIT: ["ACKNOWLEDGED", "DELIVERED", "RETURNED_UNDELIVERED"],
  ACKNOWLEDGED: ["DELIVERED"],
  DELIVERED: ["CLOSED"],
  RETURNED_UNDELIVERED: ["DISPATCHED"],
  VOIDED: [],
  SUPERSEDED: [],
  CLOSED: [],
};

export function assertTransition(entity: string, from: ChalaniStatus, to: ChalaniStatus) {
  const valid = chalaniTransitions[from] || [];
  if (!valid.includes(to)) {
    throw new Error(`BAD_TRANSITION: ${entity} cannot move from ${from} → ${to}`);
  }
}
