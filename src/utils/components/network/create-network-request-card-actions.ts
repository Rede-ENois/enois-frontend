import { texts } from "@/texts";
import type { RequestCardProps } from "@/types/components/network/request-card-props";
import { Check, X } from "lucide-react";

export function createNetworkRequestCardActions(
  { request, onAccept, onCancel }: RequestCardProps,
  isOutgoing: boolean,
) {
  if (isOutgoing) {
    return [
      {
        key: "cancel",
        icon: X,
        label: texts.network.cancel,
        variant: "outline" as const,
        run: () => onCancel(request.toUserId),
      },
    ];
  }

  return [
    {
      key: "reject",
      icon: X,
      label: texts.network.reject,
      variant: "outline" as const,
      run: () => onCancel(request.fromUserId),
    },
    {
      key: "accept",
      icon: Check,
      label: texts.network.accept,
      variant: "default" as const,
      run: () => onAccept(request.fromUserId),
    },
  ];
}
