import type { PortfolioMediaKind } from "@rede-enois/design-system/domain";

/** O que a peça de mídia aponta, quando o app conseguiu resolver o arquivo. */
export type PortfolioMedia = {
  kind: PortfolioMediaKind;
  fileUrl: string;
  imageUrl: string | null;
};
