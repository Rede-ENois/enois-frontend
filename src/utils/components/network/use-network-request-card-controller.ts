import { useQuery } from "@tanstack/react-query";
import { Check, X } from "lucide-react";

import { texts } from "@/texts";
import type { RequestCardProps } from "@/types/components/network/request-card-props";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useNetworkRequestCardController({
  request,
  onAccept,
  onCancel,
}: RequestCardProps) {
  const currentUserId = getCurrentUserId();
  const isOutgoing = request.fromUserId === currentUserId;
  const targetUserId = isOutgoing ? request.toUserId : request.fromUserId;

  const { data: user } = useQuery({
    queryKey: ["profile", "by-id", targetUserId],
    queryFn: () => getProfileById(targetUserId),
  });

  const actions = isOutgoing
    ? [
        {
          key: "cancel",
          icon: X,
          label: texts.network.cancel,
          variant: "outline" as const,
          run: () => onCancel(request.toUserId),
        },
      ]
    : [
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

  return {
    user,
    profileUsername: user?.username ?? targetUserId,
    statusLabel: isOutgoing ? texts.network.requestSent : texts.network.wantsToConnect,
    actions,
  };
}
