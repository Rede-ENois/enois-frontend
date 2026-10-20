import type { GameReview } from "./game-review";

export type GameReviews = {
  average: number;
  count: number;
  items: GameReview[];
};
