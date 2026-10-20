import type { MarketplaceListing } from "@/types/application/marketplace/marketplace-listing";
import type { MarketplacePurchase } from "@/types/application/marketplace/marketplace-purchase";

import { api } from "../api-client";

/**
 * O marketplace (Fase 4): vender tema por faíscas, comprar com ESCROW (as faíscas
 * ficam retidas até a decisão — confirmar libera 90% ao criador; reembolso devolve
 * tudo, dentro de 7 dias).
 */
export const marketplaceApi = {
  /** Catálogo público de itens à venda. */
  catalog: (limit = 60) => api.get<MarketplaceListing[]>(`/marketplace?limit=${limit}`),

  /** Minhas listagens (o que estou vendendo). */
  mine: () => api.get<MarketplaceListing[]>("/marketplace/mine"),

  /** Minhas compras (o painel do escrow: confirmar ou pedir reembolso). */
  purchases: () => api.get<MarketplacePurchase[]>("/marketplace/compras"),

  /** Minhas vendas (acompanhar as liberações). */
  sales: () => api.get<MarketplacePurchase[]>("/marketplace/vendas"),

  /** Lista um item meu (v1: tema da galeria) por um preço em faíscas. */
  publish: (data: { itemId: string; title: string; description?: string; price: number }) =>
    api.post<{ id: string; status: string }>("/marketplace", data),

  /** Compra: as faíscas vão para o escrow. */
  buy: (listingId: string) =>
    api.post<{ purchaseId: string; state: string; price: number }>(
      `/marketplace/${listingId}/buy`,
      {},
    ),

  /** Confirmou que está tudo certo: libera para o criador (−10% de taxa). */
  confirm: (purchaseId: string) =>
    api.post<{ purchaseId: string; state: string }>(
      `/marketplace/purchases/${purchaseId}/confirm`,
      {},
    ),

  /** Não serviu (dentro de 7 dias): devolve 100%. */
  refund: (purchaseId: string) =>
    api.post<{ purchaseId: string; state: string }>(
      `/marketplace/purchases/${purchaseId}/refund`,
      {},
    ),
};
