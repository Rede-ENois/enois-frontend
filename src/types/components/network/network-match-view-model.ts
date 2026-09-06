import type { NetworkUser } from "@/lib/api";

export type ConnectionUiState = "connected" | "requested" | "available";

export type NetworkMatchViewModel = {
  user: NetworkUser;
  connectionState: ConnectionUiState;
};
