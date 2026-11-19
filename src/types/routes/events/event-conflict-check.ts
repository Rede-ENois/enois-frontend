/**
 * O horário de um evento, como o card mostra: `date` e `time` no fuso do app.
 *
 * É dali que sai a janela consultada na agenda antes de confirmar presença. Ler a hora no fuso do
 * navegador deslocaria o aviso para o horário errado.
 */
export type EventConflictCheck = {
  date: string;
  time: string;
};
