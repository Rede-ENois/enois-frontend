import type { ChangelogAction } from "./changelog-action";

export type ChangelogItem = {
  id: string;
  title: string;
  description: string;
  tag?: string;
  /** Passos curtos de como usar a novidade. */
  steps?: string[];
  /** Botão "Experimentar" que leva direto para a tela da feature. */
  action?: ChangelogAction;
};
