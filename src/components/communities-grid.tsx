import type { CommunitiesGridProps } from "@/types/components/communities/communities-grid-props";

import { CommunityCard } from "@/components/community-card";

export function CommunitiesGrid({
  communities,
  membershipPending,
  onToggleMembership,
}: CommunitiesGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard
          key={community.id}
          community={community}
          membershipPending={membershipPending}
          onToggleMembership={onToggleMembership}
        />
      ))}
    </div>
  );
}
