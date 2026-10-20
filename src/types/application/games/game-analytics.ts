import type { GameAnalyticsDay } from "./game-analytics-day";

export type GameAnalytics = {
  from: string;
  to: string;
  days: number;
  plays: number;
  players: number;
  favorites: number;
  updates: number;
  series: GameAnalyticsDay[];
};
