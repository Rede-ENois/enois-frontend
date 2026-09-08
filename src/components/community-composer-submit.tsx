import { texts } from "@/texts";
import { useCommunityComposerContext } from "@/utils/components/communities/use-community-composer-context";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CommunityComposerSubmit() {
  const { publishing, publishDisabled } = useCommunityComposerContext();

  return (
    <div className="mt-3 flex justify-end">
      <Button size="sm" className="rounded-full gap-1.5" disabled={publishDisabled}>
        <Send className="h-4 w-4" />

        <>{publishing ? texts.common.publishing : texts.common.publish}</>
      </Button>
    </div>
  );
}
