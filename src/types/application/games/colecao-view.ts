import type { GameView } from "./game-view";

export type ColecaoView = {
  id: string;
  title: string;
  description?: string | null;
  jogos: GameView[];
  createdAt: string;
};
