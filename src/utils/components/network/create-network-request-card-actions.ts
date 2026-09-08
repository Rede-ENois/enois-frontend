import { texts } from "@/texts";
import type { ConnectionRequest } from "@/types/application/network/connection-request";
import type { NetworkRequestActions } from "@/types/components/network/network-request-actions";
import { Check, X } from "lucide-react";

export function createNetworkRequestCardActions(
  request: ConnectionRequest,
  isOutgoing: boolean,
  actions: NetworkRequestActions,
) {
  if (isOutgoing) {
    return [
      {
        key: "cancel",
        icon: X,
        label: texts.network.cancel,
        variant: "outline" as const,
        run: () => actions.cancel(request.toUserId),
      },
    ];
  }

  return [
    {
      key: "reject",
      icon: X,
      label: texts.network.reject,
      variant: "outline" as const,
      run: () => actions.cancel(request.fromUserId),
    },
    {
      key: "accept",
      icon: Check,
      label: texts.network.accept,
      variant: "default" as const,
      run: () => actions.accept(request.fromUserId),
    },
  ];
}
