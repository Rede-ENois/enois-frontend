export type MazeState = {
  date: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "WON";
  passages: number[] | null;
  position: number;
  moves: number;
  startedAt: string | null;
  completedAt: string | null;
};
