import { texts } from "@/texts";
import { useCommunityComposerContext } from "@/utils/communities/use-community-composer-context";

import { Textarea } from "@/components/ui/textarea";

export function CommunityComposerField() {
  const { draft, setDraft } = useCommunityComposerContext();

  return (
    <Textarea
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      placeholder={texts.communities.detail.composerPlaceholder}
      className="min-h-20 resize-none rounded-2xl border-border bg-muted/40 text-sm"
      maxLength={1024}
    />
  );
}
