import { texts } from "@/texts";
import type { RequestCardProps } from "@/types/components/network/request-card-props";

import { createNetworkRequestCardActions } from "@/utils/components/network/create-network-request-card-actions";
import { useNetworkRequestProfile } from "@/utils/components/network/use-network-request-profile";

export function useNetworkRequestCardController(props: RequestCardProps) {
  const { user, isOutgoing, targetUserId } = useNetworkRequestProfile(props.request);

  return {
    user,
    profileUsername: user?.username ?? targetUserId,
    statusLabel: isOutgoing ? texts.network.requestSent : texts.network.wantsToConnect,
    actions: createNetworkRequestCardActions(props, isOutgoing),
  };
}
