import {
  useSubmitChalaniActionMutation,
  useReviewChalaniMutation,
  useApproveChalaniMutation,
  useReserveChalaniNumberMutation,
  useFinalizeChalaniRegistrationMutation,
  useDirectRegisterChalaniMutation,
  useSignChalaniMutation,
  useSealChalaniMutation,
  useDispatchChalaniActionMutation,
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
  const [dispatchM] = useDispatchChalaniActionMutation();
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
        const notes = window.prompt("Reviewer notes (optional):") || null;
        return review({
          variables: {
            input: {
              chalaniId,
              decision: "EDIT_REQUIRED",
              notes,
              idempotencyKey: `review-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "APPROVE_REVIEW": {
        const notes = window.prompt("Review notes (optional):") || null;
        return review({
          variables: {
            input: {
              chalaniId,
              decision: "APPROVE_REVIEW",
              notes,
              idempotencyKey: `review-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      // ----- Approval + Registration
      case "APPROVE": {
        const notes = window.prompt("Approval notes (optional):") || null;
        return approve({
          variables: {
            input: {
              chalaniId,
              decision: "APPROVE",
              notes,
              reason: null,
              delegateToId: null,
              idempotencyKey: `approve-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "REJECT": {
        const reason = window.prompt("Rejection reason (required):");
        if (!reason?.trim()) throw new Error("Rejection reason is required");
        return approve({
          variables: {
            input: {
              chalaniId,
              decision: "REJECT",
              reason,
              notes: null,
              delegateToId: null,
              idempotencyKey: `reject-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "RESERVE_NO": {
        const allocationId =
          window.prompt("Allocation ID (e.g., ALLOC-001):") || "ALLOC-001";
        return reserveNo({
          variables: {
            input: {
              chalaniId,
              allocationId,
              idempotencyKey: `reserve-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "FINALIZE": {
        const allocationId =
          window.prompt("Allocation ID used to reserve:") || "ALLOC-001";
        return finalize({
          variables: {
            input: {
              chalaniId,
              allocationId,
              idempotencyKey: `finalize-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "DIRECT_REGISTER":
        return directRegister({
          variables: {
            input: {
              chalaniId,
              idempotencyKey: `direct-register-${chalaniId}-${Date.now()}`,
            },
          },
        });

      // ----- Signing & Sealing
      case "SIGN": {
        const signatureAttachmentId =
          window.prompt("Signature attachment ID (optional):") || null;
        return sign({
          variables: {
            input: {
              chalaniId,
              signatureAttachmentId,
              idempotencyKey: `sign-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "SEAL": {
        const sealAttachmentId =
          window.prompt("Seal attachment ID (optional):") || null;
        return seal({
          variables: {
            input: {
              chalaniId,
              sealAttachmentId,
              idempotencyKey: `seal-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      // ----- Dispatch & Delivery
      case "DISPATCH": {
        const channel = (window.prompt(
          "Dispatch channel [POSTAL|COURIER|EMAIL|HAND_DELIVERY|EDARTA_PORTAL]:",
          "POSTAL"
        ) || "POSTAL") as DispatchChannel;
        const trackingId =
          channel === "POSTAL" || channel === "COURIER"
            ? window.prompt("Tracking ID (optional):") || null
            : null;
        const courierName =
          channel === "POSTAL" || channel === "COURIER"
            ? window.prompt("Courier name (optional):", "Nepal Post") || null
            : null;

        return dispatchM({
          variables: {
            input: {
              chalaniId,
              dispatchChannel: channel,
              trackingId: trackingId ?? null,
              courierName: courierName ?? null,
              idempotencyKey: `dispatch-${chalaniId}-${Date.now()}`,
              scheduledDispatchAt: null,
            },
          },
        });
      }

      case "MARK_IN_TRANSIT": {
        const trackingId = window.prompt("Tracking ID (optional):") || null;
        const courierName =
          window.prompt("Courier Name (optional):", "Nepal Post") || null;
        return markTransit({
          variables: {
            input: {
              chalaniId,
              trackingId,
              courierName,
              idempotencyKey: `transit-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "ACKNOWLEDGE": {
        const acknowledgedBy =
          window.prompt("Acknowledged by (name/email):") || "recipient";
        return ack({
          variables: {
            input: {
              chalaniId,
              acknowledgedBy,
              acknowledgementProofId: null,
              idempotencyKey: `ack-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "DELIVER":
        return deliver({
          variables: {
            input: {
              chalaniId,
              deliveredProofId: null,
              idempotencyKey: `deliver-${chalaniId}-${Date.now()}`,
            },
          },
        });

      case "RETURN_UNDELIVERED": {
        const reason =
          window.prompt("Return/Undelivered reason (required):") || "";
        if (!reason.trim())
          throw new Error("Return/Undelivered reason is required");
        return returned({
          variables: {
            input: {
              chalaniId,
              reason,
              idempotencyKey: `return-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "RESEND": {
        const channel = (window.prompt(
          "Resend channel [POSTAL|COURIER|EMAIL|HAND_DELIVERY|EDARTA_PORTAL]:",
          "POSTAL"
        ) || "POSTAL") as DispatchChannel;
        const trackingId =
          channel === "POSTAL" || channel === "COURIER"
            ? window.prompt("New tracking ID (optional):") || null
            : null;
        const courierName =
          channel === "POSTAL" || channel === "COURIER"
            ? window.prompt("Courier (optional):", "Nepal Post") || null
            : null;

        return resend({
          variables: {
            input: {
              chalaniId,
              dispatchChannel: channel,
              trackingId,
              courierName,
              idempotencyKey: `resend-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      // ----- Termination
      case "VOID": {
        const reason = window.prompt("Void reason (required):") || "";
        if (!reason.trim()) throw new Error("Void reason is required");
        return voidM({
          variables: {
            input: {
              chalaniId,
              reason,
              idempotencyKey: `void-${chalaniId}-${Date.now()}`,
            },
          },
        });
      }

      case "SUPERSEDE": {
        const subject = window.prompt("New Chalani subject (required):") || "";
        if (!subject.trim()) throw new Error("Subject is required");
        const body = window.prompt("New Chalani body (required):") || "";
        if (!body.trim()) throw new Error("Body is required");
        const reason = window.prompt("Supersede reason (required):") || "";
        if (!reason.trim()) throw new Error("Reason is required");

        return supercede({
          variables: {
            input: {
              targetChalaniId: chalaniId,
              reason,
              idempotencyKey: `supersede-${chalaniId}-${Date.now()}`,
              newChalani: {
                scope: "MUNICIPALITY", // adjust if needed
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
