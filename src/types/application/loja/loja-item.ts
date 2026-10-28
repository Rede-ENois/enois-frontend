import type { CosmeticKind } from "@rede-enois/design-system/domain";

export type LojaItem = {
  id: string;
  kind: CosmeticKind;
  /** Seasonal collection id; `null` for the classic frames that are always on sale. */
  collection: string | null;
  name: string;
  description: string;
  priceMf: number;
  cssRing: string;
  releaseOrder: number;
  /** In season today; out of season it is listed but cannot be bought. */
  available: boolean;
  /** `false` for event rewards, which are never sold. */
  purchasable: boolean;
  owned?: boolean;
  equipped?: boolean;
};
