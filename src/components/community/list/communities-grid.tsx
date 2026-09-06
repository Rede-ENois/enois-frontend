import type { Community } from "@/lib/api";

import { CommunityCard } from "./community-card";

type CommunitiesGridProps = {
  communities: Community[];
  isPending: boolean;
  onJoin: (communityId: string) => void;
  onLeave: (communityId: string) => void;
};

export function CommunitiesGrid({
  communities,
  isPending,
  onJoin,
  onLeave,
}: CommunitiesGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard
          key={community.id}
          community={community}
          isPending={isPending}
          onJoin={onJoin}
          onLeave={onLeave}
        />
      ))}
    </div>
  );
}
