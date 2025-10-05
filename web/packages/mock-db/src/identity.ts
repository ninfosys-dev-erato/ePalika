import { mockDB } from "./db";
import { uuid } from "./utils/id";

mockDB.users ||= [
  { id: uuid(), username: "admin", status: "ACTIVE", email: "admin@palika.gov.np" },
];
mockDB.orgUnits ||= [
  { id: uuid(), name: "Chandannath Municipality", type: "PALIKA" },
];

export const identityResolvers = {
  Query: {
    me: () => mockDB.users[0],
    users: () => mockDB.users,
    orgUnits: () => mockDB.orgUnits,
  },
  Mutation: {},
};
