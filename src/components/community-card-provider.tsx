import type { CommunityCardProviderProps } from "@/types/components/communities/community-card-provider-props";
import { CommunityCardContext } from "@/utils/components/communities/community-card-context";
import { useCommunityCardController } from "@/utils/components/communities/use-community-card-controller";

import { CommunityCard } from "@/components/community-card";

export function CommunityCardProvider({ community }: CommunityCardProviderProps) {
  const view = useCommunityCardController(community);

  return (
    <CommunityCardContext.Provider value={{ community, ...view }}>
      <CommunityCard />
    </CommunityCardContext.Provider>
  );
}
