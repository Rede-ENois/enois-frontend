export interface UserWordStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: Record<number, number>;
  lastRecordedDate?: string;
}
