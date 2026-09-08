import type { CommunityCardProviderProps } from "@/types/communities/community-card-provider-props";
import { CommunityCardContext } from "@/utils/communities/community-card-context";
import { useCommunityCardController } from "@/utils/communities/use-community-card-controller";

import { CommunityCard } from "@/components/communities/community-card";

export function CommunityCardProvider({ community }: CommunityCardProviderProps) {
  const view = useCommunityCardController(community);

  return (
    <CommunityCardContext.Provider value={{ community, ...view }}>
      <CommunityCard />
    </CommunityCardContext.Provider>
  );
}
