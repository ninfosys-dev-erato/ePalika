/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query Dartas($filter: DartaFilterInput, $pagination: PaginationInput) {\n  dartas(filter: $filter, pagination: $pagination) {\n    edges {\n      cursor\n      node {\n        id\n        dartaNumber\n        formattedDartaNumber\n        fiscalYear\n        scope\n        ward {\n          id\n          name\n        }\n        subject\n        applicant {\n          id\n          fullName\n          type\n        }\n        intakeChannel\n        receivedDate\n        priority\n        status\n        isOverdue\n        createdAt\n      }\n    }\n    pageInfo {\n      page\n      limit\n      total\n      totalPages\n      hasNextPage\n      hasPreviousPage\n    }\n  }\n}\n\nquery Darta($id: ID!) {\n  darta(id: $id) {\n    id\n    dartaNumber\n    formattedDartaNumber\n    fiscalYear\n    scope\n    ward {\n      id\n      name\n    }\n    subject\n    applicant {\n      id\n      fullName\n      phone\n      email\n      type\n    }\n    intakeChannel\n    receivedDate\n    priority\n    status\n    isOverdue\n    createdAt\n  }\n}\n\nmutation CreateDarta($input: CreateDartaInput!) {\n  createDarta(input: $input) {\n    id\n    dartaNumber\n    formattedDartaNumber\n    fiscalYear\n    scope\n    subject\n    applicant {\n      id\n      fullName\n      phone\n      type\n    }\n    intakeChannel\n    status\n    createdAt\n  }\n}\n\nmutation RouteDarta($input: RouteDartaInput!) {\n  routeDarta(input: $input) {\n    id\n    status\n    priority\n    createdAt\n  }\n}": typeof types.DartasDocument,
};
const documents: Documents = {
    "query Dartas($filter: DartaFilterInput, $pagination: PaginationInput) {\n  dartas(filter: $filter, pagination: $pagination) {\n    edges {\n      cursor\n      node {\n        id\n        dartaNumber\n        formattedDartaNumber\n        fiscalYear\n        scope\n        ward {\n          id\n          name\n        }\n        subject\n        applicant {\n          id\n          fullName\n          type\n        }\n        intakeChannel\n        receivedDate\n        priority\n        status\n        isOverdue\n        createdAt\n      }\n    }\n    pageInfo {\n      page\n      limit\n      total\n      totalPages\n      hasNextPage\n      hasPreviousPage\n    }\n  }\n}\n\nquery Darta($id: ID!) {\n  darta(id: $id) {\n    id\n    dartaNumber\n    formattedDartaNumber\n    fiscalYear\n    scope\n    ward {\n      id\n      name\n    }\n    subject\n    applicant {\n      id\n      fullName\n      phone\n      email\n      type\n    }\n    intakeChannel\n    receivedDate\n    priority\n    status\n    isOverdue\n    createdAt\n  }\n}\n\nmutation CreateDarta($input: CreateDartaInput!) {\n  createDarta(input: $input) {\n    id\n    dartaNumber\n    formattedDartaNumber\n    fiscalYear\n    scope\n    subject\n    applicant {\n      id\n      fullName\n      phone\n      type\n    }\n    intakeChannel\n    status\n    createdAt\n  }\n}\n\nmutation RouteDarta($input: RouteDartaInput!) {\n  routeDarta(input: $input) {\n    id\n    status\n    priority\n    createdAt\n  }\n}": types.DartasDocument,
};

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = gql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function gql(source: string): unknown;

/**
 * The gql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function gql(source: "query Dartas($filter: DartaFilterInput, $pagination: PaginationInput) {\n  dartas(filter: $filter, pagination: $pagination) {\n    edges {\n      cursor\n      node {\n        id\n        dartaNumber\n        formattedDartaNumber\n        fiscalYear\n        scope\n        ward {\n          id\n          name\n        }\n        subject\n        applicant {\n          id\n          fullName\n          type\n        }\n        intakeChannel\n        receivedDate\n        priority\n        status\n        isOverdue\n        createdAt\n      }\n    }\n    pageInfo {\n      page\n      limit\n      total\n      totalPages\n      hasNextPage\n      hasPreviousPage\n    }\n  }\n}\n\nquery Darta($id: ID!) {\n  darta(id: $id) {\n    id\n    dartaNumber\n    formattedDartaNumber\n    fiscalYear\n    scope\n    ward {\n      id\n      name\n    }\n    subject\n    applicant {\n      id\n      fullName\n      phone\n      email\n      type\n    }\n    intakeChannel\n    receivedDate\n    priority\n    status\n    isOverdue\n    createdAt\n  }\n}\n\nmutation CreateDarta($input: CreateDartaInput!) {\n  createDarta(input: $input) {\n    id\n    dartaNumber\n    formattedDartaNumber\n    fiscalYear\n    scope\n    subject\n    applicant {\n      id\n      fullName\n      phone\n      type\n    }\n    intakeChannel\n    status\n    createdAt\n  }\n}\n\nmutation RouteDarta($input: RouteDartaInput!) {\n  routeDarta(input: $input) {\n    id\n    status\n    priority\n    createdAt\n  }\n}"): (typeof documents)["query Dartas($filter: DartaFilterInput, $pagination: PaginationInput) {\n  dartas(filter: $filter, pagination: $pagination) {\n    edges {\n      cursor\n      node {\n        id\n        dartaNumber\n        formattedDartaNumber\n        fiscalYear\n        scope\n        ward {\n          id\n          name\n        }\n        subject\n        applicant {\n          id\n          fullName\n          type\n        }\n        intakeChannel\n        receivedDate\n        priority\n        status\n        isOverdue\n        createdAt\n      }\n    }\n    pageInfo {\n      page\n      limit\n      total\n      totalPages\n      hasNextPage\n      hasPreviousPage\n    }\n  }\n}\n\nquery Darta($id: ID!) {\n  darta(id: $id) {\n    id\n    dartaNumber\n    formattedDartaNumber\n    fiscalYear\n    scope\n    ward {\n      id\n      name\n    }\n    subject\n    applicant {\n      id\n      fullName\n      phone\n      email\n      type\n    }\n    intakeChannel\n    receivedDate\n    priority\n    status\n    isOverdue\n    createdAt\n  }\n}\n\nmutation CreateDarta($input: CreateDartaInput!) {\n  createDarta(input: $input) {\n    id\n    dartaNumber\n    formattedDartaNumber\n    fiscalYear\n    scope\n    subject\n    applicant {\n      id\n      fullName\n      phone\n      type\n    }\n    intakeChannel\n    status\n    createdAt\n  }\n}\n\nmutation RouteDarta($input: RouteDartaInput!) {\n  routeDarta(input: $input) {\n    id\n    status\n    priority\n    createdAt\n  }\n}"];

export function gql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;