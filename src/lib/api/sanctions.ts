import type { AppealView } from "@/types/application/moderation/appeal-view";
import type { SanctionView } from "@/types/application/moderation/sanction-view";

import { api } from "../api-client";

export const sanctionsApi = {
  mine: () => api.get<{ sanctions: SanctionView[]; appeals: AppealView[] }>("/me/sanctions"),
  appeal: (message: string) =>
    api.post<{ status: string; id: string }>("/me/sanctions/appeals", { message }),
  pendingAppeals: () => api.get<AppealView[]>("/admin/appeals"),
  approveAppeal: (appealId: string) =>
    api.post<{ status: string }>(`/admin/appeals/${appealId}/approve`),
  denyAppeal: (appealId: string) => api.post<{ status: string }>(`/admin/appeals/${appealId}/deny`),
};
