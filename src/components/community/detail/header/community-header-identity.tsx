import { Link } from "@tanstack/react-router";

import { Users } from "lucide-react";

import type { Community, CommunityMember } from "@/lib/api";
import { resolveCdnUrl } from "@/lib/api/media";
import { texts } from "@/texts";

import { Badge } from "@/components/ui/badge";

export function CommunityHeaderIdentity({ community, admins }: {
  community: Community;
  admins: CommunityMember[];
}) {
  return (
    <div className="flex min-w-0 items-start gap-4">
      {community.avatar && <img src={resolveCdnUrl(community.avatar)} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover ring-4 ring-card" />}
      <div className="min-w-0">
        <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">{community.topic}</Badge>
        <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight">{community.name}</h1>
        <p className="mt-1 break-words text-muted-foreground">{community.description}</p>
        <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {texts.communities.memberCount(community.members)}</span>
          {admins.length > 0 && (
            <span>
              {texts.communities.detail.createdBy}{" "}
              <Link to="/perfil/$username" params={{ username: admins[0].username }} className="font-medium text-foreground hover:underline">
                {admins[0].name}
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
