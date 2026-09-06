import { Send } from "lucide-react";

import { texts } from "@/texts";
import type { CommunityComposerProps } from "@/types/components/community/community-composer-props";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommunityComposer({ content, isPending, onContentChange, onSubmit }: CommunityComposerProps) {
  return (
    <form onSubmit={onSubmit} className="surface-card p-5">
      <Textarea value={content} onChange={(event) => onContentChange(event.target.value)} placeholder={texts.communities.detail.composerPlaceholder} className="min-h-20 resize-none rounded-2xl border-border bg-muted/40 text-sm" maxLength={1024} />
      <div className="mt-3 flex justify-end">
        <Button size="sm" className="rounded-full gap-1.5" disabled={!content.trim() || isPending}>
          <Send className="h-4 w-4" />{isPending ? texts.common.publishing : texts.common.publish}
        </Button>
      </div>
    </form>
  );
}
