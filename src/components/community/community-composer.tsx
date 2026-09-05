import type { FormEventHandler } from "react";

import { Send } from "lucide-react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommunityComposerProps = {
  draft: string;
  pending: boolean;
  onDraftChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function CommunityComposer({
  draft,
  pending,
  onDraftChange,
  onSubmit,
}: CommunityComposerProps) {
  return (
    <form onSubmit={onSubmit} className="surface-card p-5">
      <Textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder={texts.communities.detail.composerPlaceholder}
        className="min-h-20 resize-none rounded-2xl border-border bg-muted/40 text-sm"
        maxLength={1024}
      />
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          disabled={!draft.trim() || pending}
        >
          <Send className="h-4 w-4" />
          {pending ? texts.common.publishing : texts.common.publish}
        </Button>
      </div>
    </form>
  );
}
