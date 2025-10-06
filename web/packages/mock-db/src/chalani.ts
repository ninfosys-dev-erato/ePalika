// packages/mock-db/src/chalani.ts
// =============================================================================
// 🧩 Chalani Resolver — Mock GraphQL Implementation
// =============================================================================
// Provides lifecycle-accurate, audit-aware, type-safe mock resolvers for
// Chalani operations. Mirrors production behavior for local MFE development.
// -----------------------------------------------------------------------------

import { mockDB } from "./db";
import { simulate } from "./utils/simulate";
import { uuid, nowISO } from "./utils";
import { assertTransition } from "./utils/transition";
import type {
  Chalani,
  ChalaniStatus,
  CreateChalaniInput,
  ReviewChalaniInput,
  ApproveChalaniInput,
  ReserveChalaniNumberInput,
  FinalizeChalaniRegistrationInput,
  DirectRegisterChalaniInput,
  SignChalaniInput,
  SealChalaniInput,
  DispatchChalaniInput,
  MarkInTransitInput,
  AcknowledgeChalaniInput,
  MarkDeliveredInput,
  MarkReturnedUndeliveredInput,
  ResendChalaniInput,
  VoidChalaniInput,
  SupersedeChalaniInput,
  User,
  AuditEntry,
} from "@egov/api-types";

// GraphQL Resolver Types
type QueryResolvers = Record<string, any>;
type MutationResolvers = Record<string, any>;

// =============================================================================
// 🧠 Helper Utilities
// =============================================================================
const findChalani = (id: string): Chalani => {
  const c = mockDB.chalanis.find((x: Chalani) => x.id === id);
  if (!c) throw new Error(`Chalani ${id} not found`);
  return c;
};

const createMockUser = (username: string, fullName: string): User => ({
  __typename: "User",
  id: `U-${username.toUpperCase()}`,
  username,
  fullName,
  email: null,
  phone: null,
  roles: null,
  createdAt: null,
  updatedAt: null,
});

const recordAudit = (
  c: Chalani,
  action: string,
  from: ChalaniStatus | null,
  to: ChalaniStatus,
  actorName: string,
  reason?: string,
  metadata?: Record<string, any>
) => {
  const newEntry: AuditEntry = {
    __typename: "AuditEntry",
    id: uuid(),
    action,
    fromStatus: from,
    toStatus: to,
    actor: createMockUser(actorName.toLowerCase().replace(/\s+/g, "_"), actorName),
    entityType: "CHALANI",
    entityId: c.id,
    timestamp: nowISO(),
    reason: reason ?? null,
    metadata: metadata ?? null,
    ip: null,
    userAgent: null,
  };
  // Use type assertion to work around readonly array
  (c.auditTrail as AuditEntry[]).push(newEntry);
};

const patch = (c: Chalani, changes: Partial<Chalani>) =>
  Object.assign(c, changes, { updatedAt: nowISO() });

// =============================================================================
// 🧾 Query Resolvers
// =============================================================================
export const ChalaniQuery: QueryResolvers = {
  chalanis: async () => simulate(() => mockDB.chalanis),

  chalani: async (_parent: unknown, { id }: { id: string }) =>
    simulate(() => mockDB.chalanis.find((c: Chalani) => c.id === id) || null),

  myChalaniInbox: async () =>
    simulate(() => ({
      edges: mockDB.chalanis.map((c: Chalani) => ({
        cursor: c.id,
        node: c,
      })),
      pageInfo: { hasNextPage: false, endCursor: null },
    })),
};

