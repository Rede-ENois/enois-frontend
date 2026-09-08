import type { CommunityImageAddActionProps } from "@/types/communities/community-image-add-action-props";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CommunityImageAddAction({ label, onClick }: CommunityImageAddActionProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full rounded-full gap-1.5"
      onClick={onClick}
    >
      <Camera className="h-4 w-4" />

      <>{label}</>
    </Button>
  );
}
