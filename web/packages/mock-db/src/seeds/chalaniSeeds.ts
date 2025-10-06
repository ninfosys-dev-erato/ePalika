import { uuid, nowISO } from "../utils";

export const chalaniSeeds = [
  // 🟢 1. Draft
  {
    id: uuid(),
    chalaniNumber: null,
    formattedChalaniNumber: null,
    fiscalYear: "2081/82",
    scope: "MUNICIPALITY",
    ward: { id: "W-5", name: "Ward No. 5" },
    subject: "Land Ownership Certificate – Draft",
    body: "Draft of outgoing letter regarding land ownership certification.",
    templateId: null,
    attachments: [],
    linkedDarta: null,
    status: "DRAFT",
    requiredSignatories: [],
    approvals: [],
    isFullyApproved: false,
    dispatchChannel: null,
    recipient: {
      id: "R-001",
      type: "GOVERNMENT_OFFICE",
      name: "District Land Office",
      organization: "Land Revenue Department",
      email: "district.land@gov.np",
      phone: "9851000001",
      address: "Nepalgunj",
    },
    createdBy: { id: "U-CLERK", name: "Mock Clerk" },
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
    auditTrail: [
      {
        id: uuid(),
        action: "CREATE",
        from: null,
        to: "DRAFT",
        actor: "Mock Clerk",
        createdAt: nowISO(),
      },
    ],
    supersededById: null,
    supersedesId: null,
    allowedActions: ["SUBMIT"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🟡 2. Pending Review
  {
    id: uuid(),
    fiscalYear: "2081/82",
    scope: "MUNICIPALITY",
    ward: { id: "W-5", name: "Ward No. 5" },
    subject: "Infrastructure Plan – Review Pending",
    body: "Letter awaiting review for new infrastructure project.",
    status: "PENDING_REVIEW",
    attachments: [],
    recipient: {
      id: "R-002",
      type: "GOVERNMENT_OFFICE",
      name: "Municipal Engineering Division",
      organization: "Municipal Office",
      address: "Birendranagar",
    },
    createdBy: { id: "U-CLERK", name: "Mock Clerk" },
    auditTrail: [
      {
        id: uuid(),
        action: "SUBMIT",
        from: "DRAFT",
        to: "PENDING_REVIEW",
        actor: "Mock Clerk",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["EDIT_REQUIRED", "APPROVE_REVIEW"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🟠 3. Pending Approval
  {
    id: uuid(),
    fiscalYear: "2081/82",
    scope: "MUNICIPALITY",
    ward: { id: "W-2", name: "Ward No. 2" },
    subject: "Water Supply Proposal – Awaiting Approval",
    body: "Reviewed proposal awaiting CAO approval.",
    status: "PENDING_APPROVAL",
    recipient: {
      id: "R-003",
      type: "ORGANIZATION",
      name: "Water Board",
      address: "Kohalpur",
    },
    createdBy: { id: "U-REVIEWER", name: "Ward Secretary" },
    auditTrail: [
      {
        id: uuid(),
        action: "APPROVE_REVIEW",
        from: "PENDING_REVIEW",
        to: "PENDING_APPROVAL",
        actor: "Ward Secretary",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["APPROVE", "REJECT", "RESERVE_NO"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🔵 4. Number Reserved
  {
    id: uuid(),
    chalaniNumber: 45,
    formattedChalaniNumber: "45/2081-82",
    fiscalYear: "2081/82",
    scope: "MUNICIPALITY",
    subject: "Official Invitation – Number Reserved",
    status: "NUMBER_RESERVED",
    isFullyApproved: true,
    recipient: {
      id: "R-004",
      type: "CITIZEN",
      name: "Mr. Ramesh KC",
      address: "Kailali",
    },
    createdBy: { id: "U-APPROVER", name: "CAO" },
    auditTrail: [
      {
        id: uuid(),
        action: "RESERVE_NO",
        from: "PENDING_APPROVAL",
        to: "NUMBER_RESERVED",
        actor: "CAO",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["FINALIZE", "VOID"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🔵 5. Registered
  {
    id: uuid(),
    chalaniNumber: 56,
    formattedChalaniNumber: "56/2081-82",
    fiscalYear: "2081/82",
    scope: "MUNICIPALITY",
    subject: "Birth Certificate – Registered",
    body: "Official outgoing letter registered in ledger.",
    status: "REGISTERED",
    recipient: {
      id: "R-005",
      type: "CITIZEN",
      name: "Ms. Sita Thapa",
      address: "Surkhet",
    },
    createdBy: { id: "U-CLERK", name: "Clerk" },
    auditTrail: [
      {
        id: uuid(),
        action: "DIRECT_REGISTER",
        from: "PENDING_APPROVAL",
        to: "REGISTERED",
        actor: "CAO",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["SIGN", "VOID", "DISPATCH"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🟣 6. Signed
  {
    id: uuid(),
    subject: "Scholarship Approval – Signed",
    status: "SIGNED",
    recipient: {
      id: "R-006",
      type: "ORGANIZATION",
      name: "Education Office",
      address: "Nepalgunj",
    },
    createdBy: { id: "U-SIGNATORY", name: "Authorized Officer" },
    auditTrail: [
      {
        id: uuid(),
        action: "SIGN",
        from: "REGISTERED",
        to: "SIGNED",
        actor: "Authorized Officer",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["SEAL", "DISPATCH"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🟣 7. Sealed
  {
    id: uuid(),
    subject: "Audit Response – Sealed",
    status: "SEALED",
    recipient: {
      id: "R-007",
      type: "GOVERNMENT_OFFICE",
      name: "Audit Office",
      address: "Kathmandu",
    },
    createdBy: { id: "U-SIGNATORY", name: "Authorized Officer" },
    auditTrail: [
      {
        id: uuid(),
        action: "SEAL",
        from: "SIGNED",
        to: "SEALED",
        actor: "Authorized Officer",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["DISPATCH"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🟤 8. Dispatched
  {
    id: uuid(),
    subject: "Notice to Ministry – Dispatched",
    status: "DISPATCHED",
    dispatchChannel: "PHYSICAL",
    dispatchedAt: nowISO(),
    dispatchedBy: { id: "U-DISPATCH", name: "Dispatch Officer" },
    trackingId: "POST-00123",
    courierName: "Nepal Post",
    recipient: {
      id: "R-008",
      type: "GOVERNMENT_OFFICE",
      name: "Ministry of Federal Affairs",
      address: "Kathmandu",
    },
    auditTrail: [
      {
        id: uuid(),
        action: "DISPATCH",
        from: "SEALED",
        to: "DISPATCHED",
        actor: "Dispatch Officer",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["MARK_IN_TRANSIT", "ACKNOWLEDGE"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🟤 9. In Transit
  {
    id: uuid(),
    subject: "Citizen Charter – In Transit",
    status: "IN_TRANSIT",
    trackingId: "TRACK-998",
    courierName: "Nepal Post",
    recipient: {
      id: "R-009",
      type: "GOVERNMENT_OFFICE",
      name: "Ministry of Local Dev",
      address: "Kathmandu",
    },
    auditTrail: [
      {
        id: uuid(),
        action: "MARK_IN_TRANSIT",
        from: "DISPATCHED",
        to: "IN_TRANSIT",
        actor: "Dispatch Officer",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["DELIVER", "RETURN_UNDELIVERED"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // 🟤 10. Delivered
  {
    id: uuid(),
    subject: "Budget Circular – Delivered",
    status: "DELIVERED",
    deliveredAt: nowISO(),
    recipient: {
      id: "R-010",
      type: "GOVERNMENT_OFFICE",
      name: "Finance Division",
      address: "Kathmandu",
    },
    auditTrail: [
      {
        id: uuid(),
        action: "DELIVER",
        from: "IN_TRANSIT",
        to: "DELIVERED",
        actor: "Courier",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["ARCHIVE"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // ⚫ 11. Closed
  {
    id: uuid(),
    subject: "Archived Notice – Closed",
    status: "CLOSED",
    recipient: {
      id: "R-011",
      type: "CITIZEN",
      name: "Mr. Hari Prasad",
      address: "Nepalgunj",
    },
    auditTrail: [
      {
        id: uuid(),
        action: "ARCHIVE",
        from: "DELIVERED",
        to: "CLOSED",
        actor: "System",
        createdAt: nowISO(),
      },
    ],
    allowedActions: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // ⚫ 12. Voided
  {
    id: uuid(),
    subject: "Erroneous Entry – Voided",
    status: "VOIDED",
    recipient: {
      id: "R-012",
      type: "GOVERNMENT_OFFICE",
      name: "Office of the Auditor General",
      address: "Kathmandu",
    },
    auditTrail: [
      {
        id: uuid(),
        action: "VOID",
        from: "REGISTERED",
        to: "VOIDED",
        actor: "CAO",
        reason: "Wrong recipient",
        createdAt: nowISO(),
      },
    ],
    allowedActions: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // ⚫ 13. Superseded
  {
    id: uuid(),
    subject: "Policy Revision – Superseded",
    status: "SUPERSEDED",
    supersedesId: "some-old-id",
    recipient: {
      id: "R-013",
      type: "GOVERNMENT_OFFICE",
      name: "Policy Division",
      address: "Kathmandu",
    },
    auditTrail: [
      {
        id: uuid(),
        action: "SUPERSEDE",
        from: "REGISTERED",
        to: "SUPERSEDED",
        actor: "CAO",
        createdAt: nowISO(),
      },
    ],
    allowedActions: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },

  // ⚫ 14. Acknowledged
  {
    id: uuid(),
    subject: "Digital Chalani – Acknowledged",
    status: "ACKNOWLEDGED",
    isAcknowledged: true,
    acknowledgedAt: nowISO(),
    acknowledgedBy: "Digital Recipient",
    recipient: {
      id: "R-014",
      type: "GOVERNMENT_OFFICE",
      name: "e-Palika Portal",
      address: "Kathmandu",
    },
    auditTrail: [
      {
        id: uuid(),
        action: "DIGITAL_ACK",
        from: "DISPATCHED",
        to: "ACKNOWLEDGED",
        actor: "Recipient",
        createdAt: nowISO(),
      },
    ],
    allowedActions: ["CONFIRM_DELIVERY"],
    createdAt: nowISO(),
    updatedAt: nowISO(),
  },
];
