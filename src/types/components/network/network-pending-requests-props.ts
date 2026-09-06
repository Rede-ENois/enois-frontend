import type { NetworkRequestViewModel } from "./network-request-view-model";

export type NetworkPendingRequestsProps = {
  incomingRequests: NetworkRequestViewModel[];
  outgoingRequests: NetworkRequestViewModel[];
  onAccept: (userId: string) => void;
  onCancel: (userId: string) => void;
};
