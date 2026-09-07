import { Link } from "@tanstack/react-router";

import type { CommunityCardProps } from "@/types/components/communities/community-card-props";

import { createCommunityCardViewModel } from "@/utils/components/communities/create-community-card-view-model";

import { CommunityCardContent } from "@/components/community-card-content";
import { CommunityCardCover } from "@/components/community-card-cover";

export function CommunityCard(props: CommunityCardProps) {
  const { community } = props;
  const view = createCommunityCardViewModel(props);

  return (
    <Link to="/comunidades/$communityId" params={{ communityId: community.id }}>
      <article className="surface-card overflow-hidden cursor-pointer transition hover:shadow-[var(--shadow-card)]">
        <CommunityCardCover coverUrl={view.coverUrl} />
        <CommunityCardContent
          community={community}
          avatarUrl={view.avatarUrl}
          membershipAction={view.membershipAction}
        />
      </article>
    </Link>
  );
}
