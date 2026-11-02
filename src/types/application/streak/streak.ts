/** `GET /me/streak` (e o campo `streak` de `/carteira`): o hábito diário da pessoa. */
export type Streak = {
  currentDays: number;
  longestDays: number;
  todayDone: boolean;
  /** 0 ou 1: um dia de descanso por semana ISO, aplicado sozinho quando falta exatamente um dia. */
  freezesAvailable: number;
  /** `AAAA-MM-DD` do último descanso usado, ou `null`. */
  lastFrozenDay: string | null;
};
