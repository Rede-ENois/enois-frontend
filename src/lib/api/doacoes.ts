import type { DoacaoApoiador } from "@/types/application/doacoes/doacao-apoiador";
import type { DoacaoConfirmada } from "@/types/application/doacoes/doacao-confirmada";
import type { DoacaoCopiaECola } from "@/types/application/doacoes/doacao-copia-e-cola";
import type { DoacoesMinhas } from "@/types/application/doacoes/doacoes-minhas";

import { api } from "../api-client";

/** Doação via Pix (selo de apoiador). O valor vai em centavos; o copia e cola é o BR Code. */
export const doacoesApi = {
  /** O código vigente da conta. */
  current: () => api.get<DoacaoCopiaECola>("/doacoes/pix"),

  /** Abre uma doação nova (e aposenta a anterior). */
  open: (amountCents: number) => api.post<DoacaoCopiaECola>("/doacoes/pix", { amountCents }),

  /** Envia o comprovante (extrato colado ou linha digitada). */
  confirm: (id: string, comprovante: string) =>
    api.post<DoacaoConfirmada>(`/doacoes/${encodeURIComponent(id)}/comprovante`, { comprovante }),

  /** Selo e histórico da própria conta. */
  mine: () => api.get<DoacoesMinhas>("/doacoes/minhas"),

  /** Booleano do selo para o perfil público (só isso: o valor é privado). */
  apoiador: (username: string) =>
    api.get<DoacaoApoiador>(`/users/${encodeURIComponent(username)}/apoiador`),
};
