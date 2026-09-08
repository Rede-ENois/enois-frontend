import { CommunityHeaderContext } from "@/utils/communities/community-header-context";
import { useCommunityHeaderController } from "@/utils/communities/use-community-header-controller";

import { CommunityHeader } from "@/components/communities/community-header";

export function CommunityHeaderProvider() {
  const controller = useCommunityHeaderController();

  return (
    <CommunityHeaderContext.Provider value={controller}>
      <CommunityHeader />
    </CommunityHeaderContext.Provider>
  );
}
