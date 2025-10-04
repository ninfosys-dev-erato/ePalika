// @ts-nocheck
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: string; output: string; }
  FiscalYear: { input: string; output: string; }
  JSON: { input: Record<string, any>; output: Record<string, any>; }
  Upload: { input: File; output: File; }
};

export type ActorType =
  | 'CAO'
  | 'CENTRAL_REGISTRY_CLERK'
  | 'CITIZEN'
  | 'MAYOR'
  | 'MUNICIPALITY_REGISTRY_ADMIN'
  | 'SECTION_HEAD'
  | 'SECTION_OFFICER'
  | 'WARD_CHAIR'
  | 'WARD_OFFICER'
  | 'WARD_REGISTRY_CLERK'
  | 'WARD_SECRETARY'
  | '%future added value';

export type AllocationStatus =
  | 'COMMITTED'
  | 'EXPIRED'
  | 'PROVISIONAL'
  | 'VOID'
  | '%future added value';

export type Applicant = {
  __typename?: 'Applicant';
  address?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  identificationNumber?: Maybe<Scalars['String']['output']>;
  organization?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  type: ApplicantType;
};

export type ApplicantInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  fullName: Scalars['String']['input'];
  identificationNumber?: InputMaybe<Scalars['String']['input']>;
  organization?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  type: ApplicantType;
};

export type ApplicantType =
  | 'CITIZEN'
  | 'GOVERNMENT_OFFICE'
  | 'ORGANIZATION'
  | 'OTHER'
  | '%future added value';

export type Approval = {
  __typename?: 'Approval';
  approvedAt: Scalars['DateTime']['output'];
  decision: ApprovalDecision;
  id: Scalars['ID']['output'];
  notes?: Maybe<Scalars['String']['output']>;
  signatory: Signatory;
};

export type ApprovalDecision =
  | 'APPROVED'
  | 'DELEGATED'
  | 'REJECTED'
  | '%future added value';

export type ApproveChalaniInput = {
  chalaniId: Scalars['ID']['input'];
  decision: ApprovalDecision;
  delegateToId?: InputMaybe<Scalars['ID']['input']>;
  notes?: InputMaybe<Scalars['String']['input']>;
};

export type Attachment = {
  __typename?: 'Attachment';
  checksum: Scalars['String']['output'];
  fileName: Scalars['String']['output'];
  fileSize: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  mimeType: Scalars['String']['output'];
  uploadedAt: Scalars['DateTime']['output'];
  uploadedBy: User;
  url: Scalars['String']['output'];
};

export type AuditEntry = {
  __typename?: 'AuditEntry';
  action: Scalars['String']['output'];
  actor: User;
  id: Scalars['ID']['output'];
  metadata?: Maybe<Scalars['JSON']['output']>;
  reason?: Maybe<Scalars['String']['output']>;
  timestamp: Scalars['DateTime']['output'];
};

export type CaseStatus =
  | 'ACKNOWLEDGED'
  | 'APPROVED'
  | 'CLOSED'
  | 'DISPATCHED'
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PENDING_REVIEW'
  | 'PENDING_TRIAGE'
  | 'VOID'
  | '%future added value';

export type Chalani = {
  __typename?: 'Chalani';
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  acknowledgedBy?: Maybe<Scalars['String']['output']>;
  acknowledgementProof?: Maybe<Attachment>;
  approvals: Array<Approval>;
  attachments: Array<Attachment>;
  auditTrail: Array<AuditEntry>;
  body: Scalars['String']['output'];
  chalaniNumber: Scalars['Int']['output'];
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  dispatchChannel?: Maybe<DispatchChannel>;
  dispatchedAt?: Maybe<Scalars['DateTime']['output']>;
  dispatchedBy?: Maybe<User>;
  fiscalYear: Scalars['FiscalYear']['output'];
  formattedChalaniNumber: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isAcknowledged: Scalars['Boolean']['output'];
  isFullyApproved: Scalars['Boolean']['output'];
  linkedDarta?: Maybe<Darta>;
  recipient: Recipient;
  requiredSignatories: Array<Signatory>;
  scope: Scope;
  status: CaseStatus;
  subject: Scalars['String']['output'];
  templateId?: Maybe<Scalars['ID']['output']>;
  trackingId?: Maybe<Scalars['String']['output']>;
  ward?: Maybe<Ward>;
};

