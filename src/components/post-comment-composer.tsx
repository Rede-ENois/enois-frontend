import { texts } from "@/texts";
import type { PostCommentComposerProps } from "@/types/components/post/post-comment-composer-props";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { MentionTextarea } from "@/components/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";

export function PostCommentComposer({
  currentUser,
  draft,
  onDraftChange,
  onSubmit,
  submitDisabled,
}: PostCommentComposerProps) {
  return (
    <form onSubmit={onSubmit} className="mt-4 flex items-center gap-2.5">
      <UserAvatar src={currentUser?.avatar} alt={currentUser?.name} className="h-8 w-8 shrink-0" />

      <div className="flex flex-1 items-center gap-2 rounded-full border border-border-soft bg-surface-1 py-1.5 pl-4 pr-1.5">
        <MentionTextarea
          value={draft}
          onChange={onDraftChange}
          placeholder={texts.posts.comments.placeholder}
          className="h-6 min-h-6 flex-1 resize-none border-0 bg-transparent p-0 text-[13px] font-light outline-none"
          maxLength={280}
        />

        <Button
          type="submit"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-full"
          disabled={submitDisabled}
          aria-label={texts.posts.comments.send}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
