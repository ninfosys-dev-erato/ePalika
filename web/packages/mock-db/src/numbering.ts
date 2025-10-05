import { mockDB } from "./db";
import { uuid } from "./utils/id";

mockDB.counters ||= [
  { id: uuid(), type: "CHALANI", currentValue: 10 },
  { id: uuid(), type: "DARTA", currentValue: 25 },
];

export const numberingResolvers = {
  Query: {
    counters: () => mockDB.counters,
  },
  Mutation: {
    allocateNumber: (_: any, { input }: any) => {
      const counter = mockDB.counters.find((c: any) => c.type === input.type);
      if (!counter) throw new Error("Counter Not Found");
      counter.currentValue += 1;
      return {
        id: uuid(),
        number: counter.currentValue,
        formattedNumber: `${counter.currentValue}/${input.fiscalYear}`,
        type: input.type,
      };
    },
  },
};
