export type ServiceRequest = {
  id: string;
  requesterId: string;
  category: string;
  title: string;
  description: string;
  deliverables: string;
  budgetMin: number;
  budgetMax: number;
  deadline?: string | null;
  status: "OPEN" | "CHOSEN" | "CLOSED";
  createdAt: string;
};
