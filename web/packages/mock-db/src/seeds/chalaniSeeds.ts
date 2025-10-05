import { uuid, nowISO } from "../utils";
export const chalaniSeeds = [
  {
    id: uuid(),
    subject: "Sample Chalani – Draft",
    status: "DRAFT",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: uuid(),
    subject: "Chalani Pending Review",
    status: "PENDING_REVIEW",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
  {
    id: uuid(),
    subject: "Registered Chalani",
    status: "REGISTERED",
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];
