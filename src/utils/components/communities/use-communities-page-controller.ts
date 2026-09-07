import { useMatchRoute } from "@tanstack/react-router";

import { createCommunityTopicOptions } from "@/utils/components/communities/create-community-topic-options";
import { useCommunityListController } from "@/utils/components/communities/use-community-list-controller";
import { useCommunityMembershipController } from "@/utils/components/communities/use-community-membership-controller";

export function useCommunitiesPageController() {
  const matchRoute = useMatchRoute();
  const isDetail = Boolean(matchRoute({ to: "/comunidades/$communityId" }));
  const list = useCommunityListController(isDetail);
  const membership = useCommunityMembershipController();

  return {
    isDetail,
    communities: list.communities,
    topicOptions: createCommunityTopicOptions(list.topic, list.changeTopic),
    membershipPending: membership.pending,
    toggleMembership: membership.toggle,
    showLoadMore: Boolean(list.nextCursor),
    loadMore: list.loadMore,
    loadMoreDisabled: list.isFetching,
    isFetching: list.isFetching,
  };
}
