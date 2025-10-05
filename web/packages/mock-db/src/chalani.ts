import { mockDB } from "./db";
import { simulate } from "./utils/simulate";
import { uuid, nowISO } from "./utils";
import { assertTransition } from "./utils/transition";
import { chalaniSeeds } from "./seeds/chalaniSeeds";

mockDB.chalanis ||= [...chalaniSeeds];

export const chalaniResolvers = {
  Query: {
    chalanis: () => mockDB.chalanis,
    chalani: (_: any, { id }: { id: string }) =>
      mockDB.chalanis.find((c: any) => c.id === id),
  },
  Mutation: {
    createChalani: async (_: any, { input }: any) =>
      simulate(() => {
        const newItem = {
          id: uuid(),
          ...input,
          status: "DRAFT",
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        mockDB.chalanis.push(newItem);
        return newItem;
      }),

    submitChalani: async (_: any, { chalaniId }: any) =>
      simulate(() => {
        const c = mockDB.chalanis.find((x: any) => x.id === chalaniId);
        assertTransition("Chalani", c.status, "PENDING_REVIEW");
        c.status = "PENDING_REVIEW";
        c.updatedAt = nowISO();
        return c;
      }),
  },
};
