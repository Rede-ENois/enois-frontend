import type { BlocksAction } from "@/types/application/daily-games/blocks-action";
import type { BlocksLeaderboard } from "@/types/application/daily-games/blocks-leaderboard";
import type { BlocksState } from "@/types/application/daily-games/blocks-state";
import type { GamePrizeTable } from "@/types/application/daily-games/game-prize-table";
import type { MazeDirection } from "@/types/application/daily-games/maze-direction";
import type { MazeLeaderboard } from "@/types/application/daily-games/maze-leaderboard";
import type { MazeState } from "@/types/application/daily-games/maze-state";
import type { WordLeaderboard } from "@/types/application/daily-games/word-leaderboard";
import type { WordState } from "@/types/application/daily-games/word-state";

import { api } from "@/lib/api-client";

export const dailyWordsApi = {
  today: (date?: string) =>
    api.get<WordState>(
      `/daily-games/words/today${date ? `?date=${encodeURIComponent(date)}` : ""}`,
    ),
  start: () => api.post<WordState>("/daily-games/words/today/start"),
  guess: (guess: string, requestId: string, date?: string) =>
    api.post<WordState>(
      `/daily-games/words/today/guesses${date ? `?date=${encodeURIComponent(date)}` : ""}`,
      { guess, requestId },
    ),
  leaderboard: () => api.get<WordLeaderboard>("/daily-games/words/leaderboard"),
};

export const dailyMazeApi = {
  today: (date?: string) =>
    api.get<MazeState>(`/daily-games/maze/today${date ? `?date=${encodeURIComponent(date)}` : ""}`),
  start: () => api.post<MazeState>("/daily-games/maze/today/start"),
  move: (direction: MazeDirection, requestId: string, date?: string) =>
    api.post<MazeState>(
      `/daily-games/maze/today/moves${date ? `?date=${encodeURIComponent(date)}` : ""}`,
      { direction, requestId },
    ),
  leaderboard: () => api.get<MazeLeaderboard>("/daily-games/maze/leaderboard"),
};

export const dailyBlocksApi = {
  today: (date?: string) =>
    api.get<BlocksState>(
      `/daily-games/blocks/today${date ? `?date=${encodeURIComponent(date)}` : ""}`,
    ),
  start: () => api.post<BlocksState>("/daily-games/blocks/today/start"),
  action: (action: BlocksAction, requestId: string, date?: string) =>
    api.post<BlocksState>(
      `/daily-games/blocks/today/actions${date ? `?date=${encodeURIComponent(date)}` : ""}`,
      { action, requestId },
    ),
  leaderboard: () => api.get<BlocksLeaderboard>("/daily-games/blocks/leaderboard"),
};

export function previousChallengeDate(date: string): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

export const dailyGamesRewardsApi = {
  prizes: () => api.get<GamePrizeTable>("/daily-games/rewards/prizes"),
};
