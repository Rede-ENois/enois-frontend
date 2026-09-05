import type { Community } from "@/lib/api";

import { CommunityCard } from "./community-card";

export function CommunitiesGrid({
  communities,
  pending,
  onJoin,
  onLeave,
}: {
  communities: Community[];
  pending: boolean;
  onJoin: (communityId: string) => void;
  onLeave: (communityId: string) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((community) => (
        <CommunityCard
          key={community.id}
          community={community}
          pending={pending}
          onJoin={onJoin}
          onLeave={onLeave}
        />
      ))}
    </div>
  );
}
