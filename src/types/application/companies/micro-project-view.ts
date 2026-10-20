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
};
