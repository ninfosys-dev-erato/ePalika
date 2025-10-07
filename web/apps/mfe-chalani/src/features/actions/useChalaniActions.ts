import {
  useSubmitChalaniMutation,
  useApproveChalaniMutation,
  useDispatchChalaniMutation,
} from "@egov/api-types";
import { useApolloClient } from "@apollo/client";

export function useChalaniActions() {
  const client = useApolloClient();
  const [submit] = useSubmitChalaniMutation();
  const [approve] = useApproveChalaniMutation();
  const [dispatch] = useDispatchChalaniMutation();

  async function run(action: string, chalaniId: string) {
    switch (action) {
      case "SUBMIT":
        return submit({ variables: { chalaniId } });
      case "APPROVE":
        return approve({
          variables: { input: { chalaniId, decision: "APPROVE" } },
        });
      case "DISPATCH":
        return dispatch({
          variables: { input: { chalaniId, dispatchChannel: "POST" } },
        });
      default:
        throw new Error(`Unhandled Chalani action: ${action}`);
    }
  }

  return { run };
}
