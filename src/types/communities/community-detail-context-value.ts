import type { Community } from "@/types/application/community/community";
import type { CommunityMember } from "@/types/application/community/community-member";
import type { PostView } from "@/types/application/feed/post-view";

export type CommunityDetailContextValue = {
  community: Community;
  members: CommunityMember[];
  posts: PostView[];
  showComposer: boolean;
  showEmptyState: boolean;
  emptyMessage: string;
};
