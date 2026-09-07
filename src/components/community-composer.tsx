import { Send } from "lucide-react";

import { useCommunityComposerController } from "@/lib/use-community-composer-controller";
import { texts } from "@/texts";
import type { CommunityComposerProps } from "@/types/components/communities/community-composer-props";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommunityComposer({ communityId }: CommunityComposerProps) {
  const { draft, setDraft, submit, publishing } = useCommunityComposerController(communityId);

  return (
    <form onSubmit={submit} className="surface-card p-5">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={texts.communities.detail.composerPlaceholder}
        className="min-h-20 resize-none rounded-2xl border-border bg-muted/40 text-sm"
        maxLength={1024}
      />
      <div className="mt-3 flex justify-end">
        <Button size="sm" className="rounded-full gap-1.5" disabled={!draft.trim() || publishing}>
          <Send className="h-4 w-4" />
          <>{publishing ? texts.common.publishing : texts.common.publish}</>
        </Button>
      </div>
    </form>
  );
}
