import type { PortfolioBlockView } from "./portfolio-block-view";

/** `GET /me/portfolio`: o rascunho do dono e a última publicação. */
export type MyPortfolio = {
  html: string | null;
  /** 0 = nunca publicado. */
  publishedVersion: number;
  publishedAt: string | null;
  blocks: PortfolioBlockView[];
};
