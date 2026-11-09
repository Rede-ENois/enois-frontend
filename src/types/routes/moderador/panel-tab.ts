import type { ModeratorTabId } from "./moderator-tab-id";

/** Uma aba do painel de moderação (ver PANEL_TABS em `/moderador`). */
export type PanelTab = {
  id: ModeratorTabId;
  label: string;
  adminOnly: boolean;
  /** Fila do dia: o que chegou para o time decidir agora. */
  queue?: boolean;
};
