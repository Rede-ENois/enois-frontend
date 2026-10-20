export type ProposalView = {
  id: string;
  userId: string;
  message: string;
  status: "SENT" | "SELECTED" | "DECLINED";
  proposedAt: string;
};
