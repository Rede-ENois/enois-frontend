import type { NetworkUser } from "@/lib/api";
import type { ConnectionUiState } from "./network-match-view-model";

export type NetworkUserCardProps = {
  user: NetworkUser;
  connectionState: ConnectionUiState;
  isConnectionActionPending: boolean;
  onConnect: (userId: string) => void;
  onRemove: (userId: string) => void;
};
