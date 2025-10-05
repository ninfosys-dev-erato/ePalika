import { uuid, nowISO } from "../utils";
export const dartaSeeds = [
  {
    id: uuid(),
    subject: "Citizen Request Application",
    status: "DRAFT",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: uuid(),
    subject: "Pending Review Darta",
    status: "PENDING_REVIEW",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: uuid(),
    subject: "Registered Darta",
    status: "REGISTERED",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];
