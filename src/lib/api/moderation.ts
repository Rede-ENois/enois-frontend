import type { BulkBanResult } from "@/types/application/moderation/bulk-ban-result";
import type { BulkDeletePostsResult } from "@/types/application/moderation/bulk-delete-posts-result";
import type { EmailLogView } from "@/types/application/moderation/email-log-view";
import type { GameReviewView } from "@/types/application/moderation/game-review-view";
import type { ModeratorApplicationView } from "@/types/application/moderation/moderator-application-view";
import type { ModeratorMeView } from "@/types/application/moderation/moderator-me-view";
import type { ModeratorPanelReportView } from "@/types/application/moderation/moderator-panel-report-view";
import type { ModeratorSanctionResult } from "@/types/application/moderation/moderator-sanction-result";
import type { ModeratorVoteResult } from "@/types/application/moderation/moderator-vote-result";
import type { SanctionProposalDecision } from "@/types/application/moderation/sanction-proposal-decision";
import type { SanctionProposalView } from "@/types/application/moderation/sanction-proposal-view";
import type { SuspiciousPostView } from "@/types/application/moderation/suspicious-post-view";
// A lista de suspeitos mora no arquivo dela (um tipo por arquivo, regra do repo); o main
// importava daqui um tipo que nao existe neste arquivo.
import type { SuspiciousUsersView } from "@/types/application/moderation/suspicious-users-view";

import { api } from "../api-client";

/**
 * Candidatura a moderador e painel de votação.
 *
 * As rotas de admin exigem o papel de admin (allowlist de e-mail/username no backend); as de
 * moderação exigem candidatura aprovada. O front não decide nada: só mostra o que a API libera.
 */
