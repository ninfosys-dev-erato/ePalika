import React from "react";
import { useParams } from "@tanstack/react-router";
import {
  InlineLoading,
  Tag,
  Button,
  Tile,
  Breadcrumb,
  BreadcrumbItem,
} from "@carbon/react";
import { useChalaniDetailQuery } from "@egov/api-types";
import { statusToTag } from "../../features/dashboard/helpers";
import dayjs from "dayjs";

export function ChalaniDetailView() {
  const { id } = useParams({ from: "/chalani/$id" }) as { id: string };
  const { data, loading, error, refetch } = useChalaniDetailQuery({
    variables: { id },
  });

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <InlineLoading
          description="Loading Chalani details..."
          status="active"
        />
      </div>
    );

  if (error)
    return (
      <div style={{ padding: 16, color: "red" }}>
        Failed to load Chalani : {error.message}
      </div>
    );

  const c = data?.chalani;
  if (!c)
    return (
      <div className="p-6 text-center text-gray-600">
        Chalani not found or deleted.
      </div>
    );

  const tagProps = statusToTag(c.status);

  return (
    <div className="space-y-6 p-6">
      {/* ▒▒ Breadcrumbs ▒▒ */}
      <Breadcrumb noTrailingSlash>
        <BreadcrumbItem href="/chalani">Chalani</BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>{c.subject}</BreadcrumbItem>
      </Breadcrumb>

      {/* ▒▒ Header ▒▒ */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{c.subject}</h2>
          <p className="text-gray-600">
            Fiscal Year {c.fiscalYear} • Recipient – {c.recipient.name}
          </p>
        </div>
        <Tag type={tagProps.type}>{tagProps.children}</Tag>
      </div>

      {/* ▒▒ Body ▒▒ */}
      <Tile className="p-4 bg-layer-01">
        <p className="whitespace-pre-wrap">{c.body}</p>
      </Tile>

      {/* ▒▒ Meta ▒▒ */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
        <div>Created At : {dayjs(c.createdAt).format("YYYY-MM-DD HH:mm")}</div>
        <div>Updated At : {dayjs(c.updatedAt).format("YYYY-MM-DD HH:mm")}</div>
        <div>Recipient Address : {c.recipient.address}</div>
      </div>

      {/* ▒▒ Allowed Actions ▒▒ */}
      {c.allowedActions?.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-4">
          {c.allowedActions.map((a) => (
            <Button
              key={a}
              kind="primary"
              size="sm"
              onClick={() => console.log("Trigger → ", a)}
            >
              {a.replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      )}

      {/* ▒▒ Audit Trail ▒▒ */}
      <div className="pt-8">
        <h4 className="text-lg font-medium mb-3">Audit Trail</h4>
        <div className="border-l border-gray-300 pl-4 space-y-3">
          {c.auditTrail.map((a) => (
            <div key={a.id}>
              <div className="text-sm">
                <strong>{a.actor.fullName}</strong> → {a.action}
              </div>
              <div className="text-xs text-gray-600">
                {a.fromStatus} → {a.toStatus} |{" "}
                {dayjs(a.timestamp).format("HH:mm DD-MMM-YY")}
              </div>
              {a.reason && (
                <div className="text-xs text-red-600 italic">
                  Reason: {a.reason}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ▒▒ Footer refresh ▒▒ */}
      <div className="pt-8">
        <Button kind="ghost" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
