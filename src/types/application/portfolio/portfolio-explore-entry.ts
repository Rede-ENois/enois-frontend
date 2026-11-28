import type { PortfolioExploreCard } from "@rede-enois/design-system/domain";

/**
 * A própria vitrine no Explorar e na entrada do feed: `published` com o resumo do que está no ar,
 * `unpublished` quando ela ainda não foi publicada — os dois estados com resposta do servidor.
 */
export type PortfolioExploreEntry =
  { kind: "published"; card: PortfolioExploreCard } | { kind: "unpublished"; card: null };
