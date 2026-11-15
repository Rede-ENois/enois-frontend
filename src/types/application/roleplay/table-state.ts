export type TableState = {
  tableId: string;
  turnOrder: string[];
  activeTurnUserId: string | null;
  turnStartedAt: string | null;
  scene: string | null;
  updatedAt: string;
};
