import { CommunityDetailContext } from "@/utils/components/communities/community-detail-context";
import { useCommunityDetailPageController } from "@/utils/components/communities/use-community-detail-page-controller";

import { CommunityDetail } from "@/components/pages/community-detail-page";

export function CommunityDetailProvider() {
  const value = useCommunityDetailPageController();

  return (
    <CommunityDetailContext.Provider value={value}>
      <CommunityDetail />
    </CommunityDetailContext.Provider>
  );
}
