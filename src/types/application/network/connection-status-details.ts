export type ConnectionStatusDetails = {
  targetUserId: string;
  status: "NONE" | "PENDING" | "ACCEPTED" | "REMOVED" | "BLOCKED";
};