export const moderationApi = {
  me: () => api.get<ModeratorMeView>("/moderation/me"),

  apply: (data: { motivation: string; experience?: string; availability?: string }) =>
    api.post<ModeratorApplicationView>("/moderation/applications", data),

  reports: (limit = 20) =>
    api.get<ModeratorPanelReportView[]>(`/moderation/reports?limit=${limit}`),

  vote: (reportId: string, vote: "PUNISH" | "DISMISS", note?: string) =>
    api.post<ModeratorVoteResult>(`/moderation/reports/${reportId}/vote`, { vote, note }),

  applications: (status = "PENDING", limit = 50) =>
    api.get<ModeratorApplicationView[]>(
      `/admin/moderator-applications?status=${status}&limit=${limit}`,
    ),

  approveApplication: (applicationId: string, note?: string) =>
    api.post<ModeratorApplicationView>(`/admin/moderator-applications/${applicationId}/approve`, {
      note,
    }),

  rejectApplication: (applicationId: string, note: string) =>
    api.post<ModeratorApplicationView>(`/admin/moderator-applications/${applicationId}/reject`, {
      note,
    }),

  /** Moderadores ativos (admin). */
  moderators: (limit = 200) =>
    api.get<ModeratorApplicationView[]>(`/admin/moderators?limit=${limit}`),

  appoint: (username: string, note?: string) =>
    api.post<ModeratorApplicationView>("/admin/moderators", { username, note }),

  revoke: (userId: string, note?: string) =>
    api.post<ModeratorApplicationView>(`/admin/moderators/${userId}/revoke`, { note }),

  /** Punição por votação: só existe com 10+ moderadores; o limiar é >50% dos ativos. */
  /** Modo pânico: bloqueia toda escrita da aplicação com 429. */
  panicStatus: () =>
    api.get<{ active: boolean; envLocked: boolean; message: string }>("/admin/panic"),

  setPanic: (active: boolean) =>
    api.post<{ active: boolean; envLocked: boolean; message: string }>("/admin/panic", { active }),

  sanctionProposals: (limit = 50) =>
    api.get<SanctionProposalView[]>(`/moderation/sanction-proposals?limit=${limit}`),

  proposeSanction: (username: string, type: "RESTRICTION" | "BAN", reason: string) =>
    api.post<SanctionProposalView>("/moderation/sanction-proposals", {
      username,
      type,
      reason,
    }),

  voteSanction: (proposalId: string, vote: "APPROVE" | "REJECT", note?: string) =>
    api.post<SanctionProposalDecision>(`/moderation/sanction-proposals/${proposalId}/vote`, {
      vote,
      note,
    }),

  cancelSanction: (proposalId: string) =>
    api.post<SanctionProposalView>(`/admin/sanction-proposals/${proposalId}/cancel`, {}),

  sanctionUser: (username: string, type: "RESTRICTION" | "BAN" | "PERMABAN", reason: string) =>
    api.post<ModeratorSanctionResult>(`/admin/users/${encodeURIComponent(username)}/sanction`, {
      type,
      reason,
    }),

  /** Posts denunciados com score alto na pré-triagem (admin). */
  suspiciousPosts: (minScore = 30, limit = 50) =>
    api.get<SuspiciousPostView[]>(
      `/moderation/posts/suspicious?minScore=${minScore}&limit=${limit}`,
    ),

  /** Exclusão em lote (soft delete auditado) dos posts selecionados. */
  bulkDeleteSuspiciousPosts: (postIds: string[], reason: string) =>
    api.post<BulkDeletePostsResult>("/moderation/posts/bulk-delete", { postIds, reason }),

  /** Contas recentes com sinais de abuso, para validação humana (time de moderação). */
  suspiciousUsers: (limit = 100, days = 30) =>
    api.get<SuspiciousUsersView>(`/moderation/users/suspicious?limit=${limit}&days=${days}`),

  /** Banimento em lote: cada item tem resultado próprio; uma conta inválida não cancela as outras. */
  bulkBan: (usernames: string[], type: "BAN" | "PERMABAN", reason: string) =>
    api.post<BulkBanResult>("/moderation/users/bulk-ban", { usernames, type, reason }),

  /**
   * Sanitizar usuário: apaga do banco TODOS os posts e comentários dele (conta banida por spam).
   * Diferente da remoção por denúncia (soft delete): aqui a linha sai do banco de verdade.
   */
  sanitizeUser: (username: string, reason: string) =>
    api.post<{
      userId: string;
      username: string;
      posts: number;
      comments: number;
      otherRows: number;
    }>(`/admin/users/${encodeURIComponent(username)}/sanitize`, { note: reason }),

  /** IPs recentes de onde o usuário entrou — a fonte para escolher o que bloquear. */
  userIps: (username: string) =>
    api.get<{ ip: string }[]>(`/admin/users/${encodeURIComponent(username)}/ips`),

  blockIp: (ip: string, reason: string) =>
    api.post<{ id: string; ip: string; reason: string; createdAt: string }>("/admin/blocked-ips", {
      ip,
      reason,
    }),

  blockedIps: (limit = 100) =>
    api.get<{ id: string; ip: string; reason: string; createdAt: string }[]>(
      `/admin/blocked-ips?limit=${limit}`,
    ),

  unblockIp: (ip: string) =>
    api.post<{ ip: string }>(`/admin/blocked-ips/${encodeURIComponent(ip)}/unblock`, {}),

  /** Fila de jogos enviados pela comunidade (moderador ou admin). */
  games: (limit = 30) => api.get<GameReviewView[]>(`/moderation/games?limit=${limit}`),

  approveGame: (gameId: string, note?: string) =>
    api.post<{ id: string; status: string }>(`/moderation/games/${gameId}/approve`, { note }),

  rejectGame: (gameId: string, note: string) =>
    api.post<{ id: string; status: string }>(`/moderation/games/${gameId}/reject`, { note }),

  /** Metadados dos e-mails enviados (admin). O corpo não é armazenado. */
  emails: (limit = 50) => api.get<EmailLogView[]>(`/admin/emails?limit=${limit}`),
};