// =============================================================================
// 🔄 Mutation Resolvers — Full Lifecycle Simulation
// =============================================================================
export const ChalaniMutation: MutationResolvers = {
  // ---------------------------------------------------------------------------
  // Phase 1 — Drafting + Review
  // ---------------------------------------------------------------------------
  createChalani: async (_p: unknown, { input }: { input: CreateChalaniInput }) =>
    simulate(() => {
      const now = nowISO();
      const newItem: Chalani = {
        __typename: "Chalani",
        id: uuid(),
        chalaniNumber: null,
        formattedChalaniNumber: null,
        fiscalYear: "2081/82",
        scope: input.scope,
        ward: input.wardId
          ? {
              __typename: "Ward",
              id: input.wardId,
              name: `Ward ${input.wardId}`,
              number: parseInt(input.wardId.replace(/\D/g, "")) || 1,
              localBodyId: "LOCAL-BODY-1",
              localBodyName: "Mock Local Body",
              districtId: null,
              provinceId: null,
              createdAt: null,
              updatedAt: null,
            }
          : null,
        subject: input.subject,
        body: input.body,
        templateId: input.templateId,
        attachments: [],
        linkedDarta: null,
        status: "DRAFT",
        requiredSignatories: [],
        approvals: [],
        isFullyApproved: false,
        dispatchChannel: null,
        recipient: {
          __typename: "Recipient",
          id: uuid(),
          name: input.recipient.name,
          address: input.recipient.address,
          email: input.recipient.email ?? null,
          phone: input.recipient.phone ?? null,
          organization: input.recipient.organization ?? null,
          type: input.recipient.type,
        },
        dispatchedAt: null,
        dispatchedBy: null,
        trackingId: null,
        courierName: null,
        isAcknowledged: false,
        acknowledgedAt: null,
        acknowledgedBy: null,
        acknowledgementProof: null,
        deliveredAt: null,
        deliveredProof: null,
        createdBy: createMockUser("clerk", "Mock Clerk"),
        createdAt: now,
        updatedAt: now,
        auditTrail: [],
        supersededById: null,
        supersedesId: null,
        allowedActions: ["SUBMIT"],
      };
      recordAudit(newItem, "CREATE", null, "DRAFT", "Clerk");
      mockDB.chalanis.push(newItem);
      return newItem;
    }),

  submitChalani: async (_p: unknown, { chalaniId }: { chalaniId: string }) =>
    simulate(() => {
      const c = findChalani(chalaniId);
      assertTransition("Chalani", c.status, "PENDING_REVIEW");
      recordAudit(c, "SUBMIT", c.status, "PENDING_REVIEW", "Clerk");
      return patch(c, { status: "PENDING_REVIEW" });
    }),

  reviewChalani: async (_p: unknown, { input }: { input: ReviewChalaniInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      const to =
        input.decision === "APPROVE_REVIEW" ? "PENDING_APPROVAL" : "DRAFT";
      assertTransition("Chalani", c.status, to);
      recordAudit(c, "REVIEW", c.status, to, "Reviewer", input.notes ?? undefined, {
        decision: input.decision,
      });
      return patch(c, { status: to });
    }),

  // ---------------------------------------------------------------------------
  // Phase 2 — Approval + Registration
  // ---------------------------------------------------------------------------
  approveChalani: async (_p: unknown, { input }: { input: ApproveChalaniInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      const to = input.decision === "APPROVE" ? "APPROVED" : "DRAFT";
      assertTransition("Chalani", c.status, to);
      recordAudit(c, "APPROVAL", c.status, to, "CAO", input.notes ?? undefined, {
        decision: input.decision,
      });
      return patch(c, { status: to });
    }),

  reserveChalaniNumber: async (
    _p: unknown,
    { input }: { input: ReserveChalaniNumberInput }
  ) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "NUMBER_RESERVED");
      recordAudit(c, "RESERVE_NO", c.status, "NUMBER_RESERVED", "CAO");
      return patch(c, {
        status: "NUMBER_RESERVED",
        chalaniNumber: Math.floor(Math.random() * 1000),
        formattedChalaniNumber: `CH-${Math.floor(
          Math.random() * 1000
        )}/2081-82`,
      });
    }),

  finalizeChalaniRegistration: async (
    _p: unknown,
    { input }: { input: FinalizeChalaniRegistrationInput }
  ) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "REGISTERED");
      recordAudit(c, "FINALIZE_REGISTRATION", c.status, "REGISTERED", "CAO");
      return patch(c, { status: "REGISTERED" });
    }),

  directRegisterChalani: async (
    _p: unknown,
    { input }: { input: DirectRegisterChalaniInput }
  ) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "REGISTERED");
      recordAudit(c, "DIRECT_REGISTER", c.status, "REGISTERED", "CAO");
      return patch(c, { status: "REGISTERED" });
    }),

  // ---------------------------------------------------------------------------
  // Phase 3 — Signing & Sealing
  // ---------------------------------------------------------------------------
  signChalani: async (_p: unknown, { input }: { input: SignChalaniInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "SIGNED");
      recordAudit(c, "SIGN", c.status, "SIGNED", "Signatory");
      return patch(c, { status: "SIGNED" });
    }),

  sealChalani: async (_p: unknown, { input }: { input: SealChalaniInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "SEALED");
      recordAudit(c, "SEAL", c.status, "SEALED", "Signatory");
      return patch(c, { status: "SEALED" });
    }),

  // ---------------------------------------------------------------------------
  // Phase 4 — Dispatch & Delivery
  // ---------------------------------------------------------------------------
  dispatchChalani: async (_p: unknown, { input }: { input: DispatchChalaniInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "DISPATCHED");
      recordAudit(c, "DISPATCH", c.status, "DISPATCHED", "Dispatch Officer");
      return patch(c, {
        status: "DISPATCHED",
        dispatchChannel: input.dispatchChannel,
        dispatchedAt: nowISO(),
        dispatchedBy: createMockUser("dispatch_officer", "Dispatch Officer"),
        trackingId:
          input.trackingId ?? `TRACK-${Math.random().toString(36).slice(2, 8)}`,
        courierName: input.courierName ?? "Nepal Post",
      });
    }),

  markChalaniInTransit: async (_p: unknown, { input }: { input: MarkInTransitInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "IN_TRANSIT");
      recordAudit(c, "MARK_IN_TRANSIT", c.status, "IN_TRANSIT", "Courier");
      return patch(c, {
        status: "IN_TRANSIT",
        trackingId: input.trackingId,
        courierName: input.courierName,
      });
    }),

  acknowledgeChalani: async (
    _p: unknown,
    { input }: { input: AcknowledgeChalaniInput }
  ) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "ACKNOWLEDGED");
      recordAudit(c, "DIGITAL_ACK", c.status, "ACKNOWLEDGED", "Recipient");
      return patch(c, {
        status: "ACKNOWLEDGED",
        isAcknowledged: true,
        acknowledgedAt: nowISO(),
        acknowledgedBy: input.acknowledgedBy,
      });
    }),

  markChalaniDelivered: async (_p: unknown, { input }: { input: MarkDeliveredInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "DELIVERED");
      recordAudit(c, "DELIVER", c.status, "DELIVERED", "Courier");
      return patch(c, { status: "DELIVERED", deliveredAt: nowISO() });
    }),

  markChalaniReturnedUndelivered: async (
    _p: unknown,
    { input }: { input: MarkReturnedUndeliveredInput }
  ) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "RETURNED_UNDELIVERED");
      recordAudit(
        c,
        "RETURN_UNDELIVERED",
        c.status,
        "RETURNED_UNDELIVERED",
        "Courier",
        input.reason
      );
      return patch(c, { status: "RETURNED_UNDELIVERED" });
    }),

  resendChalani: async (_p: unknown, { input }: { input: ResendChalaniInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      assertTransition("Chalani", c.status, "DISPATCHED");
      recordAudit(c, "RESEND", c.status, "DISPATCHED", "Dispatch Officer");
      return patch(c, {
        status: "DISPATCHED",
        dispatchedAt: nowISO(),
        trackingId:
          input.trackingId ?? `RE-${Math.random().toString(36).slice(2, 6)}`,
      });
    }),

  // ---------------------------------------------------------------------------
  // Phase 5 — Termination
  // ---------------------------------------------------------------------------
  voidChalani: async (_p: unknown, { input }: { input: VoidChalaniInput }) =>
    simulate(() => {
      const c = findChalani(input.chalaniId);
      recordAudit(c, "VOID", c.status, "VOIDED", "CAO", input.reason);
      return patch(c, { status: "VOIDED" });
    }),

  supersedeChalani: async (_p: unknown, { input }: { input: SupersedeChalaniInput }) =>
    simulate(() => {
      const target = findChalani(input.targetChalaniId);
      recordAudit(target, "SUPERSEDE", target.status, "SUPERSEDED", "CAO", input.reason);
      patch(target, { status: "SUPERSEDED" });

      const newItem: Chalani = {
        ...target,
        id: uuid(),
        status: "DRAFT",
        subject: input.newChalani.subject,
        body: input.newChalani.body,
        supersedesId: target.id,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        auditTrail: [],
      };
      recordAudit(newItem, "CREATE_SUPERSEDE", null, "DRAFT", "CAO", input.reason);
      mockDB.chalanis.push(newItem);
      return { old: target, new: newItem };
    }),

  closeChalani: async (_p: unknown, { chalaniId }: { chalaniId: string }) =>
    simulate(() => {
      const c = findChalani(chalaniId);
      assertTransition("Chalani", c.status, "CLOSED");
      recordAudit(c, "ARCHIVE", c.status, "CLOSED", "System");
      return patch(c, { status: "CLOSED" });
    }),
};
