import { Users } from "lucide-react";

import { texts } from "@/texts";
import { useCommunityCardContext } from "@/utils/components/communities/use-community-card-context";

import { Button } from "@/components/ui/button";

export function CommunityCardFooter() {
  const { community, membershipAction } = useCommunityCardContext();

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />

        <>{texts.communities.members(community.members ?? 0)}</>
      </span>

      <Button
        size="sm"
        variant={membershipAction.variant}
        className="rounded-full"
        disabled={membershipAction.disabled}
        onClick={membershipAction.run}
      >
        {membershipAction.label}
      </Button>
    </div>
  );
}
