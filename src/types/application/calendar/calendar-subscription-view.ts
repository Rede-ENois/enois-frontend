import type { CalendarScope } from "./calendar-scope";

/**
 * A assinatura privada `.ics` de quem está lendo, como a rota de gestão devolve.
 *
 * `token` só vem preenchido na resposta que acabou de criar ou regenerar o link: depois disso o
 * servidor guarda só o hash e não tem como devolvê-lo. `scope` nulo é a agenda consolidada, o
 * mesmo contrato da leitura.
 */
export type CalendarSubscriptionView = {
  scope: CalendarScope | null;
  createdAt: string;
  revokedAt: string | null;
  /** O token em claro, uma única vez. `null` quando a assinatura já existia. */
  token: string | null;
};
