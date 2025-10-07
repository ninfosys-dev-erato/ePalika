import {
  useSubmitChalaniActionMutation,
  useReviewChalaniMutation,
  useApproveChalaniMutation,
  useReserveChalaniNumberMutation,
  useFinalizeChalaniRegistrationMutation,
  useDirectRegisterChalaniMutation,
  useSignChalaniMutation,
  useSealChalaniMutation,
  useDispatchChalaniMutation,
  useMarkChalaniInTransitMutation,
  useAcknowledgeChalaniMutation,
  useMarkChalaniDeliveredMutation,
  useMarkChalaniReturnedUndeliveredMutation,
  useResendChalaniMutation,
  useVoidChalaniMutation,
  useSupersedeChalaniMutation,
  useCloseChalaniMutation,
  type DispatchChannel,
} from "@egov/api-types";

/**
 * Enterprise action dispatcher.
 * Uses tiny prompts for demo; swap with proper modals later.
 */
export function useChalaniActions() {
  const [submit] = useSubmitChalaniActionMutation();
  const [review] = useReviewChalaniMutation();
  const [approve] = useApproveChalaniMutation();
  const [reserveNo] = useReserveChalaniNumberMutation();
  const [finalize] = useFinalizeChalaniRegistrationMutation();
  const [directRegister] = useDirectRegisterChalaniMutation();
  const [sign] = useSignChalaniMutation();
  const [seal] = useSealChalaniMutation();
  const [dispatchM] = useDispatchChalaniMutation();
  const [markTransit] = useMarkChalaniInTransitMutation();
  const [ack] = useAcknowledgeChalaniMutation();
  const [deliver] = useMarkChalaniDeliveredMutation();
  const [returned] = useMarkChalaniReturnedUndeliveredMutation();
  const [resend] = useResendChalaniMutation();
  const [voidM] = useVoidChalaniMutation();
  const [supercede] = useSupersedeChalaniMutation();
  const [close] = useCloseChalaniMutation();

  async function run(action: string, chalaniId: string) {
    switch (action) {
      // ----- Review phase
      case "SUBMIT":
        return submit({ variables: { chalaniId } });

      case "EDIT_REQUIRED": {
        const notes = window.prompt("Reviewer notes (optional):") || undefined;
        return review({
          variables: {
            input: { chalaniId, decision: "EDIT_REQUIRED", notes },
          },
        });
      }

      case "APPROVE_REVIEW": {
        const notes = window.prompt("Review notes (optional):") || undefined;
        return review({
          variables: {
            input: { chalaniId, decision: "APPROVE_REVIEW", notes },
          },
        });
      }

      // ----- Approval + Registration
      case "APPROVE": {
        const notes = window.prompt("Approval notes (optional):") || undefined;
        return approve({
          variables: {
            input: { chalaniId, decision: "APPROVE", notes },
          },
        });
      }

      case "REJECT": {
        const reason = window.prompt("Rejection reason (required):");
        if (!reason?.trim()) throw new Error("Rejection reason is required");
        return approve({
          variables: {
            input: { chalaniId, decision: "REJECT", reason },
          },
        });
      }

      case "RESERVE_NO": {
        const allocationId =
          window.prompt("Allocation ID (e.g., ALLOC-001):") || "ALLOC-001";
        return reserveNo({
          variables: { input: { chalaniId, allocationId } },
        });
      }

      case "FINALIZE": {
        const allocationId =
          window.prompt("Allocation ID used to reserve:") || "ALLOC-001";
        return finalize({
          variables: { input: { chalaniId, allocationId } },
        });
      }

      case "DIRECT_REGISTER":
        return directRegister({ variables: { input: { chalaniId } } });

      // ----- Signing & Sealing
      case "SIGN": {
        const signatureAttachmentId =
          window.prompt("Signature attachment ID (optional):") || undefined;
        return sign({ variables: { input: { chalaniId, signatureAttachmentId } } });
      }

      case "SEAL": {
        const sealAttachmentId =
          window.prompt("Seal attachment ID (optional):") || undefined;
        return seal({ variables: { input: { chalaniId, sealAttachmentId } } });
      }

      // ----- Dispatch & Delivery
      case "DISPATCH": {
        const channel = (window.prompt(
          "Dispatch channel [POST|DIGITAL]:",
          "POST"
        ) || "POST") as DispatchChannel;
        const trackingId =
          channel === "POST"
            ? window.prompt("Tracking ID (optional):") || undefined
            : undefined;
        const courierName =
          channel === "POST"
            ? window.prompt("Courier name (optional):", "Nepal Post") || undefined
            : undefined;

        return dispatchM({
          variables: {
            input: { chalaniId, dispatchChannel: channel, trackingId, courierName },
          },
        });
      }

      case "MARK_IN_TRANSIT": {
        const trackingId = window.prompt("Tracking ID (optional):") || undefined;
        const courierName =
          window.prompt("Courier Name (optional):", "Nepal Post") || undefined;
        return markTransit({
          variables: { input: { chalaniId, trackingId, courierName } },
        });
      }

      case "ACKNOWLEDGE": {
        const acknowledgedBy =
          window.prompt("Acknowledged by (name/email):") || "recipient";
        return ack({
          variables: { input: { chalaniId, acknowledgedBy } },
        });
      }

      case "DELIVER":
        return deliver({ variables: { input: { chalaniId } } });

      case "RETURN_UNDELIVERED": {
        const reason =
          window.prompt("Return/Undelivered reason (required):") || "";
        if (!reason.trim())
          throw new Error("Return/Undelivered reason is required");
        return returned({
          variables: { input: { chalaniId, reason } },
        });
      }

      case "RESEND": {
        const channel = (window.prompt(
          "Resend channel [POST|DIGITAL]:",
          "POST"
        ) || "POST") as DispatchChannel;
        const trackingId =
          channel === "POST"
            ? window.prompt("New tracking ID (optional):") || undefined
            : undefined;
        const courierName =
          channel === "POST"
            ? window.prompt("Courier (optional):", "Nepal Post") || undefined
            : undefined;

        return resend({
          variables: {
            input: { chalaniId, dispatchChannel: channel, trackingId, courierName },
          },
        });
      }

      // ----- Termination
      case "VOID": {
        const reason = window.prompt("Void reason (required):") || "";
        if (!reason.trim()) throw new Error("Void reason is required");
        return voidM({ variables: { input: { chalaniId, reason } } });
      }

      case "SUPERSEDE": {
        const subject =
          window.prompt("New Chalani subject (required):") || "";
        if (!subject.trim()) throw new Error("Subject is required");
        const body =
          window.prompt("New Chalani body (required):") || "";
        if (!body.trim()) throw new Error("Body is required");
        const reason =
          window.prompt("Supersede reason (required):") || "";
        if (!reason.trim()) throw new Error("Reason is required");

        return supercede({
          variables: {
            input: {
              targetChalaniId: chalaniId,
              reason,
              newChalani: {
                scope: "MUNICIPALITY", # adjust if needed
                wardId: null,
                subject,
                body,
                templateId: null,
                linkedDartaId: null,
                attachmentIds: [],
                recipient: {
                  type: "GOVERNMENT_OFFICE",
                  name: "Recipient",
                  organization: null,
                  email: null,
                  phone: null,
                  address: "—",
                },
                requiredSignatoryIds: [],
                idempotencyKey: `${Date.now()}`,
              },
            },
          },
        });
      }

      case "CLOSE":
        return close({ variables: { chalaniId } });

      default:
        throw new Error(`Unhandled Chalani action: ${action}`);
    }
  }

  return { run };
}
