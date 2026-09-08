import { Link } from "@tanstack/react-router";

import { useCommunityCardContext } from "@/utils/components/communities/use-community-card-context";

import { CommunityCardContent } from "@/components/community-card-content";
import { CommunityCardCover } from "@/components/community-card-cover";

export function CommunityCard() {
  const { community, coverUrl } = useCommunityCardContext();

  return (
    <Link to="/comunidades/$communityId" params={{ communityId: community.id }}>
      <article className="surface-card overflow-hidden cursor-pointer transition hover:shadow-[var(--shadow-card)]">
        <CommunityCardCover coverUrl={coverUrl} />
        <CommunityCardContent />
      </article>
    </Link>
  );
}
