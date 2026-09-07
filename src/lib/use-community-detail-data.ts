import { useQuery } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";

import { getCommunity } from "@/lib/api/communities/get-community";
import { getCommunityFeed } from "@/lib/api/communities/get-community-feed";
import { getCommunityMembers } from "@/lib/api/communities/get-community-members";

export function useCommunityDetailData() {
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

  return {
    community: liveCommunity,
    members: membersData?.items ?? [],
    posts: feedData?.items ?? [],
  };
}
