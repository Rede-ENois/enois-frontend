import type { FeedComposerPublishButtonProps } from "@/types/components/feed/feed-composer-publish-button-props";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function FeedComposerPublishButton({
  disabled,
  isPublishing,
  label,
}: FeedComposerPublishButtonProps) {
  return (
    <Button size="sm" className="rounded-full" disabled={disabled}>
      {isPublishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      <>{label}</>
    </Button>
  );
}