export type ChalaniConnection = {
  __typename?: 'ChalaniConnection';
  edges: Array<ChalaniEdge>;
  pageInfo: PageInfo;
};

export type ChalaniEdge = {
  __typename?: 'ChalaniEdge';
  cursor: Scalars['String']['output'];
  node: Chalani;
};

export type ChalaniFilterInput = {
  createdById?: InputMaybe<Scalars['ID']['input']>;
  dispatchChannel?: InputMaybe<DispatchChannel>;
  fiscalYear?: InputMaybe<Scalars['FiscalYear']['input']>;
  fromDate?: InputMaybe<Scalars['DateTime']['input']>;
  isAcknowledged?: InputMaybe<Scalars['Boolean']['input']>;
  scope?: InputMaybe<Scope>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<CaseStatus>;
  toDate?: InputMaybe<Scalars['DateTime']['input']>;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};

export type ChalaniStats = {
  __typename?: 'ChalaniStats';
  acknowledgementRate: Scalars['Float']['output'];
  avgDispatchTime: Scalars['Float']['output'];
  byChannel: Array<DispatchChannelCount>;
  byStatus: Array<StatusCount>;
  total: Scalars['Int']['output'];
};

export type ChalaniTemplate = {
  __typename?: 'ChalaniTemplate';
  body: Scalars['String']['output'];
  category: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  requiredSignatories: Array<Role>;
  subject: Scalars['String']['output'];
};

export type ChannelCount = {
  __typename?: 'ChannelCount';
  channel: IntakeChannel;
  count: Scalars['Int']['output'];
};

export type CommitNumberInput = {
  allocationId: Scalars['ID']['input'];
  entityId: Scalars['ID']['input'];
  entityType: Scalars['String']['input'];
};

export type Counter = {
  __typename?: 'Counter';
  currentValue: Scalars['Int']['output'];
  fiscalYear: Scalars['FiscalYear']['output'];
  id: Scalars['ID']['output'];
  isLocked: Scalars['Boolean']['output'];
  lastIssuedAt?: Maybe<Scalars['DateTime']['output']>;
  lockedBy?: Maybe<User>;
  lockedReason?: Maybe<Scalars['String']['output']>;
  scope: Scope;
  type: CounterType;
  ward?: Maybe<Ward>;
};

export type CounterType =
  | 'CHALANI'
  | 'DARTA'
  | '%future added value';

export type CreateChalaniInput = {
  attachmentIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  body: Scalars['String']['input'];
  idempotencyKey: Scalars['String']['input'];
  linkedDartaId?: InputMaybe<Scalars['ID']['input']>;
  recipient: RecipientInput;
  requiredSignatoryIds: Array<Scalars['ID']['input']>;
  scope: Scope;
  subject: Scalars['String']['input'];
  templateId?: InputMaybe<Scalars['ID']['input']>;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};

export type CreateDartaInput = {
  annexIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  applicant: ApplicantInput;
  idempotencyKey: Scalars['String']['input'];
  intakeChannel: IntakeChannel;
  primaryDocumentId: Scalars['ID']['input'];
  priority?: InputMaybe<Priority>;
  receivedDate: Scalars['DateTime']['input'];
  scope: Scope;
  subject: Scalars['String']['input'];
  wardId?: InputMaybe<Scalars['ID']['input']>;
};

export type Darta = {
  __typename?: 'Darta';
  annexes: Array<Attachment>;
  applicant: Applicant;
  assignedTo?: Maybe<OrganizationalUnit>;
  auditTrail: Array<AuditEntry>;
  backdateApprover?: Maybe<User>;
  backdateReason?: Maybe<Scalars['String']['output']>;
  chalaniResponses: Array<Chalani>;
  createdAt: Scalars['DateTime']['output'];
  createdBy: User;
  currentAssignee?: Maybe<User>;
  dartaNumber: Scalars['Int']['output'];
  entryDate: Scalars['DateTime']['output'];
  fiscalYear: Scalars['FiscalYear']['output'];
  formattedDartaNumber: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  intakeChannel: IntakeChannel;
  isBackdated: Scalars['Boolean']['output'];
  isOverdue: Scalars['Boolean']['output'];
  primaryDocument: Attachment;
  priority: Priority;
  receivedDate: Scalars['DateTime']['output'];
  relatedDarta: Array<Darta>;
  scope: Scope;
  slaDeadline?: Maybe<Scalars['DateTime']['output']>;
  status: CaseStatus;
  subject: Scalars['String']['output'];
  ward?: Maybe<Ward>;
};

