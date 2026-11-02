import type { CompanyPerson } from "./company-person";

export type ProposalView = {
  id: string;
  userId: string;
  message: string;
  status: "SENT" | "SELECTED" | "DECLINED";
  proposedAt: string;
  person: CompanyPerson | null;
  conversationId: string | null;
};
