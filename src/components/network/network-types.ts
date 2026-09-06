import type { ConnectionRequest, NetworkUser, Profile } from "@/lib/api";
import type { ConnectionUiState, RequestDirection } from "@/utils/network";

export type NetworkMatchViewModel = {
  user: NetworkUser;
  connectionState: ConnectionUiState;
};

export type NetworkRequestViewModel = {
  request: ConnectionRequest;
  direction: RequestDirection;
  targetUserId: string;
  user?: Profile;
};
