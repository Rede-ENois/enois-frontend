import { texts } from "@/texts";
import type { Community } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";
import type { PostView } from "@/types/application/feed/post-view";

export function createCommunityDetailPageViewModel(
  community: Community,
  members: CommunityMember[],
  posts: PostView[],
) {
  return {
    community,
    members,
    posts,
    showComposer: community.joined,
    showEmptyState: posts.length === 0,
    emptyMessage: community.joined
      ? texts.communities.detail.emptyMember
      : texts.communities.detail.emptyGuest,
  };
}
