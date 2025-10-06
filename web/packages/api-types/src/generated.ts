import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
export type MakeEmpty<
  T extends { [key: string]: unknown },
  K extends keyof T,
> = { [_ in K]?: never };
export type Incremental<T> =
  | T
  | {
      [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never;
    };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: string; output: string };
  FiscalYear: { input: string; output: string };
  JSON: { input: Record<string, any>; output: Record<string, any> };
  Upload: { input: File; output: File };
};

export type AcknowledgeChalaniInput = {
  readonly acknowledgedBy: InputMaybe<Scalars["String"]["input"]>;
  readonly acknowledgementProofId: InputMaybe<Scalars["ID"]["input"]>;
  readonly chalaniId: Scalars["ID"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
};

export type Address = {
  readonly __typename: "Address";
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly evidence: ReadonlyArray<AddressEvidence>;
  readonly geo: Maybe<GeoPoint>;
  readonly id: Scalars["ID"]["output"];
  readonly normalized: Maybe<Scalars["JSON"]["output"]>;
  readonly raw: Scalars["String"]["output"];
  readonly status: AddressStatus;
  readonly verifiedAt: Maybe<Scalars["DateTime"]["output"]>;
};

export type AddressEvidence = {
  readonly __typename: "AddressEvidence";
  readonly fileId: Scalars["ID"]["output"];
  readonly id: Scalars["ID"]["output"];
  readonly kind: Scalars["String"]["output"];
  readonly uploadedAt: Scalars["DateTime"]["output"];
};

export type AddressInput = {
  readonly lat: InputMaybe<Scalars["Float"]["input"]>;
  readonly lng: InputMaybe<Scalars["Float"]["input"]>;
  readonly normalized: InputMaybe<Scalars["JSON"]["input"]>;
  readonly raw: Scalars["String"]["input"];
};

export type AddressStatus =
  | "ANONYMIZED"
  | "CAPTURED"
  | "GEO_VALIDATED"
  | "HISTORICAL"
  | "NORMALIZED"
  | "REJECTED"
  | "VERIFIED";

export type AllocationStatus =
  | "COMMITTED"
  | "EXPIRED"
  | "PROVISIONAL"
  | "VOIDED";

export type Applicant = {
  readonly __typename: "Applicant";
  readonly address: Maybe<Scalars["String"]["output"]>;
  readonly email: Maybe<Scalars["String"]["output"]>;
  readonly fullName: Scalars["String"]["output"];
  readonly id: Scalars["ID"]["output"];
  readonly identificationNumber: Maybe<Scalars["String"]["output"]>;
  readonly organization: Maybe<Scalars["String"]["output"]>;
  readonly phone: Maybe<Scalars["String"]["output"]>;
  readonly type: ApplicantType;
};

export type ApplicantInput = {
  readonly address: InputMaybe<Scalars["String"]["input"]>;
  readonly email: InputMaybe<Scalars["String"]["input"]>;
  readonly fullName: Scalars["String"]["input"];
  readonly identificationNumber: InputMaybe<Scalars["String"]["input"]>;
  readonly organization: InputMaybe<Scalars["String"]["input"]>;
  readonly phone: InputMaybe<Scalars["String"]["input"]>;
  readonly type: ApplicantType;
};

export type ApplicantType =
  | "CITIZEN"
  | "GOVERNMENT_OFFICE"
  | "ORGANIZATION"
  | "OTHER";

export type Approval = {
  readonly __typename: "Approval";
  readonly approvedAt: Scalars["DateTime"]["output"];
  readonly decision: ApprovalDecision;
  readonly id: Scalars["ID"]["output"];
  readonly notes: Maybe<Scalars["String"]["output"]>;
  readonly signatory: Signatory;
};

export type ApprovalDecision = "APPROVED" | "DELEGATED" | "REJECTED";

/** Used by Approver (CAO/Mayor) to approve, reject or delegate. */
export type ApproveChalaniInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly decision: ChalaniApprovalDecision;
  readonly delegateToId: InputMaybe<Scalars["ID"]["input"]>;
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly notes: InputMaybe<Scalars["String"]["input"]>;
  readonly reason: InputMaybe<Scalars["String"]["input"]>;
};

export type ApproveGrantInput = {
  readonly approve: Scalars["Boolean"]["input"];
  readonly grantId: Scalars["ID"]["input"];
  readonly overrideSoD: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly reason: InputMaybe<Scalars["String"]["input"]>;
};

export type Attachment = {
  readonly __typename: "Attachment";
  readonly checksum: Scalars["String"]["output"];
  readonly fileName: Scalars["String"]["output"];
  readonly fileSize: Scalars["Int"]["output"];
  readonly id: Scalars["ID"]["output"];
  readonly mimeType: Scalars["String"]["output"];
  readonly uploadedAt: Scalars["DateTime"]["output"];
  readonly uploadedBy: User;
  readonly url: Scalars["String"]["output"];
};

export type AuditEntityType = "CHALANI" | "COUNTER" | "DARTA";

export type AuditEntry = {
  readonly __typename: "AuditEntry";
  readonly action: Scalars["String"]["output"];
  readonly actor: User;
  readonly entityId: Scalars["ID"]["output"];
  readonly entityType: AuditEntityType;
  readonly fromStatus: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly ip: Maybe<Scalars["String"]["output"]>;
  readonly metadata: Maybe<Scalars["JSON"]["output"]>;
  readonly reason: Maybe<Scalars["String"]["output"]>;
  readonly timestamp: Scalars["DateTime"]["output"];
  readonly toStatus: Maybe<Scalars["String"]["output"]>;
  readonly userAgent: Maybe<Scalars["String"]["output"]>;
};

export type Chalani = {
  readonly __typename: "Chalani";
  readonly acknowledgedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly acknowledgedBy: Maybe<Scalars["String"]["output"]>;
  readonly acknowledgementProof: Maybe<Attachment>;
  readonly allowedActions: ReadonlyArray<ChalaniAction>;
  readonly approvals: ReadonlyArray<Approval>;
  readonly attachments: ReadonlyArray<Attachment>;
  readonly auditTrail: ReadonlyArray<AuditEntry>;
  readonly body: Scalars["String"]["output"];
  readonly chalaniNumber: Maybe<Scalars["Int"]["output"]>;
  readonly courierName: Maybe<Scalars["String"]["output"]>;
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly createdBy: User;
  readonly deliveredAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly deliveredProof: Maybe<Attachment>;
  readonly dispatchChannel: Maybe<DispatchChannel>;
  readonly dispatchedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly dispatchedBy: Maybe<User>;
  readonly fiscalYear: Scalars["FiscalYear"]["output"];
  readonly formattedChalaniNumber: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly isAcknowledged: Scalars["Boolean"]["output"];
  readonly isFullyApproved: Scalars["Boolean"]["output"];
  readonly linkedDarta: Maybe<Darta>;
  readonly recipient: Recipient;
  readonly requiredSignatories: ReadonlyArray<Signatory>;
  readonly scope: Scope;
  readonly status: ChalaniStatus;
  readonly subject: Scalars["String"]["output"];
  readonly supersededById: Maybe<Scalars["ID"]["output"]>;
  readonly supersedesId: Maybe<Scalars["ID"]["output"]>;
  readonly templateId: Maybe<Scalars["ID"]["output"]>;
  readonly trackingId: Maybe<Scalars["String"]["output"]>;
  readonly updatedAt: Scalars["DateTime"]["output"];
  readonly ward: Maybe<Ward>;
};

