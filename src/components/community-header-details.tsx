import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { useCommunityHeaderController } from "@/utils/components/communities/use-community-header-controller";
import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export function CommunityHeaderDetails() {
  const { community, primaryAdmin } = useCommunityHeaderController();

  return (
    <div className="min-w-0">
      <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
        {community.topic}
      </Badge>

      <h1 className="mt-2 break-words text-2xl font-semibold tracking-tight">{community.name}</h1>

      <p className="mt-1 break-words text-muted-foreground">{community.description}</p>

      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" />

          <>{texts.communities.memberCount(community.members)}</>
        </span>

        {primaryAdmin && (
          <span>
            <>{texts.communities.detail.createdBy}</>

            <Link
              to="/perfil/$username"
              params={{ username: primaryAdmin.username }}
              className="font-medium text-foreground hover:underline"
            >
              {primaryAdmin.name}
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}
