import type { NetworkUser } from "@/lib/api";
import type { ConnectionUiState } from "@/utils/network";

export type NetworkMatchItem = {
  user: NetworkUser;
  state: ConnectionUiState;
};
