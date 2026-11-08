import type { CallView } from "./call-view";

/** Uma chamada da fila assumiu a tela: `left` é a sala que a pessoa largou para atendê-la. */
export interface CallSwap {
  next: CallView;
  left: CallView | null;
}
