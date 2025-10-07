/**
 * ============================================================================
 * 🧠 ePalika Mock DB — In-Memory Domain Simulation Layer
 * ============================================================================
 * Exports unified mock resolvers for use via Apollo SchemaLink.
 * ----------------------------------------------------------------------------
 * Structure:
 *   • seeds/         — realistic domain data per module
 *   • utils/         — helpers for ID, ISO dates, random, transitions
 *   • chalani.ts     — resolvers + transition guards
 *   • darta.ts       — resolvers + transition guards
 *   • identity.ts    — user/org mocks
 *   • numbering.ts   — counter ledger
 * ============================================================================
 */

import { ChalaniQuery, ChalaniMutation } from "./chalani";
import { dartaResolvers } from "./darta";
import { identityResolvers } from "./identity";
import { numberingResolvers } from "./numbering";

export const resolvers = {
  Query: {
    ...ChalaniQuery,
    ...dartaResolvers.Query,
    ...identityResolvers.Query,
    ...numberingResolvers.Query,
  },
  Mutation: {
    ...ChalaniMutation,
    ...dartaResolvers.Mutation,
    ...identityResolvers.Mutation,
    ...numberingResolvers.Mutation,
  },
};