export type ChalaniAction =
  | "ACKNOWLEDGE"
  | "APPROVE"
  | "APPROVE_REVIEW"
  | "CLOSE"
  | "CREATE"
  | "DELIVER"
  | "DIRECT_REGISTER"
  | "DISPATCH"
  | "EDIT_REQUIRED"
  | "FINALIZE"
  | "MARK_IN_TRANSIT"
  | "REJECT"
  | "RESEND"
  | "RESERVE_NO"
  | "RETURN_UNDELIVERED"
  | "SEAL"
  | "SIGN"
  | "SUBMIT"
  | "SUPERSEDE"
  | "VOID";

export type ChalaniApprovalDecision = "APPROVE" | "REJECT";

export type ChalaniConnection = {
  readonly __typename: "ChalaniConnection";
  readonly edges: ReadonlyArray<ChalaniEdge>;
  readonly pageInfo: PageInfo;
};

export type ChalaniEdge = {
  readonly __typename: "ChalaniEdge";
  readonly cursor: Scalars["String"]["output"];
  readonly node: Chalani;
};

/**
 * Filter options for Chalani list and dashboards.
 * All fields are optional and can be combined.
 */
export type ChalaniFilterInput = {
  readonly createdById: InputMaybe<Scalars["ID"]["input"]>;
  readonly dispatchChannel: InputMaybe<ReadonlyArray<DispatchChannel>>;
  readonly fiscalYear: InputMaybe<Scalars["FiscalYear"]["input"]>;
  readonly fromDate: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly includeArchived: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly isAcknowledged: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly recipientName: InputMaybe<Scalars["String"]["input"]>;
  readonly scope: InputMaybe<Scope>;
  readonly search: InputMaybe<Scalars["String"]["input"]>;
  readonly sortBy: InputMaybe<ChalaniSortField>;
  readonly sortOrder: InputMaybe<SortOrder>;
  readonly status: InputMaybe<ReadonlyArray<ChalaniStatus>>;
  readonly toDate: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type ChalaniReviewDecision = "APPROVE_REVIEW" | "EDIT_REQUIRED";

export type ChalaniSortField = "CREATED_AT" | "STATUS" | "UPDATED_AT";

export type ChalaniStats = {
  readonly __typename: "ChalaniStats";
  readonly acknowledgementRate: Scalars["Float"]["output"];
  readonly avgDispatchTimeHours: Scalars["Float"]["output"];
  readonly byChannel: ReadonlyArray<DispatchChannelCount>;
  readonly byStatus: ReadonlyArray<ChalaniStatusCount>;
  readonly total: Scalars["Int"]["output"];
};

export type ChalaniStatus =
  | "ACKNOWLEDGED"
  | "APPROVED"
  | "CLOSED"
  | "DELIVERED"
  | "DISPATCHED"
  | "DRAFT"
  | "IN_TRANSIT"
  | "NUMBER_RESERVED"
  | "PENDING_APPROVAL"
  | "PENDING_REVIEW"
  | "REGISTERED"
  | "RETURNED_UNDELIVERED"
  | "SEALED"
  | "SIGNED"
  | "SUPERSEDED"
  | "VOIDED";

export type ChalaniStatusCount = {
  readonly __typename: "ChalaniStatusCount";
  readonly count: Scalars["Int"]["output"];
  readonly status: ChalaniStatus;
};

export type ChalaniTemplate = {
  readonly __typename: "ChalaniTemplate";
  readonly body: Scalars["String"]["output"];
  readonly category: Scalars["String"]["output"];
  readonly id: Scalars["ID"]["output"];
  readonly isActive: Scalars["Boolean"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly requiredSignatories: ReadonlyArray<Role>;
  readonly subject: Scalars["String"]["output"];
};

export type ChannelCount = {
  readonly __typename: "ChannelCount";
  readonly channel: IntakeChannel;
  readonly count: Scalars["Int"]["output"];
};

export type CommitNumberInput = {
  readonly allocationId: Scalars["ID"]["input"];
  readonly entityId: Scalars["ID"]["input"];
  readonly entityType: Scalars["String"]["input"];
};

export type Contact = {
  readonly __typename: "Contact";
  readonly type: Scalars["String"]["output"];
  readonly value: Scalars["String"]["output"];
  readonly verified: Scalars["Boolean"]["output"];
  readonly verifiedAt: Maybe<Scalars["DateTime"]["output"]>;
};

export type ContactInput = {
  readonly type: Scalars["String"]["input"];
  readonly value: Scalars["String"]["input"];
};

export type Counter = {
  readonly __typename: "Counter";
  readonly currentValue: Scalars["Int"]["output"];
  readonly fiscalYear: Scalars["FiscalYear"]["output"];
  readonly id: Scalars["ID"]["output"];
  readonly isLocked: Scalars["Boolean"]["output"];
  readonly lastIssuedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly lockedBy: Maybe<User>;
  readonly lockedReason: Maybe<Scalars["String"]["output"]>;
  readonly scope: Scope;
  readonly type: CounterType;
  readonly ward: Maybe<Ward>;
};

export type CounterType = "CHALANI" | "DARTA";

/** Create a new Chalani draft. */
export type CreateChalaniInput = {
  readonly attachmentIds: InputMaybe<ReadonlyArray<Scalars["ID"]["input"]>>;
  readonly body: Scalars["String"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly linkedDartaId: InputMaybe<Scalars["ID"]["input"]>;
  readonly recipient: RecipientInput;
  readonly requiredSignatoryIds: ReadonlyArray<Scalars["ID"]["input"]>;
  readonly scope: Scope;
  readonly subject: Scalars["String"]["input"];
  readonly templateId: InputMaybe<Scalars["ID"]["input"]>;
  readonly wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type CreateDartaInput = {
  readonly annexIds: InputMaybe<ReadonlyArray<Scalars["ID"]["input"]>>;
  readonly applicant: ApplicantInput;
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly intakeChannel: IntakeChannel;
  readonly primaryDocumentId: Scalars["ID"]["input"];
  readonly priority: InputMaybe<Priority>;
  readonly receivedDate: Scalars["DateTime"]["input"];
  readonly scope: Scope;
  readonly subject: Scalars["String"]["input"];
  readonly wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type Credential = {
  readonly __typename: "Credential";
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly lastUsedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly rotatedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly status: CredentialStatus;
  readonly type: CredentialType;
};

export type CredentialStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "PENDING"
  | "REVOKED"
  | "SUSPENDED";

export type CredentialType =
  | "BUSINESS_REGISTRATION"
  | "CITIZENSHIP"
  | "DISABILITY_CARD"
  | "EDUCATIONAL_CERTIFICATE"
  | "LAND_OWNERSHIP"
  | "OTHER"
  | "TAX_CLEARANCE"
  | "WARD_RECOMMENDATION";

export type Darta = {
  readonly __typename: "Darta";
  readonly annexes: ReadonlyArray<Attachment>;
  readonly applicant: Applicant;
  readonly assignedTo: Maybe<OrgUnit>;
  readonly auditTrail: ReadonlyArray<AuditEntry>;
  readonly backdateApprover: Maybe<User>;
  readonly backdateReason: Maybe<Scalars["String"]["output"]>;
  readonly chalaniResponses: ReadonlyArray<Chalani>;
  readonly classificationCode: Maybe<Scalars["String"]["output"]>;
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly createdBy: User;
  readonly currentAssignee: Maybe<User>;
  readonly dartaNumber: Maybe<Scalars["Int"]["output"]>;
  readonly entryDate: Scalars["DateTime"]["output"];
  readonly fiscalYear: Scalars["FiscalYear"]["output"];
  readonly formattedDartaNumber: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly intakeChannel: IntakeChannel;
  readonly isBackdated: Scalars["Boolean"]["output"];
  readonly isOverdue: Scalars["Boolean"]["output"];
  readonly primaryDocument: Attachment;
  readonly priority: Priority;
  readonly receivedDate: Scalars["DateTime"]["output"];
  readonly relatedDarta: ReadonlyArray<Darta>;
  readonly scope: Scope;
  readonly slaDeadline: Maybe<Scalars["DateTime"]["output"]>;
  readonly status: DartaStatus;
  readonly subject: Scalars["String"]["output"];
  readonly updatedAt: Scalars["DateTime"]["output"];
  readonly ward: Maybe<Ward>;
};

export type DartaConnection = {
  readonly __typename: "DartaConnection";
  readonly edges: ReadonlyArray<DartaEdge>;
  readonly pageInfo: PageInfo;
};

export type DartaEdge = {
  readonly __typename: "DartaEdge";
  readonly cursor: Scalars["String"]["output"];
  readonly node: Darta;
};

export type DartaFilterInput = {
  readonly assigneeId: InputMaybe<Scalars["ID"]["input"]>;
  readonly fiscalYear: InputMaybe<Scalars["FiscalYear"]["input"]>;
  readonly fromDate: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly intakeChannel: InputMaybe<IntakeChannel>;
  readonly isOverdue: InputMaybe<Scalars["Boolean"]["input"]>;
  readonly organizationalUnitId: InputMaybe<Scalars["ID"]["input"]>;
  readonly priority: InputMaybe<Priority>;
  readonly scope: InputMaybe<Scope>;
  readonly search: InputMaybe<Scalars["String"]["input"]>;
  readonly status: InputMaybe<DartaStatus>;
  readonly toDate: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type DartaReviewDecision = "APPROVE_REVIEW" | "EDIT_REQUIRED";

export type DartaStats = {
  readonly __typename: "DartaStats";
  readonly avgProcessingTimeHours: Scalars["Float"]["output"];
  readonly byChannel: ReadonlyArray<ChannelCount>;
  readonly byStatus: ReadonlyArray<DartaStatusCount>;
  readonly overdueCount: Scalars["Int"]["output"];
  readonly total: Scalars["Int"]["output"];
};

export type DartaStatus =
  | "ACCEPTED"
  | "ACK_RECEIVED"
  | "ACK_REQUESTED"
  | "ACTION_TAKEN"
  | "ASSIGNED"
  | "CLASSIFICATION"
  | "CLOSED"
  | "DIGITALLY_ARCHIVED"
  | "DRAFT"
  | "IN_REVIEW_BY_SECTION"
  | "METADATA_ENRICHED"
  | "NEEDS_CLARIFICATION"
  | "NUMBER_RESERVED"
  | "PENDING_REVIEW"
  | "REGISTERED"
  | "RESPONSE_ISSUED"
  | "SCANNED"
  | "SUPERSEDED"
  | "VOIDED";

export type DartaStatusCount = {
  readonly __typename: "DartaStatusCount";
  readonly count: Scalars["Int"]["output"];
  readonly status: DartaStatus;
};

export type DelegateGrantInput = {
  readonly constraints: InputMaybe<Scalars["JSON"]["input"]>;
  readonly endAt: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly grantId: Scalars["ID"]["input"];
  readonly startAt: Scalars["DateTime"]["input"];
  readonly toUserId: Scalars["ID"]["input"];
};

export type Delegation = {
  readonly __typename: "Delegation";
  readonly constraints: Maybe<Scalars["JSON"]["output"]>;
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly endAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly endedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly fromGrant: Grant;
  readonly id: Scalars["ID"]["output"];
  readonly reason: Maybe<Scalars["String"]["output"]>;
  readonly startAt: Scalars["DateTime"]["output"];
  readonly status: DelegationStatus;
  readonly toUser: User;
};

export type DelegationStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "EXPIRED"
  | "PENDING"
  | "REVOKED"
  | "SUSPENDED";

export type DirectRegisterChalaniInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
};

export type DispatchChalaniInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly courierName: InputMaybe<Scalars["String"]["input"]>;
  readonly dispatchChannel: DispatchChannel;
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly scheduledDispatchAt: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly trackingId: InputMaybe<Scalars["String"]["input"]>;
};

export type DispatchChannel =
  | "COURIER"
  | "EDARTA_PORTAL"
  | "EMAIL"
  | "HAND_DELIVERY"
  | "POSTAL";

export type DispatchChannelCount = {
  readonly __typename: "DispatchChannelCount";
  readonly channel: DispatchChannel;
  readonly count: Scalars["Int"]["output"];
};

export type EvidenceInput = {
  readonly fileId: Scalars["ID"]["input"];
  readonly kind: Scalars["String"]["input"];
};

export type FinalizeChalaniRegistrationInput = {
  readonly allocationId: Scalars["ID"]["input"];
  readonly chalaniId: Scalars["ID"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
};

export type GeoPoint = {
  readonly __typename: "GeoPoint";
  readonly lat: Scalars["Float"]["output"];
  readonly lng: Scalars["Float"]["output"];
};

export type GovIdRef = {
  readonly __typename: "GovIdRef";
  readonly expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly issuedBy: Maybe<Scalars["String"]["output"]>;
  readonly type: Scalars["String"]["output"];
  readonly value: Scalars["String"]["output"];
};

export type GovIdRefInput = {
  readonly expiresAt: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly issuedBy: InputMaybe<Scalars["String"]["input"]>;
  readonly type: Scalars["String"]["input"];
  readonly value: Scalars["String"]["input"];
};

export type Grant = {
  readonly __typename: "Grant";
  readonly conditions: Maybe<Scalars["JSON"]["output"]>;
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly decidedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly decidedBy: Maybe<User>;
  readonly decisionReason: Maybe<Scalars["String"]["output"]>;
  readonly endAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly requestedAt: Scalars["DateTime"]["output"];
  readonly requestedBy: User;
  readonly role: Role;
  readonly scope: ScopeRef;
  readonly startAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly status: GrantStatus;
  readonly subject: GrantSubject;
  readonly updatedAt: Scalars["DateTime"]["output"];
};

export type GrantConnection = {
  readonly __typename: "GrantConnection";
  readonly edges: ReadonlyArray<GrantEdge>;
  readonly pageInfo: PageInfo;
};

export type GrantEdge = {
  readonly __typename: "GrantEdge";
  readonly cursor: Scalars["String"]["output"];
  readonly node: Grant;
};

export type GrantStatus =
  | "ACTIVE"
  | "APPROVED"
  | "EXPIRED"
  | "REQUESTED"
  | "REVOKED"
  | "SUSPENDED";

export type GrantSubject = {
  readonly __typename: "GrantSubject";
  readonly group: Maybe<Group>;
  readonly type: Scalars["String"]["output"];
  readonly user: Maybe<User>;
};

export type GrantsFilter = {
  readonly orgUnitId: InputMaybe<Scalars["ID"]["input"]>;
  readonly roleKey: InputMaybe<Scalars["String"]["input"]>;
  readonly status: InputMaybe<GrantStatus>;
  readonly userId: InputMaybe<Scalars["ID"]["input"]>;
};

export type Group = {
  readonly __typename: "Group";
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly members: ReadonlyArray<User>;
  readonly name: Scalars["String"]["output"];
  readonly updatedAt: Scalars["DateTime"]["output"];
};

export type IntakeChannel =
  | "COUNTER"
  | "COURIER"
  | "EDARTA_PORTAL"
  | "EMAIL"
  | "POSTAL";

export type InviteUserInput = {
  readonly actorType: InputMaybe<Scalars["String"]["input"]>;
  readonly attributes: InputMaybe<Scalars["JSON"]["input"]>;
  readonly email: InputMaybe<Scalars["String"]["input"]>;
  readonly orgUnitId: InputMaybe<Scalars["ID"]["input"]>;
  readonly person: PersonInput;
  readonly phone: InputMaybe<Scalars["String"]["input"]>;
  readonly username: Scalars["String"]["input"];
};

export type MarkDeliveredInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly deliveredProofId: InputMaybe<Scalars["ID"]["input"]>;
  readonly idempotencyKey: Scalars["String"]["input"];
};

export type MarkInTransitInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly courierName: InputMaybe<Scalars["String"]["input"]>;
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly trackingId: InputMaybe<Scalars["String"]["input"]>;
};

export type MarkReturnedUndeliveredInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly reason: Scalars["String"]["input"];
};

export type Mutation = {
  readonly __typename: "Mutation";
  readonly acceptDarta: Darta;
  readonly acknowledgeChalani: Chalani;
  readonly addAddress: Address;
  readonly addCredential: Credential;
  readonly addUserToGroup: Group;
  readonly allocateNumber: NumberAllocation;
  readonly anonymizeUser: User;
  readonly approveChalani: Chalani;
  readonly approveGrant: Grant;
  readonly approveUserProvisioning: User;
  readonly classifyDarta: Darta;
  readonly closeChalani: Chalani;
  readonly closeDarta: Darta;
  readonly commitNumber: NumberAllocation;
  readonly createChalani: Chalani;
  readonly createDarta: Darta;
  readonly createGroup: Group;
  readonly createOrgUnit: OrgUnit;
  readonly delegateGrant: Delegation;
  readonly deleteOrgUnit: Scalars["Boolean"]["output"];
  readonly deprovisionUser: User;
  readonly directRegisterChalani: Chalani;
  readonly directRegisterDarta: Darta;
  readonly disableUser: User;
  readonly dispatchChalani: Chalani;
  readonly endDelegation: Delegation;
  readonly enrichDartaMetadata: Darta;
  readonly finalizeChalaniRegistration: Chalani;
  readonly finalizeDartaArchive: Darta;
  readonly finalizeDartaRegistration: Darta;
  readonly inviteUser: User;
  readonly issueDartaResponse: Darta;
  readonly markChalaniDelivered: Chalani;
  readonly markChalaniInTransit: Chalani;
  readonly markChalaniReturnedUndelivered: Chalani;
  readonly markDartaAction: Darta;
  readonly provideDartaClarification: Darta;
  readonly receiveDartaAck: Darta;
  readonly rejectAddress: Address;
  readonly removeUserFromGroup: Group;
  readonly renewGrant: Grant;
  readonly requestDartaAck: Darta;
  readonly requestDartaClarification: Darta;
  readonly requestGrant: Grant;
  readonly resendChalani: Chalani;
  readonly reserveChalaniNumber: Chalani;
  readonly reserveDartaNumber: Darta;
  readonly reviewChalani: Chalani;
  readonly reviewDarta: Darta;
  readonly revokeCredential: Credential;
  readonly revokeGrant: Grant;
  readonly rotateCredential: Credential;
  readonly routeDarta: Darta;
  readonly scanDarta: Darta;
  readonly sealChalani: Chalani;
  readonly sectionReviewDarta: Darta;
  readonly setPrimaryAddress: Person;
  readonly signChalani: Chalani;
  readonly submitChalani: Chalani;
  readonly submitDartaForReview: Darta;
  readonly supersedeChalani: SupersedeChalaniResult;
  readonly supersedeDartaRecord: Darta;
  readonly suspendUser: User;
  readonly unlockUser: User;
  readonly updateOrgUnit: OrgUnit;
  readonly upsertRole: Role;
  readonly verifyAddress: Address;
  readonly verifyUser: Scalars["Boolean"]["output"];
  readonly voidChalani: Chalani;
  readonly voidDarta: Darta;
  readonly voidNumber: NumberAllocation;
};

export type MutationAcceptDartaArgs = {
  dartaId: Scalars["ID"]["input"];
};

export type MutationAcknowledgeChalaniArgs = {
  input: AcknowledgeChalaniInput;
};

export type MutationAddAddressArgs = {
  address: AddressInput;
  userId: Scalars["ID"]["input"];
};

export type MutationAddCredentialArgs = {
  type: CredentialType;
  userId: Scalars["ID"]["input"];
};

export type MutationAddUserToGroupArgs = {
  groupId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationAllocateNumberArgs = {
  input: NumberAllocationInput;
};

export type MutationAnonymizeUserArgs = {
  userId: Scalars["ID"]["input"];
};

export type MutationApproveChalaniArgs = {
  input: ApproveChalaniInput;
};

export type MutationApproveGrantArgs = {
  input: ApproveGrantInput;
};

export type MutationApproveUserProvisioningArgs = {
  userId: Scalars["ID"]["input"];
};

export type MutationClassifyDartaArgs = {
  classificationCode: Scalars["String"]["input"];
  dartaId: Scalars["ID"]["input"];
};

export type MutationCloseChalaniArgs = {
  chalaniId: Scalars["ID"]["input"];
};

export type MutationCloseDartaArgs = {
  dartaId: Scalars["ID"]["input"];
};

export type MutationCommitNumberArgs = {
  input: CommitNumberInput;
};

export type MutationCreateChalaniArgs = {
  input: CreateChalaniInput;
};

export type MutationCreateDartaArgs = {
  input: CreateDartaInput;
};

export type MutationCreateGroupArgs = {
  description: InputMaybe<Scalars["String"]["input"]>;
  name: Scalars["String"]["input"];
};

export type MutationCreateOrgUnitArgs = {
  input: OrgUnitInput;
};

export type MutationDelegateGrantArgs = {
  input: DelegateGrantInput;
};

export type MutationDeleteOrgUnitArgs = {
  id: Scalars["ID"]["input"];
};

export type MutationDeprovisionUserArgs = {
  reason: Scalars["String"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationDirectRegisterChalaniArgs = {
  input: DirectRegisterChalaniInput;
};

export type MutationDirectRegisterDartaArgs = {
  dartaId: Scalars["ID"]["input"];
};

export type MutationDisableUserArgs = {
  reason: Scalars["String"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationDispatchChalaniArgs = {
  input: DispatchChalaniInput;
};

export type MutationEndDelegationArgs = {
  delegationId: Scalars["ID"]["input"];
  reason: InputMaybe<Scalars["String"]["input"]>;
};

export type MutationEnrichDartaMetadataArgs = {
  dartaId: Scalars["ID"]["input"];
  metadata: Scalars["JSON"]["input"];
};

export type MutationFinalizeChalaniRegistrationArgs = {
  input: FinalizeChalaniRegistrationInput;
};

export type MutationFinalizeDartaArchiveArgs = {
  dartaId: Scalars["ID"]["input"];
};

export type MutationFinalizeDartaRegistrationArgs = {
  allocationId: Scalars["ID"]["input"];
  dartaId: Scalars["ID"]["input"];
};

export type MutationInviteUserArgs = {
  input: InviteUserInput;
};

export type MutationIssueDartaResponseArgs = {
  dartaId: Scalars["ID"]["input"];
  docAttachmentId: InputMaybe<Scalars["ID"]["input"]>;
  responseChalaniId: InputMaybe<Scalars["ID"]["input"]>;
};

export type MutationMarkChalaniDeliveredArgs = {
  input: MarkDeliveredInput;
};

export type MutationMarkChalaniInTransitArgs = {
  input: MarkInTransitInput;
};

export type MutationMarkChalaniReturnedUndeliveredArgs = {
  input: MarkReturnedUndeliveredInput;
};

export type MutationMarkDartaActionArgs = {
  actionNote: Scalars["String"]["input"];
  dartaId: Scalars["ID"]["input"];
};

export type MutationProvideDartaClarificationArgs = {
  dartaId: Scalars["ID"]["input"];
  note: Scalars["String"]["input"];
};

export type MutationReceiveDartaAckArgs = {
  dartaId: Scalars["ID"]["input"];
};

export type MutationRejectAddressArgs = {
  addressId: Scalars["ID"]["input"];
  reason: Scalars["String"]["input"];
};

export type MutationRemoveUserFromGroupArgs = {
  groupId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationRenewGrantArgs = {
  endAt: Scalars["DateTime"]["input"];
  grantId: Scalars["ID"]["input"];
};

export type MutationRequestDartaAckArgs = {
  dartaId: Scalars["ID"]["input"];
};

export type MutationRequestDartaClarificationArgs = {
  dartaId: Scalars["ID"]["input"];
  note: Scalars["String"]["input"];
};

export type MutationRequestGrantArgs = {
  input: RequestGrantInput;
};

export type MutationResendChalaniArgs = {
  input: ResendChalaniInput;
};

export type MutationReserveChalaniNumberArgs = {
  input: ReserveChalaniNumberInput;
};

export type MutationReserveDartaNumberArgs = {
  allocationId: Scalars["ID"]["input"];
  dartaId: Scalars["ID"]["input"];
};

export type MutationReviewChalaniArgs = {
  input: ReviewChalaniInput;
};

export type MutationReviewDartaArgs = {
  input: ReviewDartaInput;
};

export type MutationRevokeCredentialArgs = {
  credentialId: Scalars["ID"]["input"];
  reason: Scalars["String"]["input"];
};

export type MutationRevokeGrantArgs = {
  input: RevokeGrantInput;
};

export type MutationRotateCredentialArgs = {
  credentialId: Scalars["ID"]["input"];
};

export type MutationRouteDartaArgs = {
  input: RouteDartaInput;
};

export type MutationScanDartaArgs = {
  dartaId: Scalars["ID"]["input"];
  scanAttachmentId: Scalars["ID"]["input"];
};

export type MutationSealChalaniArgs = {
  input: SealChalaniInput;
};

export type MutationSectionReviewDartaArgs = {
  dartaId: Scalars["ID"]["input"];
};

export type MutationSetPrimaryAddressArgs = {
  addressId: Scalars["ID"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationSignChalaniArgs = {
  input: SignChalaniInput;
};

export type MutationSubmitChalaniArgs = {
  chalaniId: Scalars["ID"]["input"];
};

export type MutationSubmitDartaForReviewArgs = {
  dartaId: Scalars["ID"]["input"];
};

export type MutationSupersedeChalaniArgs = {
  input: SupersedeChalaniInput;
};

export type MutationSupersedeDartaRecordArgs = {
  dartaId: Scalars["ID"]["input"];
  newDartaId: InputMaybe<Scalars["ID"]["input"]>;
  reason: Scalars["String"]["input"];
};

export type MutationSuspendUserArgs = {
  reason: Scalars["String"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationUnlockUserArgs = {
  userId: Scalars["ID"]["input"];
};

export type MutationUpdateOrgUnitArgs = {
  id: Scalars["ID"]["input"];
  input: OrgUnitInput;
};

export type MutationUpsertRoleArgs = {
  constraints: RoleConstraintsInput;
  description: InputMaybe<Scalars["String"]["input"]>;
  key: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  permissions: ReadonlyArray<PermissionInput>;
};

export type MutationVerifyAddressArgs = {
  addressId: Scalars["ID"]["input"];
  evidence: ReadonlyArray<EvidenceInput>;
};

export type MutationVerifyUserArgs = {
  method: VerificationMethod;
  token: Scalars["String"]["input"];
  userId: Scalars["ID"]["input"];
};

export type MutationVoidChalaniArgs = {
  input: VoidChalaniInput;
};

export type MutationVoidDartaArgs = {
  dartaId: Scalars["ID"]["input"];
  reason: Scalars["String"]["input"];
};

export type MutationVoidNumberArgs = {
  input: VoidNumberInput;
};

export type NumberAllocation = {
  readonly __typename: "NumberAllocation";
  readonly allocatedAt: Scalars["DateTime"]["output"];
  readonly allocatedBy: User;
  readonly committedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly committedEntityId: Maybe<Scalars["ID"]["output"]>;
  readonly committedEntityType: Maybe<Scalars["String"]["output"]>;
  readonly expiresAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly fiscalYear: Scalars["FiscalYear"]["output"];
  readonly formattedNumber: Scalars["String"]["output"];
  readonly id: Scalars["ID"]["output"];
  readonly number: Scalars["Int"]["output"];
  readonly scope: Scope;
  readonly status: AllocationStatus;
  readonly type: CounterType;
  readonly voidReason: Maybe<Scalars["String"]["output"]>;
  readonly voidedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly ward: Maybe<Ward>;
};

export type NumberAllocationInput = {
  readonly fiscalYear: Scalars["FiscalYear"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly scope: Scope;
  readonly ttlMinutes: InputMaybe<Scalars["Int"]["input"]>;
  readonly type: CounterType;
  readonly wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type OrgUnit = {
  readonly __typename: "OrgUnit";
  readonly children: ReadonlyArray<OrgUnit>;
  readonly code: Scalars["String"]["output"];
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly id: Scalars["ID"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly parent: Maybe<OrgUnit>;
  readonly type: OrgUnitType;
  readonly updatedAt: Scalars["DateTime"]["output"];
  readonly wardNumber: Maybe<Scalars["Int"]["output"]>;
};

export type OrgUnitInput = {
  readonly code: Scalars["String"]["input"];
  readonly name: Scalars["String"]["input"];
  readonly parentId: InputMaybe<Scalars["ID"]["input"]>;
  readonly type: OrgUnitType;
  readonly wardNumber: InputMaybe<Scalars["Int"]["input"]>;
};

export type OrgUnitType =
  | "ACCOUNT"
  | "ADMINISTRATION"
  | "AGRICULTURE"
  | "EDUCATION"
  | "ENGINEERING"
  | "GENERAL_SERVICE"
  | "HEALTH"
  | "INFORMATION_TECHNOLOGY"
  | "OTHER"
  | "PLANNING"
  | "REVENUE"
  | "SOCIAL_DEVELOPMENT";

export type PageInfo = {
  readonly __typename: "PageInfo";
  readonly hasNextPage: Scalars["Boolean"]["output"];
  readonly hasPreviousPage: Scalars["Boolean"]["output"];
  readonly limit: Scalars["Int"]["output"];
  readonly page: Scalars["Int"]["output"];
  readonly total: Scalars["Int"]["output"];
  readonly totalPages: Scalars["Int"]["output"];
};

export type PaginationInput = {
  readonly limit: Scalars["Int"]["input"];
  readonly page: Scalars["Int"]["input"];
};

export type Permission = {
  readonly __typename: "Permission";
  readonly action: Scalars["String"]["output"];
  readonly resource: Scalars["String"]["output"];
};

export type PermissionCheckInput = {
  readonly action: Scalars["String"]["input"];
  readonly orgUnitId: InputMaybe<Scalars["ID"]["input"]>;
  readonly resourceId: InputMaybe<Scalars["ID"]["input"]>;
  readonly resourceType: Scalars["String"]["input"];
  readonly userId: InputMaybe<Scalars["ID"]["input"]>;
};

export type PermissionCheckResult = {
  readonly __typename: "PermissionCheckResult";
  readonly allowed: Scalars["Boolean"]["output"];
  readonly matchedGrantIds: ReadonlyArray<Scalars["ID"]["output"]>;
  readonly reason: Maybe<Scalars["String"]["output"]>;
};

export type PermissionInput = {
  readonly action: Scalars["String"]["input"];
  readonly resource: Scalars["String"]["input"];
};

export type Person = {
  readonly __typename: "Person";
  readonly contacts: ReadonlyArray<Contact>;
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly dateOfBirth: Maybe<Scalars["String"]["output"]>;
  readonly govIdRefs: ReadonlyArray<GovIdRef>;
  readonly id: Scalars["ID"]["output"];
  readonly legalName: Scalars["String"]["output"];
  readonly preferredName: Maybe<Scalars["String"]["output"]>;
  readonly primaryAddress: Maybe<Address>;
  readonly updatedAt: Scalars["DateTime"]["output"];
};

export type PersonInput = {
  readonly contacts: InputMaybe<ReadonlyArray<ContactInput>>;
  readonly dateOfBirth: InputMaybe<Scalars["String"]["input"]>;
  readonly govIdRefs: InputMaybe<ReadonlyArray<GovIdRefInput>>;
  readonly legalName: Scalars["String"]["input"];
  readonly preferredName: InputMaybe<Scalars["String"]["input"]>;
  readonly primaryAddress: InputMaybe<AddressInput>;
};

export type Priority = "HIGH" | "LOW" | "MEDIUM" | "URGENT";

export type Query = {
  readonly __typename: "Query";
  readonly chalani: Maybe<Chalani>;
  /** Approval queue visible to approvers. */
  readonly chalaniApprovalQueue: ChalaniConnection;
  readonly chalaniByNumber: Maybe<Chalani>;
  /** Dispatch and tracking board, filtered by dispatch status. */
  readonly chalaniDispatchBoard: ChalaniConnection;
  /** Registry list for number reservation / registration staff. */
  readonly chalaniRegistryQueue: ChalaniConnection;
  /** Review queue visible to reviewers. */
  readonly chalaniReviewQueue: ChalaniConnection;
  /** Aggregated operational metrics for dashboards. */
  readonly chalaniStats: ChalaniStats;
  /** Templates usable for Chalani creation. */
  readonly chalaniTemplates: ReadonlyArray<ChalaniTemplate>;
  /** General listing with filters and pagination. */
  readonly chalanis: ChalaniConnection;
  readonly checkPermission: PermissionCheckResult;
  readonly counter: Maybe<Counter>;
  readonly counters: ReadonlyArray<Counter>;
  readonly darta: Maybe<Darta>;
  readonly dartaByNumber: Maybe<Darta>;
  readonly dartaStats: DartaStats;
  readonly dartas: DartaConnection;
  readonly delegations: ReadonlyArray<Delegation>;
  readonly effectiveGrants: ReadonlyArray<Grant>;
  readonly grant: Maybe<Grant>;
  readonly grants: GrantConnection;
  readonly group: Maybe<Group>;
  readonly groups: ReadonlyArray<Group>;
  readonly me: User;
  /** Recently created or updated by the current user. */
  readonly myChalaniDrafts: ChalaniConnection;
  /**
   * Chalanis that currently need an action by the logged-in user.
   * Auto-filters by role and state (Clerk → Draft, Reviewer → PendingReview, etc.)
   */
  readonly myChalaniInbox: ChalaniConnection;
  readonly myDartas: DartaConnection;
  /** Items awaiting this user's approval (Approver role). */
  readonly myPendingApprovals: ChalaniConnection;
  readonly numberAllocation: Maybe<NumberAllocation>;
  readonly orgUnit: Maybe<OrgUnit>;
  readonly orgUnits: ReadonlyArray<OrgUnit>;
  readonly pendingGrantRequests: GrantConnection;
  readonly person: Maybe<Person>;
  readonly role: Maybe<Role>;
  readonly roles: RoleConnection;
  readonly user: Maybe<User>;
  readonly userAddresses: ReadonlyArray<Address>;
  readonly userCredentials: ReadonlyArray<Credential>;
  readonly users: UserConnection;
};

export type QueryChalaniArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryChalaniApprovalQueueArgs = {
  pagination: InputMaybe<PaginationInput>;
};

export type QueryChalaniByNumberArgs = {
  chalaniNumber: Scalars["Int"]["input"];
  fiscalYear: Scalars["FiscalYear"]["input"];
  scope: Scope;
  wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryChalaniDispatchBoardArgs = {
  pagination: InputMaybe<PaginationInput>;
  status: InputMaybe<ReadonlyArray<ChalaniStatus>>;
};

export type QueryChalaniRegistryQueueArgs = {
  pagination: InputMaybe<PaginationInput>;
};

export type QueryChalaniReviewQueueArgs = {
  pagination: InputMaybe<PaginationInput>;
};

export type QueryChalaniStatsArgs = {
  fiscalYear: InputMaybe<Scalars["FiscalYear"]["input"]>;
  scope: InputMaybe<Scope>;
  wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryChalaniTemplatesArgs = {
  category: InputMaybe<Scalars["String"]["input"]>;
  search: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryChalanisArgs = {
  filter: InputMaybe<ChalaniFilterInput>;
  pagination: InputMaybe<PaginationInput>;
};

export type QueryCheckPermissionArgs = {
  input: PermissionCheckInput;
};

export type QueryCounterArgs = {
  fiscalYear: Scalars["FiscalYear"]["input"];
  scope: Scope;
  type: CounterType;
  wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryCountersArgs = {
  fiscalYear: InputMaybe<Scalars["FiscalYear"]["input"]>;
  scope: InputMaybe<Scope>;
};

export type QueryDartaArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryDartaByNumberArgs = {
  dartaNumber: Scalars["Int"]["input"];
  fiscalYear: Scalars["FiscalYear"]["input"];
  scope: Scope;
  wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryDartaStatsArgs = {
  fiscalYear: InputMaybe<Scalars["FiscalYear"]["input"]>;
  scope: InputMaybe<Scope>;
  wardId: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryDartasArgs = {
  filter: InputMaybe<DartaFilterInput>;
  pagination: InputMaybe<PaginationInput>;
};

export type QueryDelegationsArgs = {
  status: InputMaybe<DelegationStatus>;
  userId: InputMaybe<Scalars["ID"]["input"]>;
};

export type QueryEffectiveGrantsArgs = {
  orgUnitId: InputMaybe<Scalars["ID"]["input"]>;
  userId: Scalars["ID"]["input"];
};

export type QueryGrantArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryGrantsArgs = {
  filter: InputMaybe<GrantsFilter>;
  pagination: InputMaybe<PaginationInput>;
};

export type QueryGroupArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryGroupsArgs = {
  search: InputMaybe<Scalars["String"]["input"]>;
};

export type QueryMyChalaniDraftsArgs = {
  pagination: InputMaybe<PaginationInput>;
};

export type QueryMyChalaniInboxArgs = {
  pagination: InputMaybe<PaginationInput>;
  status: InputMaybe<ReadonlyArray<ChalaniStatus>>;
};

export type QueryMyDartasArgs = {
  pagination: InputMaybe<PaginationInput>;
  status: InputMaybe<DartaStatus>;
};

export type QueryMyPendingApprovalsArgs = {
  pagination: InputMaybe<PaginationInput>;
};

export type QueryNumberAllocationArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryOrgUnitArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryOrgUnitsArgs = {
  parentId: InputMaybe<Scalars["ID"]["input"]>;
  search: InputMaybe<Scalars["String"]["input"]>;
  type: InputMaybe<OrgUnitType>;
};

export type QueryPendingGrantRequestsArgs = {
  pagination: InputMaybe<PaginationInput>;
};

export type QueryPersonArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryRoleArgs = {
  key: Scalars["String"]["input"];
};

export type QueryRolesArgs = {
  filter: InputMaybe<RolesFilter>;
  pagination: InputMaybe<PaginationInput>;
};

export type QueryUserArgs = {
  id: Scalars["ID"]["input"];
};

export type QueryUserAddressesArgs = {
  userId: Scalars["ID"]["input"];
};

export type QueryUserCredentialsArgs = {
  userId: Scalars["ID"]["input"];
};

export type QueryUsersArgs = {
  filter: InputMaybe<UsersFilter>;
  pagination: InputMaybe<PaginationInput>;
};

export type Recipient = {
  readonly __typename: "Recipient";
  readonly address: Scalars["String"]["output"];
  readonly email: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly organization: Maybe<Scalars["String"]["output"]>;
  readonly phone: Maybe<Scalars["String"]["output"]>;
  readonly type: RecipientType;
};

/** Recipient details for Chalani. */
export type RecipientInput = {
  readonly address: Scalars["String"]["input"];
  readonly email: InputMaybe<Scalars["String"]["input"]>;
  readonly name: Scalars["String"]["input"];
  readonly organization: InputMaybe<Scalars["String"]["input"]>;
  readonly phone: InputMaybe<Scalars["String"]["input"]>;
  readonly type: RecipientType;
};

export type RecipientType =
  | "CITIZEN"
  | "GOVERNMENT_OFFICE"
  | "ORGANIZATION"
  | "OTHER";

export type RequestGrantInput = {
  readonly endAt: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly orgUnitId: Scalars["ID"]["input"];
  readonly reason: InputMaybe<Scalars["String"]["input"]>;
  readonly roleKey: Scalars["String"]["input"];
  readonly startAt: InputMaybe<Scalars["DateTime"]["input"]>;
  readonly userId: Scalars["ID"]["input"];
};

export type ResendChalaniInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly courierName: InputMaybe<Scalars["String"]["input"]>;
  readonly dispatchChannel: DispatchChannel;
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly trackingId: InputMaybe<Scalars["String"]["input"]>;
};

export type ReserveChalaniNumberInput = {
  readonly allocationId: Scalars["ID"]["input"];
  readonly chalaniId: Scalars["ID"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
};

/** Used by Reviewer (Ward Secretary) to accept or request edit. */
export type ReviewChalaniInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly decision: ChalaniReviewDecision;
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly notes: InputMaybe<Scalars["String"]["input"]>;
};

export type ReviewDartaInput = {
  readonly dartaId: Scalars["ID"]["input"];
  readonly decision: DartaReviewDecision;
  readonly notes: Scalars["String"]["input"];
  readonly requestedInfo: InputMaybe<Scalars["String"]["input"]>;
};

export type RevokeGrantInput = {
  readonly grantId: Scalars["ID"]["input"];
  readonly reason: Scalars["String"]["input"];
};

export type Role = {
  readonly __typename: "Role";
  readonly constraints: RoleConstraints;
  readonly createdAt: Scalars["DateTime"]["output"];
  readonly description: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly key: Scalars["String"]["output"];
  readonly name: Scalars["String"]["output"];
  readonly permissions: ReadonlyArray<Permission>;
  readonly updatedAt: Scalars["DateTime"]["output"];
};

export type RoleConnection = {
  readonly __typename: "RoleConnection";
  readonly edges: ReadonlyArray<RoleEdge>;
  readonly pageInfo: PageInfo;
};

export type RoleConstraints = {
  readonly __typename: "RoleConstraints";
  readonly SoDConflicts: ReadonlyArray<Scalars["String"]["output"]>;
  readonly requiresMFA: Scalars["Boolean"]["output"];
  readonly scopeTypes: ReadonlyArray<OrgUnitType>;
};

export type RoleConstraintsInput = {
  readonly SoDConflicts: ReadonlyArray<Scalars["String"]["input"]>;
  readonly requiresMFA: Scalars["Boolean"]["input"];
  readonly scopeTypes: ReadonlyArray<OrgUnitType>;
};

export type RoleEdge = {
  readonly __typename: "RoleEdge";
  readonly cursor: Scalars["String"]["output"];
  readonly node: Role;
};

export type RolesFilter = {
  readonly key: InputMaybe<Scalars["String"]["input"]>;
  readonly search: InputMaybe<Scalars["String"]["input"]>;
};

export type RouteDartaInput = {
  readonly assigneeId: InputMaybe<Scalars["ID"]["input"]>;
  readonly dartaId: Scalars["ID"]["input"];
  readonly notes: InputMaybe<Scalars["String"]["input"]>;
  readonly organizationalUnitId: Scalars["ID"]["input"];
  readonly priority: InputMaybe<Priority>;
  readonly slaHours: InputMaybe<Scalars["Int"]["input"]>;
};

export type Scope = "MUNICIPALITY" | "WARD";

export type ScopeRef = {
  readonly __typename: "ScopeRef";
  readonly orgUnit: OrgUnit;
};

export type SealChalaniInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly sealAttachmentId: InputMaybe<Scalars["ID"]["input"]>;
};

export type SignChalaniInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly signatureAttachmentId: InputMaybe<Scalars["ID"]["input"]>;
};

export type Signatory = {
  readonly __typename: "Signatory";
  readonly id: Scalars["ID"]["output"];
  readonly isRequired: Scalars["Boolean"]["output"];
  readonly order: Scalars["Int"]["output"];
  readonly role: Role;
  readonly user: User;
};

export type SortOrder = "ASC" | "DESC";

export type SupersedeChalaniInput = {
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly newChalani: CreateChalaniInput;
  readonly reason: Scalars["String"]["input"];
  readonly targetChalaniId: Scalars["ID"]["input"];
};

export type SupersedeChalaniResult = {
  readonly __typename: "SupersedeChalaniResult";
  readonly new: Chalani;
  readonly old: Chalani;
};

export type User = {
  readonly __typename: "User";
  readonly createdAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly email: Maybe<Scalars["String"]["output"]>;
  readonly fullName: Maybe<Scalars["String"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly phone: Maybe<Scalars["String"]["output"]>;
  readonly roles: Maybe<ReadonlyArray<Scalars["String"]["output"]>>;
  readonly updatedAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly username: Scalars["String"]["output"];
};

export type UserConnection = {
  readonly __typename: "UserConnection";
  readonly edges: ReadonlyArray<UserEdge>;
  readonly pageInfo: PageInfo;
};

export type UserEdge = {
  readonly __typename: "UserEdge";
  readonly cursor: Scalars["String"]["output"];
  readonly node: User;
};

export type UserStatus =
  | "ACTIVE"
  | "ARCHIVED"
  | "DEPROVISIONED"
  | "DISABLED"
  | "INACTIVE"
  | "LOCKED"
  | "PENDING_VERIFICATION";

export type UsersFilter = {
  readonly orgUnitId: InputMaybe<Scalars["ID"]["input"]>;
  readonly search: InputMaybe<Scalars["String"]["input"]>;
  readonly status: InputMaybe<UserStatus>;
};

export type VerificationMethod =
  | "BIOMETRIC_VERIFICATION"
  | "DIGITAL_SIGNATURE"
  | "DOCUMENT_VERIFICATION"
  | "FIELD_INSPECTION"
  | "MANUAL_REVIEW"
  | "OTHER"
  | "OTP_VERIFICATION"
  | "SYSTEM_AUTO_VERIFY"
  | "THIRD_PARTY_API";

export type VoidChalaniInput = {
  readonly chalaniId: Scalars["ID"]["input"];
  readonly idempotencyKey: Scalars["String"]["input"];
  readonly reason: Scalars["String"]["input"];
};

export type VoidNumberInput = {
  readonly allocationId: Scalars["ID"]["input"];
  readonly reason: Scalars["String"]["input"];
};

export type Ward = {
  readonly __typename: "Ward";
  readonly createdAt: Maybe<Scalars["DateTime"]["output"]>;
  readonly districtId: Maybe<Scalars["ID"]["output"]>;
  readonly id: Scalars["ID"]["output"];
  readonly localBodyId: Scalars["ID"]["output"];
  readonly localBodyName: Maybe<Scalars["String"]["output"]>;
  readonly name: Scalars["String"]["output"];
  readonly number: Scalars["Int"]["output"];
  readonly provinceId: Maybe<Scalars["ID"]["output"]>;
  readonly updatedAt: Maybe<Scalars["DateTime"]["output"]>;
};

export type DummyQueryVariables = Exact<{ [key: string]: never }>;

export type DummyQuery = { readonly __typename: "Query" };

export type GetChalanisQueryVariables = Exact<{
  pagination: InputMaybe<PaginationInput>;
}>;

export type GetChalanisQuery = {
  readonly __typename: "Query";
  readonly chalanis: {
    readonly __typename: "ChalaniConnection";
    readonly edges: ReadonlyArray<{
      readonly __typename: "ChalaniEdge";
      readonly cursor: string;
      readonly node: {
        readonly __typename: "Chalani";
        readonly id: string;
        readonly subject: string;
        readonly status: ChalaniStatus;
        readonly createdAt: string;
        readonly updatedAt: string;
      };
    }>;
    readonly pageInfo: {
      readonly __typename: "PageInfo";
      readonly page: number;
      readonly limit: number;
      readonly total: number;
      readonly totalPages: number;
      readonly hasNextPage: boolean;
      readonly hasPreviousPage: boolean;
    };
  };
};

export type MyChalaniInboxQueryVariables = Exact<{
  pagination: InputMaybe<PaginationInput>;
}>;

export type MyChalaniInboxQuery = {
  readonly __typename: "Query";
  readonly myChalaniInbox: {
    readonly __typename: "ChalaniConnection";
    readonly edges: ReadonlyArray<{
      readonly __typename: "ChalaniEdge";
      readonly node: {
        readonly __typename: "Chalani";
        readonly id: string;
        readonly subject: string;
        readonly status: ChalaniStatus;
        readonly createdAt: string;
        readonly recipient: {
          readonly __typename: "Recipient";
          readonly name: string;
        };
      };
    }>;
  };
};

export const DummyDocument = gql`
  query Dummy {
    __typename
  }
`;

/**
 * __useDummyQuery__
 *
 * To run a query within a React component, call `useDummyQuery` and pass it any options that fit your needs.
 * When your component renders, `useDummyQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDummyQuery({
 *   variables: {
 *   },
 * });
 */
export function useDummyQuery(
  baseOptions?: Apollo.QueryHookOptions<DummyQuery, DummyQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<DummyQuery, DummyQueryVariables>(
    DummyDocument,
    options,
  );
}
export function useDummyLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<DummyQuery, DummyQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<DummyQuery, DummyQueryVariables>(
    DummyDocument,
    options,
  );
}
export function useDummySuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<DummyQuery, DummyQueryVariables>,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<DummyQuery, DummyQueryVariables>(
    DummyDocument,
    options,
  );
}
export type DummyQueryHookResult = ReturnType<typeof useDummyQuery>;
export type DummyLazyQueryHookResult = ReturnType<typeof useDummyLazyQuery>;
export type DummySuspenseQueryHookResult = ReturnType<
  typeof useDummySuspenseQuery
>;
export type DummyQueryResult = Apollo.QueryResult<
  DummyQuery,
  DummyQueryVariables
>;
export const GetChalanisDocument = gql`
  query GetChalanis($pagination: PaginationInput) {
    chalanis(pagination: $pagination) {
      edges {
        cursor
        node {
          id
          subject
          status
          createdAt
          updatedAt
        }
      }
      pageInfo {
        page
        limit
        total
        totalPages
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

/**
 * __useGetChalanisQuery__
 *
 * To run a query within a React component, call `useGetChalanisQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChalanisQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChalanisQuery({
 *   variables: {
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useGetChalanisQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetChalanisQuery,
    GetChalanisQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetChalanisQuery, GetChalanisQueryVariables>(
    GetChalanisDocument,
    options,
  );
}
export function useGetChalanisLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetChalanisQuery,
    GetChalanisQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetChalanisQuery, GetChalanisQueryVariables>(
    GetChalanisDocument,
    options,
  );
}
export function useGetChalanisSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        GetChalanisQuery,
        GetChalanisQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetChalanisQuery, GetChalanisQueryVariables>(
    GetChalanisDocument,
    options,
  );
}
export type GetChalanisQueryHookResult = ReturnType<typeof useGetChalanisQuery>;
export type GetChalanisLazyQueryHookResult = ReturnType<
  typeof useGetChalanisLazyQuery
>;
export type GetChalanisSuspenseQueryHookResult = ReturnType<
  typeof useGetChalanisSuspenseQuery
>;
export type GetChalanisQueryResult = Apollo.QueryResult<
  GetChalanisQuery,
  GetChalanisQueryVariables
>;
export const MyChalaniInboxDocument = gql`
  query MyChalaniInbox($pagination: PaginationInput) {
    myChalaniInbox(pagination: $pagination) {
      edges {
        node {
          id
          subject
          status
          recipient {
            name
          }
          createdAt
        }
      }
    }
  }
`;

/**
 * __useMyChalaniInboxQuery__
 *
 * To run a query within a React component, call `useMyChalaniInboxQuery` and pass it any options that fit your needs.
 * When your component renders, `useMyChalaniInboxQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useMyChalaniInboxQuery({
 *   variables: {
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useMyChalaniInboxQuery(
  baseOptions?: Apollo.QueryHookOptions<
    MyChalaniInboxQuery,
    MyChalaniInboxQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<MyChalaniInboxQuery, MyChalaniInboxQueryVariables>(
    MyChalaniInboxDocument,
    options,
  );
}
export function useMyChalaniInboxLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    MyChalaniInboxQuery,
    MyChalaniInboxQueryVariables
  >,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<MyChalaniInboxQuery, MyChalaniInboxQueryVariables>(
    MyChalaniInboxDocument,
    options,
  );
}
export function useMyChalaniInboxSuspenseQuery(
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<
        MyChalaniInboxQuery,
        MyChalaniInboxQueryVariables
      >,
) {
  const options =
    baseOptions === Apollo.skipToken
      ? baseOptions
      : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    MyChalaniInboxQuery,
    MyChalaniInboxQueryVariables
  >(MyChalaniInboxDocument, options);
}
export type MyChalaniInboxQueryHookResult = ReturnType<
  typeof useMyChalaniInboxQuery
>;
export type MyChalaniInboxLazyQueryHookResult = ReturnType<
  typeof useMyChalaniInboxLazyQuery
>;
export type MyChalaniInboxSuspenseQueryHookResult = ReturnType<
  typeof useMyChalaniInboxSuspenseQuery
>;
export type MyChalaniInboxQueryResult = Apollo.QueryResult<
  MyChalaniInboxQuery,
  MyChalaniInboxQueryVariables
>;
