import { useQuery } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";

import { texts } from "@/texts";

import { getCommunity } from "@/lib/api/communities/get-community";
import { getCommunityFeed } from "@/lib/api/communities/get-community-feed";
import { getCommunityMembers } from "@/lib/api/communities/get-community-members";

export function useCommunityDetailPageController() {
  const community = useLoaderData({ from: "/comunidades/$communityId" });

  const { data: liveCommunity } = useQuery({
    queryKey: ["community", community.id],
    queryFn: () => getCommunity(community.id),
    initialData: community,
  });
  const { data: membersData } = useQuery({
    queryKey: ["community", community.id, "members"],
    queryFn: () => getCommunityMembers(community.id),
  });
  const { data: feedData } = useQuery({
    queryKey: ["community", community.id, "feed"],
    queryFn: () => getCommunityFeed(community.id),
  });

  const posts = feedData?.items ?? [];

  return {
    community: liveCommunity,
    members: membersData?.items ?? [],
    posts,
    showComposer: liveCommunity.joined,
    showEmptyState: posts.length === 0,
    emptyMessage: liveCommunity.joined
      ? texts.communities.detail.emptyMember
      : texts.communities.detail.emptyGuest,
  };
}
