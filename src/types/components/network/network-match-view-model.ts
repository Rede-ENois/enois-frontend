import type { NetworkUser } from "@/lib/api";
import type { ConnectionUiState } from "./connection-ui-state";

export type NetworkMatchViewModel = {
  user: NetworkUser;
  connectionState: ConnectionUiState;
};
