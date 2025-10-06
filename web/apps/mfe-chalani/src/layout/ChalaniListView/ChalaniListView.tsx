import React from "react";
import { Chalani, useGetChalanisQuery } from "@egov/api-types";
import {
  DataTable,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Button,
  InlineLoading,
} from "@carbon/react";
import { statusToTag } from "../../features/dashboard/helpers";
import dayjs from "dayjs";
import { useNavigate } from "@tanstack/react-router";

export function ChalaniListView() {
  const navigate = useNavigate();
  const { data, loading, error } = useGetChalanisQuery();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <InlineLoading
          description="Loading Chalani records..."
          status="active"
        />
      </div>
    );
  }

  if (error) {
    return (
      <p style={{ color: "red", padding: 16 }}>
        Error loading Chalani list: {error.message}
      </p>
    );
  }

  const rows = data?.chalanis ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h3>No Chalani records yet</h3>
        <p style={{ color: "#666" }}>
          Create your first Chalani to get started.
        </p>
      </div>
    );
  }

  return (
    <TableContainer title="चलानी सूची (Chalani List)">
      <Table size="md" useZebraStyles>
        <TableHead>
          <TableRow>
            <TableHeader>Subject</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Last Updated</TableHeader>
            <TableHeader>Action</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((c: Chalani) => {
            const tagProps = statusToTag(c.status);
            return (
              <TableRow key={c.id}>
                <TableCell>{c.subject}</TableCell>
                <TableCell>
                  <Tag type={tagProps.type}>{tagProps.children}</Tag>
                </TableCell>
                <TableCell>
                  {dayjs(c.updatedAt).format("YYYY-MM-DD HH:mm")}
                </TableCell>
                <TableCell>
                  <Button
                    kind="tertiary"
                    size="sm"
                    onClick={() => navigate({ to: `/chalani/${c.id}` })}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
