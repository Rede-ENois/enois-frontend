import { texts } from "@/texts";
import type { ConnectionRequest } from "@/types/application/network/connection-request";
import { createNetworkRequestCardActions } from "@/utils/components/network/create-network-request-card-actions";
import { useNetworkRequestActions } from "@/utils/components/network/use-network-request-actions";
import { useNetworkRequestProfile } from "@/utils/components/network/use-network-request-profile";

export function useNetworkRequestCardController(request: ConnectionRequest) {
  const { user, isOutgoing, targetUserId } = useNetworkRequestProfile(request);
  const requestActions = useNetworkRequestActions();

  return {
    avatar: user?.avatar,
    displayName: user?.name ?? texts.common.loading,
    headline: user?.headline,
    showHeadline: Boolean(user?.headline),
    profileUsername: user?.username ?? targetUserId,
    statusLabel: isOutgoing ? texts.network.requestSent : texts.network.wantsToConnect,
    actions: createNetworkRequestCardActions(request, isOutgoing, requestActions),
  };
}
