/** Penalidade de qualquer conta como o admin a ve (GET /admin/sanctions). */
export type AdminSanctionView = {
  id: string;
  userId: string;
  username: string | null;
  name: string | null;
  reportId: string | null;
  type: "RESTRICTION" | "SUSPENDED" | "BAN" | "PERMABAN";
  reason: string | null;
  status: "ACTIVE" | "REMOVED";
  createdAt: string;
  removedAt: string | null;
};
