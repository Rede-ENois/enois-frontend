/** Sancao como o usuario a ve (GET /me/sanctions). */
export type SanctionView = {
  id: string;
  userId: string;
  reportId: string | null;
  type: "RESTRICTION" | "SUSPENDED" | "BAN" | "PERMABAN";
  reason: string | null;
  status: "ACTIVE" | "REMOVED";
  createdAt: string;
  removedAt: string | null;
  /** Prazo de revisão da suspensão ativa (quando vira ban se não houver recurso aceito). */
  dueAt: string | null;
};
