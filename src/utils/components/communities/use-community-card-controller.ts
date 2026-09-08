import type { Community } from "@/types/application/community/community";
import { createCommunityCardViewModel } from "@/utils/components/communities/create-community-card-view-model";
import { useCommunitiesPageContext } from "@/utils/components/communities/use-communities-page-context";

export function useCommunityCardController(community: Community) {
  const { membershipPending, toggleMembership } = useCommunitiesPageContext();

  return createCommunityCardViewModel(community, membershipPending, toggleMembership);
}
