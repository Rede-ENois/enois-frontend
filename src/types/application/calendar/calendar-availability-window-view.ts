/**
 * Uma janela da semana de disponibilidade, como o backend devolve em
 * `GET /calendar/availability`. `startsAt`/`endsAt` são `hh:mm` de parede no fuso `timezone`,
 * não instantes: a regra é semanal e precisa sobreviver à mudança de horário da cidade.
 *
 * A janela é meio aberta: 09:00–12:00 e 12:00–18:00 se encostam sem sobrepor. Nenhuma atravessa a
 * meia-noite — 22h às 2h são duas janelas, uma em cada dia.
 */
export type CalendarAvailabilityWindowView = {
  id: string;
  /** ISO-8601: 1 = segunda … 7 = domingo. */
  dayOfWeek: number;
  /** `hh:mm`. */
  startsAt: string;
  /** `hh:mm`. */
  endsAt: string;
  /** IANA id, e.g. `America/Sao_Paulo`. */
  timezone: string;
};

/**
 * O que a escrita manda: a semana inteira, com `id` omitido porque o servidor substitui o conjunto
 * (o que não vier deixa de existir).
 */
