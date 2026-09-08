import { createCommunityDetailPageViewModel } from "@/utils/components/communities/create-community-detail-page-view-model";
import { useCommunityDetailData } from "@/utils/components/communities/use-community-detail-data";

export function useCommunityDetailPageController() {
  const data = useCommunityDetailData();
  return createCommunityDetailPageViewModel(data.community, data.members, data.posts);
}
