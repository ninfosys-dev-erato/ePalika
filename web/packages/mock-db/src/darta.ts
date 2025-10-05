import { mockDB } from "./db";
import { simulate } from "./utils/simulate";
import { uuid, nowISO } from "./utils";
import { dartaSeeds } from "./seeds/dartaSeeds";

mockDB.dartas ||= [...dartaSeeds];

export const dartaResolvers = {
  Query: {
    dartas: () => mockDB.dartas,
    darta: (_: any, { id }: { id: string }) =>
      mockDB.dartas.find((d: any) => d.id === id),
  },
  Mutation: {
    createDarta: async (_: any, { input }: any) =>
      simulate(() => {
        const newItem = {
          id: uuid(),
          ...input,
          status: "DRAFT",
          createdAt: nowISO(),
          updatedAt: nowISO(),
        };
        mockDB.dartas.push(newItem);
        return newItem;
      }),

    submitDartaForReview: async (_: any, { dartaId }: any) =>
      simulate(() => {
        const d = mockDB.dartas.find((x: any) => x.id === dartaId);
        if (!d) throw new Error("Not Found");
        d.status = "PENDING_REVIEW";
        d.updatedAt = nowISO();
        return d;
      }),
  },
};
