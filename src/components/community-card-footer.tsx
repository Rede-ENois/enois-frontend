import { useCommunityCardContext } from "@/utils/components/communities/use-community-card-context";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CommunityCardFooter() {
  const { membersLabel, membershipAction } = useCommunityCardContext();

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />

        <>{membersLabel}</>
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
