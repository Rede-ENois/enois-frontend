export type StudyPairCheckinView = {
  userId: string;
  /** ISO week, e.g. "2026-W44" (America/Sao_Paulo). */
  weekKey: string;
  /** May be empty: a check-in without words. */
  note: string;
  createdAt: string;
  updatedAt: string;
};
