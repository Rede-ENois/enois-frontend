import type { NetworkRequestViewModel } from "./network-request-view-model";

export type NetworkRequestCardProps = {
  requestViewModel: NetworkRequestViewModel;
  onAccept: (userId: string) => void;
  onCancel: (userId: string) => void;
};
