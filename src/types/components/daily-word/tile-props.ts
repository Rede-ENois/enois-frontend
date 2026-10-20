import type { TileState } from "./tile-state";

export interface TileProps {
  letter: string;
  state: TileState;
  revealed: boolean;
  col: number;
  animate: boolean;
}
