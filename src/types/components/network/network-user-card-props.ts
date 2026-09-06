import type { NetworkUser } from "@/lib/api";
import type { ConnectionUiState } from "./connection-ui-state";

export type NetworkUserCardProps = {
  user: NetworkUser;
  connectionState: ConnectionUiState;
  isConnectionActionPending: boolean;
  onConnect: (userId: string) => void;
  onRemove: (userId: string) => void;
};
