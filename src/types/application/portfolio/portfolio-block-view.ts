import type { PortfolioBlockType } from "./portfolio-block-type";

/** Uma peça como a API a devolve: referências cruas, sem o card do projeto nem a URL da mídia. */
export type PortfolioBlockView = {
  id: string;
  position: number;
  type: PortfolioBlockType;
  title: string | null;
  text: string | null;
  projectId: string | null;
  mediaId: string | null;
  linkUrl: string | null;
  /** Se a peça já está na última publicação. */
  published: boolean;
};
