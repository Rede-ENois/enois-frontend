import type { LojaItem } from "@/types/application/loja/loja-item";

import { api } from "../api-client";

/** A loja de cosméticos: compra direta (auditada no ledger) e equipar. */
export const lojaApi = {
  catalog: () => api.get<LojaItem[]>("/loja"),
  buy: (itemId: string) => api.post<{ id: string; owned: boolean }>(`/loja/${itemId}/comprar`, {}),
  equip: (itemId: string) =>
    api.post<{ id: string; equipped: boolean }>(`/loja/${itemId}/equipar`, {}),
};
