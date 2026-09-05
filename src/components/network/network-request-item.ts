import type { ConnectionRequest, Profile } from "@/lib/api";
import type { RequestDirection } from "@/utils/network";

export type NetworkRequestItem = {
  request: ConnectionRequest;
  direction: RequestDirection;
  targetUserId: string;
  user?: Profile;
};
