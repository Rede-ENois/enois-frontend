export type ConnectionStatus = {
  id: string;
  status: string;
};

export type ConnectionStatusDetails = {
  targetUserId: string;
  status: "NONE" | "PENDING" | "ACCEPTED" | "REMOVED" | "BLOCKED";
};
