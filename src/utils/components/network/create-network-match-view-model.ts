import { Send, UserMinus, UserPlus } from "lucide-react";

import { texts } from "@/texts";
import type { NetworkUser } from "@/types/application/network/network-user";

export function createNetworkMatchViewModel(
  user: NetworkUser,
  localStatus: string | undefined,
  pending: boolean,
  toggle: (userId: string, connected: boolean) => void,
) {
  const requested = !user.connected && localStatus === "REQUESTED";

  return {
    ...user,
    statusLabel: user.connected ? texts.network.connected : texts.network.commonInterests,
    connectionAction: {
      icon: user.connected ? UserMinus : requested ? Send : UserPlus,
      label: user.connected
        ? texts.network.remove
        : requested
          ? texts.network.requested
          : texts.network.connect,
      variant: user.connected ? ("outline" as const) : ("default" as const),
      className: user.connected ? "text-destructive hover:text-destructive" : "",
      disabled: pending,
      run: () => toggle(user.id, user.connected),
    },
  };
}
