export type ServiceProposal = {
  id: string;
  requestId: string;
  userId: string;
  message: string;
  price: number;
  status: "SENT" | "CHOSEN" | "DECLINED";
  createdAt: string;
};
