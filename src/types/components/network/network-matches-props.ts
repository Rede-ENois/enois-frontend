import type { NetworkMatchViewModel } from "./network-match-view-model";

export type NetworkMatchesProps = {
  matches: NetworkMatchViewModel[];
  isConnectionActionPending: boolean;
  onConnect: (userId: string) => void;
  onRemove: (userId: string) => void;
};
