import type { ReactNode } from "react";

import { texts } from "@/texts";
import {
  PortfolioExploreError,
  PortfolioExploreSection as PortfolioExploreSectionView,
} from "@rede-enois/design-system/domain";

import { showcaseTeaserOf } from "@/lib/portfolio/portfolio-teaser";
import { useMyPortfolioEntry } from "@/lib/portfolio/use-my-portfolio-entry";
import { useShowcaseCatalog } from "@/lib/portfolio/use-showcase-catalog";

const EDITOR_HREF = "/portfolio/editar";

/**
 * A seção de vitrines no Explorar, com as outras seções como conteúdo: a de quem está lendo em
 * destaque e as demais publicadas ao lado.
 *
 * Cada leitura falha sozinha. Enquanto a própria vitrine chega, o hub desenha sozinho; se ela
 * falha, o aviso com "tentar de novo" vem antes do hub em vez de a seção sumir sem explicação. Se
 * só as outras falham, a própria continua e o próprio "carregar mais" vira o tentar de novo.
 */
export function PortfolioExploreSection({ children }: { children: ReactNode }) {
  const mine = useMyPortfolioEntry();
  const catalog = useShowcaseCatalog();

  if (mine.isPending) return <>{children}</>;

  if (mine.isError) {
    return (
      <>
        <PortfolioExploreError
          message={texts.portfolio.loadError}
          retryLabel={texts.portfolio.retry}
          onRetry={() => void mine.refetch()}
        />

        {children}
      </>
    );
  }

  return (
    <PortfolioExploreSectionView
      mine={mine.data.card}
      cards={catalog.showcases
        .filter((showcase) => showcase.username !== mine.data.card?.username)
        .map(showcaseTeaserOf)}
      editorHref={EDITOR_HREF}
      onLoadMore={catalog.hasNextPage ? () => void catalog.fetchNextPage() : undefined}
      loadingMore={catalog.isFetchingNextPage}
      loadMoreLabel={
        catalog.hasNextPage
          ? texts.portfolio.loadMore
          : catalog.isError
            ? texts.portfolio.retry
            : null
      }
      loadMoreError={catalog.isError ? texts.portfolio.showcasesLoadError : null}
    >
      {children}
    </PortfolioExploreSectionView>
  );
}
