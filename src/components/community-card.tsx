import { topicLabel } from "@/constants/community-topics";
import type { CommunityCardProps } from "@/types/components/community-card-props";
import { CommunityCard as CommunityCardView } from "@rede-enois/design-system/domain";

import { BannerHtmlFrame } from "@/components/banner-html-frame";
import { CommunityFavoriteButton } from "@/components/community-favorite-button";

/** Wires the design system community card to its route and to the account's favorites. */
export function CommunityCard({
  community,
  joinPending,
  leavePending,
  ownerBlocked,
  onJoin,
  onLeave,
}: CommunityCardProps) {
  return (
    <CommunityCardView
      community={{ ...community, topicLabel: topicLabel(community.topic) }}
      href={`/comunidades/${community.id}`}
      joinPending={joinPending}
      leavePending={leavePending}
      ownerBlocked={ownerBlocked}
      onJoin={() => onJoin(community.id)}
      onLeave={() => onLeave(community)}
      favorite={<CommunityFavoriteButton communityId={community.id} />}
      renderHtmlFrame={(props) => <BannerHtmlFrame {...props} />}
    />
  );
}
