import { PortfolioFeedEntry as PortfolioFeedEntryView } from "@rede-enois/design-system/domain";

import { useMyPortfolioEntry } from "@/lib/portfolio/use-my-portfolio-entry";

const EDITOR_HREF = "/portfolio/editar";

/**
 * A vitrine na entrada do feed principal: a de quem está lendo, com o atalho para o editor, ou o
 * convite para montar a dela. Sem a leitura, a entrada sai de cena: o feed segue sem ela.
 */
export function PortfolioFeedEntry() {
  const mine = useMyPortfolioEntry();

  if (mine.isError) return null;

  return (
    <PortfolioFeedEntryView
      mine={mine.data?.card ?? null}
      editorHref={EDITOR_HREF}
      loading={mine.isPending}
    />
  );
}
