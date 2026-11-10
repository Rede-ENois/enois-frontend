import type { ModeratorGroupId } from "./moderator-group-id";

/** Um grupo de navegação do painel de moderação. */
export type PanelGroup = {
  id: ModeratorGroupId;
  label: string;
};
