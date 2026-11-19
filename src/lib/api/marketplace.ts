import type { MarketplaceKind } from "@/constants/marketplace-kinds";
import type { MarketplaceListing } from "@/types/application/marketplace/marketplace-listing";
import type { MarketplacePurchase } from "@/types/application/marketplace/marketplace-purchase";
import type { PurchasedItem } from "@/types/application/marketplace/purchased-item";

import { api } from "../api-client";

/**
 * O marketplace (Fase 4): vender tema por faíscas, comprar com ESCROW (as faíscas
 * ficam retidas até a decisão — confirmar libera 90% ao criador; reembolso devolve
 * tudo, dentro de 7 dias).
 */
export const marketplaceApi = {
  /** Catálogo público com busca e categoria. */
  catalog: (limit = 60, q?: string, kind?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (q) params.set("q", q);
    if (kind) params.set("kind", kind);
    return api.get<MarketplaceListing[]>(`/marketplace?${params.toString()}`);
  },

  /** Minhas listagens (o que estou vendendo). */
  mine: () => api.get<MarketplaceListing[]>("/marketplace/mine"),

  /** Minhas compras (o painel do escrow: confirmar ou pedir reembolso). */
  purchases: () => api.get<MarketplacePurchase[]>("/marketplace/compras"),

  /** Minhas vendas (acompanhar as liberações). */
  sales: () => api.get<MarketplacePurchase[]>("/marketplace/vendas"),

  /** Lista um item meu (v1: tema da galeria) por um preço em faíscas. */
  publish: (data: { itemId: string; title: string; description?: string; price: number }) =>
    api.post<{ id: string; status: string }>("/marketplace", data),

  /** Publica qualquer conteúdo (template, banner, página, post, blog ou serviço). */
  publishItem: (data: {
    kind: MarketplaceKind;
    title: string;
    description?: string;
    content: string;
    price: number;
  }) => api.post<{ id: string; status: string }>("/marketplace/items", data),

  /** Conteúdo comprado (só o comprador abre): base do editor de "Minhas compras". */
  purchaseContent: (purchaseId: string) =>
    api.get<PurchasedItem>(`/marketplace/purchases/${purchaseId}/content`),

  /** Compra: as faíscas vão para o escrow. */
  buy: (listingId: string) =>
    api.post<{ purchaseId: string; state: string; price: number }>(
      `/marketplace/${listingId}/buy`,
      {},
    ),

  /** Tema do próprio autor: sem compra e sem escrow (o pacote já é dele). */
  ownerDownload: (listingId: string) =>
    api.post<{ status: string }>(`/marketplace/${listingId}/owner-download`, {}),

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
