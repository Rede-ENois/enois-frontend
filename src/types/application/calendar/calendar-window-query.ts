import type { CalendarScope } from "./calendar-scope";

/**
 * Janela pedida à agenda. `from` e `to` são instantes ISO-8601 em UTC; a janela é meio aberta, então
 * `to` é o começo do dia seguinte ao último dia que a tela desenha.
 *
 * O servidor recusa sem uma janela válida, de propósito: agenda sem intervalo é a tabela inteira.
 */
export type CalendarWindowQuery = {
  from: string;
  to: string;
  scope?: CalendarScope | null;
};
