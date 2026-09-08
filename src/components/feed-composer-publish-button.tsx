import { Loader2 } from "lucide-react";

import { useFeedComposerContext } from "@/utils/components/feed/use-feed-composer-context";

import { Button } from "@/components/ui/button";

export function FeedComposerPublishButton() {
  const { publishDisabled, isPublishing, publishButtonLabel } = useFeedComposerContext();

  return (
    <Button size="sm" className="rounded-full" disabled={publishDisabled}>
      {isPublishing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      <>{publishButtonLabel}</>
    </Button>
  );
}
