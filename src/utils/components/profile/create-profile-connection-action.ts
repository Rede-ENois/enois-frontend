import { texts } from "@/texts";
import type { ConnectionStatusResult } from "@/types/application/network/connection-status-result";

export function createProfileConnectionAction(
  status: ConnectionStatusResult["status"] | null,
  pending: boolean,
  run: () => void,
) {
  return {
    run,
    disabled: pending || status === "ACCEPTED" || status === "PENDING",
    label:
      status === "PENDING"
        ? texts.profile.waitingResponse
        : status === "ACCEPTED"
          ? texts.profile.connected
          : texts.profile.connect,
  };
}
