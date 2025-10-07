import React from "react";
import { useParams } from "@tanstack/react-router";
import {
  InlineLoading,
  Tag,
  Button,
  Tile,
  Breadcrumb,
  BreadcrumbItem,
  ToastNotification,
} from "@carbon/react";
import {
  useChalaniDetailQuery,
  useSubmitChalaniMutation,
  useApproveChalaniMutation,
  useDispatchChalaniMutation,
} from "@egov/api-types";
import { statusToTag } from "../../features/dashboard/helpers";
import dayjs from "dayjs";

/**
 * ChalaniDetailView — Enterprise interactive detail screen
 * --------------------------------------------------------
 * ✅ Fetches detail via GraphQL
 * ✅ Executes lifecycle actions (SUBMIT, APPROVE, DISPATCH)
 * ✅ Shows audit trail with actor + transitions
 * ✅ Inline feedback + toast notifications
 */
export function ChalaniDetailView() {
  const { id } = useParams({ from: "/chalani/$id" }) as { id: string };

  // 🧠 Queries
  const { data, loading, error, refetch } = useChalaniDetailQuery({
    variables: { id },
    fetchPolicy: "cache-and-network",
  });

  // ⚙️ Mutations (expandable)
  const [submitChalani] = useSubmitChalaniMutation();
  const [approveChalani] = useApproveChalaniMutation();
  const [dispatchChalani] = useDispatchChalaniMutation();

  // 🌐 UI state
  const [activeAction, setActiveAction] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{
    kind: "success" | "error";
    msg: string;
  } | null>(null);

  // 🚀 Action runner
  async function handleAction(a: string) {
    try {
      setActiveAction(a);
      switch (a) {
        case "SUBMIT":
          await submitChalani({ variables: { chalaniId: id } });
          break;
        case "APPROVE":
          await approveChalani({
            variables: { input: { chalaniId: id, decision: "APPROVE" } },
          });
          break;
        case "DISPATCH":
          await dispatchChalani({
            variables: {
              input: { chalaniId: id, dispatchChannel: "POST" },
            },
          });
          break;
        default:
          throw new Error(`Unhandled Chalani action: ${a}`);
      }
      setFeedback({ kind: "success", msg: `${a} successful` });
      await refetch();
    } catch (err: any) {
      setFeedback({ kind: "error", msg: err.message });
    } finally {
      setActiveAction(null);
    }
  }

  // 🌀 Loading
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <InlineLoading
          description="Loading Chalani details..."
          status="active"
        />
      </div>
    );

  // ❌ Error
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

  // =====================================================================
  // 🧩 UI Render
  // =====================================================================
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
            Fiscal Year {c.fiscalYear} • Recipient – {c.recipient?.name}
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
        <div>Recipient Address : {c.recipient?.address}</div>
      </div>

      {/* ▒▒ Allowed Actions ▒▒ */}
      {c.allowedActions?.length > 0 && (
        <div className="flex flex-wrap gap-3 pt-4">
          {c.allowedActions.map((a) => (
            <Button
              key={a}
              kind="primary"
              size="sm"
              disabled={!!activeAction}
              onClick={() => handleAction(a)}
            >
              {activeAction === a ? (
                <InlineLoading
                  description={`Running ${a.toLowerCase()}...`}
                  status="active"
                />
              ) : (
                a.replace(/_/g, " ")
              )}
            </Button>
          ))}
        </div>
      )}

      {/* ▒▒ Feedback ▒▒ */}
      {feedback && (
        <ToastNotification
          kind={feedback.kind}
          title={feedback.msg}
          timeout={4000}
          onClose={() => setFeedback(null)}
          lowContrast
        />
      )}

      {/* ▒▒ Audit Trail ▒▒ */}
      {c.auditTrail && c.auditTrail.length > 0 && (
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
      )}

      {/* ▒▒ Footer refresh ▒▒ */}
      <div className="pt-8">
        <Button kind="ghost" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
