import { ProfileExplorePanel as ProfileExplorePanelView } from "@rede-enois/design-system/domain";

/** O convite de exploração encerra o trilho, sem interromper a leitura dos cards sociais. */
export function ProfileExplorePanel() {
  return <ProfileExplorePanelView dailyGamesHref="/jogos-diarios" appearanceHref="/marketplace" />;
}
