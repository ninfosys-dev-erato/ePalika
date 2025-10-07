import type { TagProps } from "@carbon/react";
import type { ChalaniStatus } from "@egov/api-types";

export const statusToTag = (
  status: ChalaniStatus
): Omit<TagProps<"span">, "ref"> => {
  switch (status) {
    case "DRAFT":
      return { type: "cool-gray", children: "Draft" };
    case "PENDING_REVIEW":
      return { type: "cyan", children: "Under Review" };
    case "PENDING_APPROVAL":
      return { type: "teal", children: "Pending Approval" };
    case "APPROVED":
      return { type: "green", children: "Approved" };
    case "NUMBER_RESERVED":
      return { type: "blue", children: "Number Reserved" };
    case "REGISTERED":
      return { type: "blue", children: "Registered" };
    case "SIGNED":
      return { type: "purple", children: "Signed" };
    case "SEALED":
      return { type: "purple", children: "Sealed" };
    case "DISPATCHED":
      return { type: "purple", children: "Dispatched" };
    case "IN_TRANSIT":
      return { type: "magenta", children: "In Transit" };
    case "ACKNOWLEDGED":
      return { type: "teal", children: "Acknowledged" };
    case "DELIVERED":
      return { type: "gray", children: "Delivered" };
    case "RETURNED_UNDELIVERED":
      return { type: "red", children: "Returned Undelivered" };
    case "VOIDED":
      return { type: "red", children: "Voided" };
    case "SUPERSEDED":
      return { type: "warm-gray", children: "Superseded" };
    case "CLOSED":
      return { type: "cool-gray", children: "Closed" };
    default:
      return { type: "warm-gray", children: status };
  }
};
