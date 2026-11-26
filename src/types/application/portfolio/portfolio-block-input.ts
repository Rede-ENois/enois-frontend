import type { PortfolioBlockType } from "./portfolio-block-type";

/** O corpo de `PUT /me/portfolio/blocks/{id}` e `POST /me/portfolio/blocks`. */
export type PortfolioBlockInput = {
  type: PortfolioBlockType;
  title?: string;
  text?: string;
  projectId?: string;
  mediaId?: string;
  linkUrl?: string;
};
