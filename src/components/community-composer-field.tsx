import { texts } from "@/texts";
import type { CommunityComposerFieldProps } from "@/types/components/communities/community-composer-field-props";

import { Textarea } from "@/components/ui/textarea";

export function CommunityComposerField({ draft, onDraftChange }: CommunityComposerFieldProps) {
  return (
    <Textarea
      value={draft}
      onChange={(event) => onDraftChange(event.target.value)}
      placeholder={texts.communities.detail.composerPlaceholder}
      className="min-h-20 resize-none rounded-2xl border-border bg-muted/40 text-sm"
      maxLength={1024}
    />
  );
}
