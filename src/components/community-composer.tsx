import { type FormEvent, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Send } from "lucide-react";

import { createPost } from "@/lib/api/feed/create-post";
import { texts } from "@/texts";
import type { CommunityComposerProps } from "@/types/components/communities/community-composer-props";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function CommunityComposer({ communityId }: CommunityComposerProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const createPostMutation = useMutation({
    mutationFn: (content: string) => createPost({ type: "INSIGHT", content, communityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", communityId, "feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setDraft("");
    },
  });

  const handlePost = (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    createPostMutation.mutate(content);
  };

  return (
    <form onSubmit={handlePost} className="surface-card p-5">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={texts.communities.detail.composerPlaceholder}
        className="min-h-20 resize-none rounded-2xl border-border bg-muted/40 text-sm"
        maxLength={1024}
      />
      <div className="mt-3 flex justify-end">
        <Button
          size="sm"
          className="rounded-full gap-1.5"
          disabled={!draft.trim() || createPostMutation.isPending}
        >
          <Send className="h-4 w-4" />
          <>{createPostMutation.isPending ? texts.common.publishing : texts.common.publish}</>
        </Button>
      </div>
    </form>
  );
}
