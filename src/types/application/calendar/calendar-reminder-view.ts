/**
 * Um lembrete do leitor para um compromisso, como o `ReminderView` do backend devolve. Os
 * resolvidos (enviados, ou encerrados por cancelamento) não entram na lista: o `ofReader` do
 * serviço filtra por `sentAt == null`, então quem chega aqui ainda vai tocar.
 */
export type CalendarReminderView = {
  id: string;
  entryId: string;
  minutesBefore: number;
  /** ISO instant; `startsAt - minutesBefore` no momento da criação. */
  dueAt: string;
  /** Sempre `false` nesta lista — o backend não devolve o que já enviou. */
  sent: boolean;
};
