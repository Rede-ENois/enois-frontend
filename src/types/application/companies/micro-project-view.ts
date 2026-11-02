export type MicroProjectView = {
  id: string;
  companyId: string;
  title: string;
  problem: string;
  scope: string | null;
  deliverables: string | null;
  acceptanceCriteria: string | null;
  budget: string | null;
  deadline: string | null;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  /** The viewer's proposal on this project, if any. */
  myProposal: "SENT" | "SELECTED" | "DECLINED" | null;
  /** Only for whoever manages the page. */
  proposalCount: number | null;
};
