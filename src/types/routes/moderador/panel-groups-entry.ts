import type { PanelGroup } from "./panel-group";
import type { PanelTab } from "./panel-tab";

/** Um grupo com as abas visíveis dentro dele (resultado de `visiblePanelGroups`). */
export type PanelGroupEntry = {
  group: PanelGroup;
  tabs: PanelTab[];
};
