import type { Community } from "@/types/application/community/community";
import type { CommunityTopicOption } from "@/types/communities/community-topic-option";

export type CommunitiesPageContextValue = {
  isDetail: boolean;
  communities: Community[];
  topicOptions: CommunityTopicOption[];
  membershipPending: boolean;
  toggleMembership: (communityId: string, joined: boolean) => void;
  showLoadMore: boolean;
  loadMore: () => void;
  loadMoreDisabled: boolean;
  isFetching: boolean;
};
