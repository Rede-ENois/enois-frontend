import { queryOptions } from "@tanstack/react-query";

import type { CalendarWindowQuery } from "@/types/application/calendar/calendar-window-query";

import { calendarApi } from "@/lib/api";

/**
 * Agenda de quem está lendo. A chave inclui a janela e o escopo porque trocar de mês ou de agenda
 * é outra consulta — e a janela é obrigatória: o servidor recusa sem `from`/`to` (a agenda inteira
 * é a tabela inteira).
 */
export const calendarQueries = {
  agenda: ({ from, to, scope }: CalendarWindowQuery) =>
    queryOptions({
      queryKey: ["agenda", from, to, scope ?? "todas"] as const,
      queryFn: () => calendarApi.list({ from, to, scope }),
    }),

  /** Convites ainda sem resposta: a tela avisa sem varrer a agenda inteira. */
  pendingInvitations: () =>
    queryOptions({
      queryKey: ["agenda", "convites-pendentes"] as const,
      queryFn: () => calendarApi.pendingInvitations(),
    }),

  /**
   * O que já ocupa a janela que a tela desenha (D23). A chave não leva o escopo de propósito: o
   * aviso vale para as duas agendas, então trocar de aba não invalida a leitura. É referência para o
   * formulário, não bloqueio — a tela segue desenhando mesmo se a consulta falhar.
   */
  conflicts: ({ from, to }: { from: string; to: string }) =>
    queryOptions({
      queryKey: ["agenda", "conflitos", from, to] as const,
      queryFn: () => calendarApi.conflicts({ from, to }),
      staleTime: 30_000,
    }),
};
