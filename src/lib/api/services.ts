import type { ServiceContract } from "@/types/application/services/service-contract";
import type { ServiceListing } from "@/types/application/services/service-listing";
import type { ServiceProposal } from "@/types/application/services/service-proposal";
import type { ServiceRequest } from "@/types/application/services/service-request";

import { api, buildQuery } from "../api-client";

/**
 * Serviços freelance (Fase 5): ofertar (Fiverr) e solicitar (demanda), pagos em
 * faíscas com escrow — as faíscas ficam retidas até o aceite (ou reembolso integral).
 */
export const servicesApi = {
  /** Catálogo público: ofertas e pedidos abertos. */
  catalog: (params: { q?: string; category?: string } = {}) =>
    api.get<{ ofertas: ServiceListing[]; pedidos: ServiceRequest[] }>(
      `/servicos${buildQuery(params)}`,
    ),

  /** Abre (ou reaproveita) a conversa de servico com quem presta e devolve o id dela. */
  openChat: (listingId: string, message?: string) =>
    api.post<{ conversationId: string; assunto: string; listingId: string; sellerId: string }>(
      `/servicos/ofertas/${listingId}/chat`,
      { message: message ?? "" },
    ),

  /** O meu painel: minhas ofertas e meus contratos (comprador e vendedor). */
  mine: () =>
    api.get<{
      ofertas: ServiceListing[];
      contratosComoComprador: ServiceContract[];
      contratosComoVendedor: ServiceContract[];
    }>("/servicos/minhas"),

  /** Publica uma oferta (teto de 5 abertas por conta). */
  publishListing: (data: {
    category: string;
    title: string;
    description: string;
    deliverables: string;
    price: number;
    currency?: "FAISCA" | "BRL";
    deliveryDays: number;
  }) => api.post<{ id: string; status: string }>("/servicos/ofertas", data),

  /** Contrata uma oferta: as faíscas vão para o escrow. */
  buyListing: (listingId: string) =>
    api.post<{ contractId: string; state: string }>(`/servicos/ofertas/${listingId}/contratar`, {}),

  /** Publica um pedido (orçamento em faixa, entregáveis obrigatórios). */
  createRequest: (data: {
    category: string;
    title: string;
    description: string;
    deliverables: string;
    budgetMin: number;
    budgetMax: number;
    deadline?: string | null;
  }) => api.post<{ id: string; status: string }>("/servicos/pedidos", data),

  /** Manda uma proposta (preço dentro da faixa do pedido). */
  propose: (requestId: string, data: { message: string; price: number }) =>
    api.post<{ id: string; status: string }>(`/servicos/pedidos/${requestId}/propostas`, data),

  /** As propostas de um pedido meu (só o dono vê). */
  proposals: (requestId: string) =>
    api.get<ServiceProposal[]>(`/servicos/pedidos/${requestId}/propostas`),

  /** Escolhe uma proposta: escrow retido e o pedido fecha. */
  choose: (requestId: string, proposalId: string) =>
    api.post<{ contractId: string; state: string }>(`/servicos/pedidos/${requestId}/escolher`, {
      proposalId,
    }),

  /** O vendedor entrega (nota do que foi feito). */
  deliver: (contractId: string, note: string) =>
    api.post<{ contractId: string; state: string }>(`/servicos/contratos/${contractId}/entregar`, {
      note,
    }),

  /** O comprador aceita: libera 90% para o vendedor. */
  accept: (contractId: string) =>
    api.post<{ contractId: string; state: string }>(
      `/servicos/contratos/${contractId}/aceitar`,
      {},
    ),

  /** O comprador recusa: devolve 100%. */
  refund: (contractId: string) =>
    api.post<{ contractId: string; state: string }>(
      `/servicos/contratos/${contractId}/reembolso`,
      {},
    ),
};
