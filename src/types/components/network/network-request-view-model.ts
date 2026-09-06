import type { ConnectionRequest, Profile } from "@/lib/api";
import type { RequestDirection } from "./request-direction";

export type NetworkRequestViewModel = {
  request: ConnectionRequest;
  direction: RequestDirection;
  targetUserId: string;
  user?: Profile;
};
