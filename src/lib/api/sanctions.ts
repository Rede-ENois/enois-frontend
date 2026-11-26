import type { AdminSanctionView } from "@/types/application/moderation/admin-sanction-view";
import type { AppealView } from "@/types/application/moderation/appeal-view";

import { api } from "../api-client";
import { parseMySanctions } from "../moderation/sanction-contract";

export const sanctionsApi = {
  mine: async () => parseMySanctions(await api.get<unknown>("/me/sanctions")),
  appeal: (message: string) =>
    api.post<{ status: string; id: string }>("/me/sanctions/appeals", { message }),
  pendingAppeals: () => api.get<AppealView[]>("/admin/appeals"),
  approveAppeal: (appealId: string) =>
    api.post<{ status: string }>(`/admin/appeals/${appealId}/approve`),
  denyAppeal: (appealId: string) => api.post<{ status: string }>(`/admin/appeals/${appealId}/deny`),

  /** Fila de penalidades de toda a rede (admin): corrigir ou remover o que foi aplicado errado. */
  adminSanctions: (status: "ACTIVE" | "REMOVED" = "ACTIVE", limit = 100) =>
    api.get<AdminSanctionView[]>(`/admin/sanctions?status=${status}&limit=${limit}`),
  revokeSanction: (sanctionId: string, reason: string) =>
    api.post<{ status: string; sanction: AdminSanctionView }>(
      `/admin/sanctions/${sanctionId}/revoke`,
      { reason },
    ),
  editSanction: (sanctionId: string, type: AdminSanctionView["type"], reason: string) =>
    api.post<{ status: string; sanction: AdminSanctionView }>(
      `/admin/sanctions/${sanctionId}/edit`,
      { type, reason },
    ),
};
