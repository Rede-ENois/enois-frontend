import type { CommunityCardContentProps } from "@/types/components/communities/community-card-content-props";

import { CommunityCardFooter } from "@/components/community-card-footer";

export function CommunityCardContent({
  community,
  avatarUrl,
  membershipAction,
}: CommunityCardContentProps) {
  return (
    <div className="p-5">
      <div className="mb-3 flex items-center gap-3">
        {avatarUrl && (
          <img
            src={avatarUrl}
            alt=""
            className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
          />
        )}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">
            {community.topic}
          </p>

          <h3 className="truncate font-semibold">{community.name}</h3>
        </div>
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
        {community.description}
      </p>

      <CommunityCardFooter
        members={community.members ?? 0}
        membershipAction={membershipAction}
      />
    </div>
  );
}
