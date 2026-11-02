import type { NetworkUser } from "@/types/application/network/network-user";

export type ConnectionRequest = {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
  /** INCOMING: someone asked me; OUTGOING: I asked. */
  direction: "INCOMING" | "OUTGOING";
  /** The person on the other side, already resolved by the server. */
  peer: NetworkUser;
};
