import { Send } from "lucide-react";

import { texts } from "@/texts";
import type { CommunityComposerSubmitProps } from "@/types/components/communities/community-composer-submit-props";

import { Button } from "@/components/ui/button";

export function CommunityComposerSubmit({ publishing, disabled }: CommunityComposerSubmitProps) {
  return (
    <div className="mt-3 flex justify-end">
      <Button size="sm" className="rounded-full gap-1.5" disabled={disabled}>
        <Send className="h-4 w-4" />
        <>{publishing ? texts.common.publishing : texts.common.publish}</>
      </Button>
    </div>
  );
}
