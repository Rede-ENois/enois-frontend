import { PLATFORM_SPACES } from "@/constants/platform-spaces";
import { PlatformSpacesCard as PlatformSpacesCardView } from "@rede-enois/design-system/domain";

/** Atalhos dos espaços novos no painel lateral (feed). */
export function PlatformSpacesCard() {
  return (
    <PlatformSpacesCardView
      spaces={PLATFORM_SPACES.filter(
        (space) => !("inSidebar" in space) || space.inSidebar !== false,
      ).map((space) => ({ href: space.to, label: space.label }))}
    />
  );
}