export type DartaConnection = {
  __typename?: 'DartaConnection';
  edges: Array<DartaEdge>;
  pageInfo: PageInfo;
};

export type DartaEdge = {
  __typename?: 'DartaEdge';
  cursor: Scalars['String']['output'];
  node: Darta;
};

export type DartaFilterInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  fiscalYear?: InputMaybe<Scalars['FiscalYear']['input']>;
  fromDate?: InputMaybe<Scalars['DateTime']['input']>;
  intakeChannel?: InputMaybe<IntakeChannel>;
  isOverdue?: InputMaybe<Scalars['Boolean']['input']>;
  organizationalUnitId?: InputMaybe<Scalars['ID']['input']>;
  priority?: InputMaybe<Priority>;
  scope?: InputMaybe<Scope>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<CaseStatus>;
  toDate?: InputMaybe<Scalars['DateTime']['input']>;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};

export type DartaStats = {
  __typename?: 'DartaStats';
  avgProcessingTime: Scalars['Float']['output'];
  byChannel: Array<ChannelCount>;
  byStatus: Array<StatusCount>;
  overdueCount: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type DispatchChalaniInput = {
  chalaniId: Scalars['ID']['input'];
  dispatchChannel: DispatchChannel;
  scheduledDispatchAt?: InputMaybe<Scalars['DateTime']['input']>;
  trackingId?: InputMaybe<Scalars['String']['input']>;
};

export type DispatchChannel =
  | 'COURIER'
  | 'EMAIL'
  | 'HAND_DELIVERY'
  | 'POSTAL'
  | '%future added value';

export type DispatchChannelCount = {
  __typename?: 'DispatchChannelCount';
  channel: DispatchChannel;
  count: Scalars['Int']['output'];
};

export type IntakeChannel =
  | 'COUNTER'
  | 'COURIER'
  | 'EDARTA_PORTAL'
  | 'EMAIL'
  | 'POSTAL'
  | '%future added value';

export type Mutation = {
  __typename?: 'Mutation';
  allocateNumber: NumberAllocation;
  approveChalani: Chalani;
  commitNumber: NumberAllocation;
  createChalani: Chalani;
  createDarta: Darta;
  dispatchChalani: Chalani;
  reviewDarta: Darta;
  routeDarta: Darta;
  voidChalani: Chalani;
  voidDarta: Darta;
  voidNumber: NumberAllocation;
};


export type MutationAllocateNumberArgs = {
  input: NumberAllocationInput;
};


export type MutationApproveChalaniArgs = {
  input: ApproveChalaniInput;
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


export type MutationDispatchChalaniArgs = {
  input: DispatchChalaniInput;
};


export type MutationReviewDartaArgs = {
  input: ReviewDartaInput;
};


export type MutationRouteDartaArgs = {
  input: RouteDartaInput;
};


export type MutationVoidChalaniArgs = {
  chalaniId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationVoidDartaArgs = {
  dartaId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};


export type MutationVoidNumberArgs = {
  input: VoidNumberInput;
};

export type NumberAllocation = {
  __typename?: 'NumberAllocation';
  allocatedAt: Scalars['DateTime']['output'];
  allocatedBy: User;
  expiresAt?: Maybe<Scalars['DateTime']['output']>;
  fiscalYear: Scalars['FiscalYear']['output'];
  formattedNumber: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  number: Scalars['Int']['output'];
  scope: Scope;
  status: AllocationStatus;
  type: CounterType;
  ward?: Maybe<Ward>;
};

export type NumberAllocationInput = {
  fiscalYear: Scalars['FiscalYear']['input'];
  idempotencyKey: Scalars['String']['input'];
  scope: Scope;
  type: CounterType;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};

export type OrganizationalUnit = {
  __typename?: 'OrganizationalUnit';
  children: Array<OrganizationalUnit>;
  code: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  parent?: Maybe<OrganizationalUnit>;
  type: UnitType;
};

export type PageInfo = {
  __typename?: 'PageInfo';
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PaginationInput = {
  limit?: Scalars['Int']['input'];
  page?: Scalars['Int']['input'];
};

export type Priority =
  | 'HIGH'
  | 'LOW'
  | 'MEDIUM'
  | 'URGENT'
  | '%future added value';

export type Query = {
  __typename?: 'Query';
  chalani?: Maybe<Chalani>;
  chalaniByNumber?: Maybe<Chalani>;
  chalaniStats: ChalaniStats;
  chalaniTemplates: Array<ChalaniTemplate>;
  chalanis: ChalaniConnection;
  counter?: Maybe<Counter>;
  counters: Array<Counter>;
  darta?: Maybe<Darta>;
  dartaByNumber?: Maybe<Darta>;
  dartaStats: DartaStats;
  dartas: DartaConnection;
  me: User;
  myDartas: DartaConnection;
  myPendingApprovals: ChalaniConnection;
  numberAllocation?: Maybe<NumberAllocation>;
  user?: Maybe<User>;
  users: Array<User>;
};


export type QueryChalaniArgs = {
  id: Scalars['ID']['input'];
};


export type QueryChalaniByNumberArgs = {
  chalaniNumber: Scalars['Int']['input'];
  fiscalYear: Scalars['FiscalYear']['input'];
  scope: Scope;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryChalaniStatsArgs = {
  fiscalYear?: InputMaybe<Scalars['FiscalYear']['input']>;
  scope?: InputMaybe<Scope>;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryChalaniTemplatesArgs = {
  category?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};


export type QueryChalanisArgs = {
  filter?: InputMaybe<ChalaniFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryCounterArgs = {
  fiscalYear: Scalars['FiscalYear']['input'];
  scope: Scope;
  type: CounterType;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryCountersArgs = {
  fiscalYear?: InputMaybe<Scalars['FiscalYear']['input']>;
  scope?: InputMaybe<Scope>;
};


export type QueryDartaArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDartaByNumberArgs = {
  dartaNumber: Scalars['Int']['input'];
  fiscalYear: Scalars['FiscalYear']['input'];
  scope: Scope;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryDartaStatsArgs = {
  fiscalYear?: InputMaybe<Scalars['FiscalYear']['input']>;
  scope?: InputMaybe<Scope>;
  wardId?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryDartasArgs = {
  filter?: InputMaybe<DartaFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryMyDartasArgs = {
  pagination?: InputMaybe<PaginationInput>;
  status?: InputMaybe<CaseStatus>;
};


export type QueryMyPendingApprovalsArgs = {
  pagination?: InputMaybe<PaginationInput>;
};


export type QueryNumberAllocationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Recipient = {
  __typename?: 'Recipient';
  address: Scalars['String']['output'];
  email?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  type: RecipientType;
};

export type RecipientInput = {
  address: Scalars['String']['input'];
  email?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organization?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
  type: RecipientType;
};

export type RecipientType =
  | 'CITIZEN'
  | 'GOVERNMENT_OFFICE'
  | 'ORGANIZATION'
  | 'OTHER'
  | '%future added value';

export type ReviewDartaInput = {
  dartaId: Scalars['ID']['input'];
  decision: ReviewDecision;
  notes: Scalars['String']['input'];
  requestedInfo?: InputMaybe<Scalars['String']['input']>;
};

export type ReviewDecision =
  | 'APPROVE'
  | 'FORWARD'
  | 'REJECT'
  | 'REQUEST_INFO'
  | '%future added value';

export type Role = {
  __typename?: 'Role';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
};

export type RouteDartaInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  dartaId: Scalars['ID']['input'];
  notes?: InputMaybe<Scalars['String']['input']>;
  organizationalUnitId: Scalars['ID']['input'];
  priority?: InputMaybe<Priority>;
  slaHours?: InputMaybe<Scalars['Int']['input']>;
};

export type Scope =
  | 'MUNICIPALITY'
  | 'WARD'
  | '%future added value';

export type Signatory = {
  __typename?: 'Signatory';
  id: Scalars['ID']['output'];
  isRequired: Scalars['Boolean']['output'];
  order: Scalars['Int']['output'];
  role: Role;
  user: User;
};

export type StatusCount = {
  __typename?: 'StatusCount';
  count: Scalars['Int']['output'];
  status: CaseStatus;
};

export type UnitType =
  | 'DEPARTMENT'
  | 'SECTION'
  | 'UNIT'
  | '%future added value';

export type User = {
  __typename?: 'User';
  actorType: ActorType;
  email: Scalars['String']['output'];
  fullName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Boolean']['output'];
  lastLogin?: Maybe<Scalars['DateTime']['output']>;
  organizationalUnit?: Maybe<OrganizationalUnit>;
  phone?: Maybe<Scalars['String']['output']>;
  roles: Array<Role>;
  username: Scalars['String']['output'];
  ward?: Maybe<Ward>;
};

export type VoidNumberInput = {
  allocationId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};

export type Ward = {
  __typename?: 'Ward';
  id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  number: Scalars['Int']['output'];
};

export type DartasQueryVariables = Exact<{
  filter?: InputMaybe<DartaFilterInput>;
  pagination?: InputMaybe<PaginationInput>;
}>;


export type DartasQuery = { __typename?: 'Query', dartas: { __typename?: 'DartaConnection', edges: Array<{ __typename?: 'DartaEdge', cursor: string, node: { __typename?: 'Darta', id: string, dartaNumber: number, formattedDartaNumber: string, fiscalYear: string, scope: Scope, subject: string, intakeChannel: IntakeChannel, receivedDate: string, priority: Priority, status: CaseStatus, isOverdue: boolean, createdAt: string, ward?: { __typename?: 'Ward', id: string, name: string } | null, applicant: { __typename?: 'Applicant', id: string, fullName: string, type: ApplicantType } } }>, pageInfo: { __typename?: 'PageInfo', page: number, limit: number, total: number, totalPages: number, hasNextPage: boolean, hasPreviousPage: boolean } } };

export type DartaQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DartaQuery = { __typename?: 'Query', darta?: { __typename?: 'Darta', id: string, dartaNumber: number, formattedDartaNumber: string, fiscalYear: string, scope: Scope, subject: string, intakeChannel: IntakeChannel, receivedDate: string, priority: Priority, status: CaseStatus, isOverdue: boolean, createdAt: string, ward?: { __typename?: 'Ward', id: string, name: string } | null, applicant: { __typename?: 'Applicant', id: string, fullName: string, phone?: string | null, email?: string | null, type: ApplicantType } } | null };

export type CreateDartaMutationVariables = Exact<{
  input: CreateDartaInput;
}>;


export type CreateDartaMutation = { __typename?: 'Mutation', createDarta: { __typename?: 'Darta', id: string, dartaNumber: number, formattedDartaNumber: string, fiscalYear: string, scope: Scope, subject: string, intakeChannel: IntakeChannel, status: CaseStatus, createdAt: string, applicant: { __typename?: 'Applicant', id: string, fullName: string, phone?: string | null, type: ApplicantType } } };

export type RouteDartaMutationVariables = Exact<{
  input: RouteDartaInput;
}>;


export type RouteDartaMutation = { __typename?: 'Mutation', routeDarta: { __typename?: 'Darta', id: string, status: CaseStatus, priority: Priority, createdAt: string } };


export const DartasDocument = gql`
    query Dartas($filter: DartaFilterInput, $pagination: PaginationInput) {
  dartas(filter: $filter, pagination: $pagination) {
    edges {
      cursor
      node {
        id
        dartaNumber
        formattedDartaNumber
        fiscalYear
        scope
        ward {
          id
          name
        }
        subject
        applicant {
          id
          fullName
          type
        }
        intakeChannel
        receivedDate
        priority
        status
        isOverdue
        createdAt
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
 * __useDartasQuery__
 *
 * To run a query within a React component, call `useDartasQuery` and pass it any options that fit your needs.
 * When your component renders, `useDartasQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDartasQuery({
 *   variables: {
 *      filter: // value for 'filter'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useDartasQuery(baseOptions?: Apollo.QueryHookOptions<DartasQuery, DartasQueryVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DartasQuery, DartasQueryVariables>(DartasDocument, options);
      }
export function useDartasLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DartasQuery, DartasQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DartasQuery, DartasQueryVariables>(DartasDocument, options);
        }
export function useDartasSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DartasQuery, DartasQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DartasQuery, DartasQueryVariables>(DartasDocument, options);
        }
export type DartasQueryHookResult = ReturnType<typeof useDartasQuery>;
export type DartasLazyQueryHookResult = ReturnType<typeof useDartasLazyQuery>;
export type DartasSuspenseQueryHookResult = ReturnType<typeof useDartasSuspenseQuery>;
export type DartasQueryResult = Apollo.QueryResult<DartasQuery, DartasQueryVariables>;
export const DartaDocument = gql`
    query Darta($id: ID!) {
  darta(id: $id) {
    id
    dartaNumber
    formattedDartaNumber
    fiscalYear
    scope
    ward {
      id
      name
    }
    subject
    applicant {
      id
      fullName
      phone
      email
      type
    }
    intakeChannel
    receivedDate
    priority
    status
    isOverdue
    createdAt
  }
}
    `;

/**
 * __useDartaQuery__
 *
 * To run a query within a React component, call `useDartaQuery` and pass it any options that fit your needs.
 * When your component renders, `useDartaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDartaQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDartaQuery(baseOptions: Apollo.QueryHookOptions<DartaQuery, DartaQueryVariables> & ({ variables: DartaQueryVariables; skip?: boolean; } | { skip: boolean; }) ) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useQuery<DartaQuery, DartaQueryVariables>(DartaDocument, options);
      }
export function useDartaLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<DartaQuery, DartaQueryVariables>) {
          const options = {...defaultOptions, ...baseOptions}
          return Apollo.useLazyQuery<DartaQuery, DartaQueryVariables>(DartaDocument, options);
        }
export function useDartaSuspenseQuery(baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<DartaQuery, DartaQueryVariables>) {
          const options = baseOptions === Apollo.skipToken ? baseOptions : {...defaultOptions, ...baseOptions}
          return Apollo.useSuspenseQuery<DartaQuery, DartaQueryVariables>(DartaDocument, options);
        }
export type DartaQueryHookResult = ReturnType<typeof useDartaQuery>;
export type DartaLazyQueryHookResult = ReturnType<typeof useDartaLazyQuery>;
export type DartaSuspenseQueryHookResult = ReturnType<typeof useDartaSuspenseQuery>;
export type DartaQueryResult = Apollo.QueryResult<DartaQuery, DartaQueryVariables>;
export const CreateDartaDocument = gql`
    mutation CreateDarta($input: CreateDartaInput!) {
  createDarta(input: $input) {
    id
    dartaNumber
    formattedDartaNumber
    fiscalYear
    scope
    subject
    applicant {
      id
      fullName
      phone
      type
    }
    intakeChannel
    status
    createdAt
  }
}
    `;
export type CreateDartaMutationFn = Apollo.MutationFunction<CreateDartaMutation, CreateDartaMutationVariables>;

/**
 * __useCreateDartaMutation__
 *
 * To run a mutation, you first call `useCreateDartaMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDartaMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDartaMutation, { data, loading, error }] = useCreateDartaMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useCreateDartaMutation(baseOptions?: Apollo.MutationHookOptions<CreateDartaMutation, CreateDartaMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<CreateDartaMutation, CreateDartaMutationVariables>(CreateDartaDocument, options);
      }
export type CreateDartaMutationHookResult = ReturnType<typeof useCreateDartaMutation>;
export type CreateDartaMutationResult = Apollo.MutationResult<CreateDartaMutation>;
export type CreateDartaMutationOptions = Apollo.BaseMutationOptions<CreateDartaMutation, CreateDartaMutationVariables>;
export const RouteDartaDocument = gql`
    mutation RouteDarta($input: RouteDartaInput!) {
  routeDarta(input: $input) {
    id
    status
    priority
    createdAt
  }
}
    `;
export type RouteDartaMutationFn = Apollo.MutationFunction<RouteDartaMutation, RouteDartaMutationVariables>;

/**
 * __useRouteDartaMutation__
 *
 * To run a mutation, you first call `useRouteDartaMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRouteDartaMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [routeDartaMutation, { data, loading, error }] = useRouteDartaMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRouteDartaMutation(baseOptions?: Apollo.MutationHookOptions<RouteDartaMutation, RouteDartaMutationVariables>) {
        const options = {...defaultOptions, ...baseOptions}
        return Apollo.useMutation<RouteDartaMutation, RouteDartaMutationVariables>(RouteDartaDocument, options);
      }
export type RouteDartaMutationHookResult = ReturnType<typeof useRouteDartaMutation>;
export type RouteDartaMutationResult = Apollo.MutationResult<RouteDartaMutation>;
export type RouteDartaMutationOptions = Apollo.BaseMutationOptions<RouteDartaMutation, RouteDartaMutationVariables>;