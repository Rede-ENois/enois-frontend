import type { ConnectionRequest, Profile } from "@/lib/api";

export type RequestDirection = "incoming" | "outgoing";

export type NetworkRequestViewModel = {
  request: ConnectionRequest;
  direction: RequestDirection;
  targetUserId: string;
  user?: Profile;
};
