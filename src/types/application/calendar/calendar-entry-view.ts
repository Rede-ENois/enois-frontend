import type { CalendarEntryKind } from "./calendar-entry-kind";
import type { CalendarEntryState } from "./calendar-entry-state";
import type { CalendarRecurrence } from "./calendar-recurrence";
import type { CalendarScope } from "./calendar-scope";

/**
 * Compromisso como a API o devolve.
 *
 * `startsAt` e `endsAt` são instantes ISO-8601 em UTC. `timeZoneId` é o fuso do organizador, que é
 * o que faz "19h" continuar sendo 19h para quem leu de outro lugar.
 */
export type CalendarEntryView = {
  id: string;
  scope: CalendarScope;
  kind: CalendarEntryKind;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  /** IANA, ex.: `America/Sao_Paulo`. */
  timeZoneId: string;
  allDay: boolean;
  state: CalendarEntryState;
  /** Origem quando o compromisso veio de outro módulo (evento, mentoria); nulo quando é avulso. */
  sourceType: string | null;
  sourceId: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  /** Série a que a ocorrência pertence; nulo no compromisso único. */
  seriesId: string | null;
  /**
   * Cadência da série. Nulo no compromisso único, e também nos payloads anteriores à recorrência —
   * que leem como o mesmo "sem repetição".
   */
  recurrence: CalendarRecurrence | null;
};
