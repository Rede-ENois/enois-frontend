import { Link } from "@tanstack/react-router";

import { Users } from "lucide-react";

import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";
import type { CommunityCardProps } from "@/types/components/community/community-card-props";

import { Button } from "@/components/ui/button";

export function CommunityCard({
  community,
  isPending,
  onJoin,
  onLeave,
}: CommunityCardProps) {
  const membershipAction = community.joined
    ? {
        label: texts.communities.participating,
        variant: "secondary" as const,
        run: onLeave,
      }
    : {
        label: texts.communities.enter,
        variant: "default" as const,
        run: onJoin,
      };

  return (
    <Link to="/comunidades/$communityId" params={{ communityId: community.id }}>
      <article className="surface-card cursor-pointer overflow-hidden transition hover:shadow-[var(--shadow-card)]">
        {community.cover ? (
          <img src={resolveCdnUrl(community.cover)} alt="" className="h-32 w-full object-cover" />
        ) : (
          <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="p-5">
          <div className="mb-3 flex items-center gap-3">
            {community.avatar && (
              <img
                src={resolveCdnUrl(community.avatar)}
                alt=""
                className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">{community.topic}</p>
              <h3 className="truncate font-semibold">{community.name}</h3>
            </div>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{community.description}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {texts.communities.members(community.members ?? 0)}
            </span>
            <Button
              size="sm"
              variant={membershipAction.variant}
              className="rounded-full"
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                membershipAction.run(community.id);
              }}
            >
              {membershipAction.label}
            </Button>
          </div>
        </div>
      </article>
    </Link>
  );
}
