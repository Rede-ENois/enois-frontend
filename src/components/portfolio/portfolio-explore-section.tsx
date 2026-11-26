import type { ReactNode } from "react";

import { texts } from "@/texts";
import {
  PortfolioExploreError,
  PortfolioExploreSection as PortfolioExploreSectionView,
} from "@rede-enois/design-system/domain";

import { useMyPortfolioEntry } from "@/lib/portfolio/use-my-portfolio-entry";

const EDITOR_HREF = "/portfolio/editar";

/**
 * A seção de vitrines no Explorar, com as outras seções como conteúdo. Enquanto a própria vitrine
 * chega, o hub desenha sozinho; se a leitura falha, o aviso com "tentar de novo" vem antes dele em
 * vez de a seção sumir sem explicação.
 */
export function PortfolioExploreSection({ children }: { children: ReactNode }) {
  const mine = useMyPortfolioEntry();

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

  if (mine.isPending) return <>{children}</>;

  return (
    <PortfolioExploreSectionView mine={mine.data.card} cards={[]} editorHref={EDITOR_HREF}>
      {children}
    </PortfolioExploreSectionView>
  );
}
