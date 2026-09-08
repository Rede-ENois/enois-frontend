import { CommunityHeaderContext } from "@/utils/components/communities/community-header-context";
import { useCommunityHeaderController } from "@/utils/components/communities/use-community-header-controller";

import { CommunityHeader } from "@/components/community-header";

export function CommunityHeaderProvider() {
  const controller = useCommunityHeaderController();

  return (
    <CommunityHeaderContext.Provider value={controller}>
      <CommunityHeader />
    </CommunityHeaderContext.Provider>
  );
}
