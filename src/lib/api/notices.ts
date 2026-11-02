import type { AdminNotice } from "@/types/application/notices/admin-notice";
import type { NoticePublishInput } from "@/types/application/notices/notice-publish-input";

import { api } from "../api-client";

/**
 * O aviso da plataforma que um admin publica do painel.
 *
 * Ler e publico (204 quando nao ha aviso no ar); escrever e rota de admin, e a barreira esta no
 * backend — o painel so mostra a aba para quem `moderationApi.me()` respondeu `admin`.
 */
export const noticesApi = {
  current: async () => (await api.get<AdminNotice | null | undefined>("/avisos/ativo")) ?? null,

  publish: (data: NoticePublishInput) => api.put<AdminNotice>("/admin/avisos", data),

  retire: () => api.delete<null>("/admin/avisos"),
};
