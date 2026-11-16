import type { AdminHistoryRowView } from "@/types/application/moderation/admin-history-row-view";

/** Histórico administrativo do perfil (GET /admin/moderation/users/{username}/history). */
export type AdminHistoryView = {
  userId: string;
  username: string;
  rows: AdminHistoryRowView[];
};
