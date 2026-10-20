import type { CoinDisputeView } from "@/types/application/wallet/coin-dispute-view";
import type { CoinQuote } from "@/types/application/wallet/coin-quote";
import type { Wallet } from "@/types/application/wallet/wallet";

import { api } from "../api-client";

export const walletApi = {
  wallet: () => api.get<Wallet>("/carteira"),
  cotacao: (historico = 90) => api.get<CoinQuote>(`/coin/cotacao?historico=${historico}`),
  /** A vítima contesta uma transferência (golpe) — vai para a fila de moderação. */
  contestar: (refId: string, reason: string, description: string) =>
    api.post<{ id: string; state: string }>(`/carteira/transacoes/${refId}/contestar`, {
      reason,
      description,
    }),
  /** A fila das contestações (admin). */
  disputasPendentes: (limit = 30) =>
    api.get<CoinDisputeView[]>(`/admin/carteira/disputas?limit=${limit}`),
  /** Contestação VERDADEIRA: reverte a transferência e restringe o golpista. */
  deferirDisputa: (id: string, note?: string) =>
    api.post<{ id: string; state: string }>(`/admin/carteira/disputas/${id}/deferir`, {
      note: note ?? null,
    }),
  /** Contestação FALSA: quem contestou é restringido. */
  rejeitarDisputa: (id: string, note?: string) =>
    api.post<{ id: string; state: string }>(`/admin/carteira/disputas/${id}/rejeitar`, {
      note: note ?? null,
    }),
  transfer: (toUsername: string, amount: number, message?: string) =>
    api.post<{ status: string; amount: number; toUsername: string }>("/carteira/transferencias", {
      toUsername,
      amount,
      message: message ?? null,
    }),
};
