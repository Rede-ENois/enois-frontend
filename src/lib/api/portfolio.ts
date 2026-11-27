import type { PageResponse } from "@/types/application/api/page-response";
import type { MyPortfolio } from "@/types/application/portfolio/my-portfolio";
import type { PortfolioBlockInput } from "@/types/application/portfolio/portfolio-block-input";
import type { PortfolioShowcaseSummary } from "@/types/application/portfolio/portfolio-showcase-summary";
import type { PublishedPortfolio } from "@/types/application/portfolio/published-portfolio";

import { api, buildQuery } from "../api-client";

/** Portfólio profissional: a vitrine pública por username e o rascunho do dono. */
export const portfolioApi = {
  /** Só a última publicação; perfil inexistente, banido ou sem portfólio é 404. */
  byUsername: (username: string) =>
    api.get<PublishedPortfolio>(`/portfolio/${encodeURIComponent(username)}`),

  /** As vitrines no ar, mais recentes primeiro; sem HTML nem peças, só o resumo de cada uma. */
  list: (cursor?: string | null, limit = 12) =>
    api.get<PageResponse<PortfolioShowcaseSummary>>(`/portfolio${buildQuery({ cursor, limit })}`),

  mine: () => api.get<MyPortfolio>("/me/portfolio"),

  saveDraft: (html: string) => api.put<MyPortfolio>("/me/portfolio/draft", { html }),

  createBlock: (input: PortfolioBlockInput) => api.post<MyPortfolio>("/me/portfolio/blocks", input),

  updateBlock: (blockId: string, input: PortfolioBlockInput) =>
    api.put<MyPortfolio>(`/me/portfolio/blocks/${encodeURIComponent(blockId)}`, input),

  removeBlock: (blockId: string) =>
    api.delete<MyPortfolio>(`/me/portfolio/blocks/${encodeURIComponent(blockId)}`),

  reorder: (order: string[]) => api.put<MyPortfolio>("/me/portfolio/order", { order }),

  publish: () => api.post<PublishedPortfolio>("/me/portfolio/publish"),
};
