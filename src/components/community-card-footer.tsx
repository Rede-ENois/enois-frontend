import { Users } from "lucide-react";

import { texts } from "@/texts";
import type { CommunityCardFooterProps } from "@/types/components/communities/community-card-footer-props";

import { Button } from "@/components/ui/button";

export function CommunityCardFooter({ members, membershipAction }: CommunityCardFooterProps) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />

        <>{texts.communities.members(members)}</>
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
