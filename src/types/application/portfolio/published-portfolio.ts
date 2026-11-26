import type { PortfolioBlockView } from "./portfolio-block-view";

/** `GET /portfolio/{username}`: o retrato da última publicação. */
export type PublishedPortfolio = {
  username: string;
  version: number;
  html: string | null;
  publishedAt: string;
  blocks: PortfolioBlockView[];
};
