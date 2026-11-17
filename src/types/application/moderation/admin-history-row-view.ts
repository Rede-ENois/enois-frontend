/** Uma linha do histórico administrativo da conta (advertência ou sanção). */
export type AdminHistoryRowView = {
  id: string;
  kind: "WARNING" | "SANCTION";
  type: string;
  reason: string;
  status: string;
  createdAt: string;
  active: boolean;
  revokedAt: string | null;
  revokedBy: string | null;
  /** Na suspensão: quando ela vira banimento permanente. */
  dueAt: string | null;
};
