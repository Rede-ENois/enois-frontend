import { useQuery } from "@tanstack/react-query";

import { topicLabel } from "@/constants/community-topics";
import type { ProfileCommunityShelfProps } from "@/types/components/profile/profile-community-shelf-props";
import { ProfileCommunityShelf as ProfileCommunityShelfView } from "@rede-enois/design-system/domain";

import { communitiesApi } from "@/lib/api";

/**
 * O perfil só consulta as comunidades da própria pessoa: a API não expõe os círculos de terceiros,
 * então não inventamos uma associação para quem está visitando o perfil.
 */
export function ProfileCommunityShelf({ isOwner }: ProfileCommunityShelfProps) {
  const { data: communitiesData, isLoading } = useQuery({
    queryKey: ["communities", "mine", "profile-shelf"],
    queryFn: () => communitiesApi.mine(4),
    enabled: isOwner,
  });

  if (!isOwner) return null;

  return (
    <ProfileCommunityShelfView
      communities={(communitiesData?.items ?? []).map((community) => ({
        id: community.id,
        name: community.name,
        avatar: community.avatar,
        topicLabel: community.topic ? (topicLabel(community.topic) ?? "") : null,
        members: community.members,
        href: `/comunidades/${community.id}`,
      }))}
      loading={isLoading}
      communitiesHref="/comunidades"
    />
  );
}
