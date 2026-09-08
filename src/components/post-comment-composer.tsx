import { Send } from "lucide-react";

import { texts } from "@/texts";
import { usePostCommentComposerController } from "@/utils/components/post/use-post-comment-composer-controller";
import { usePostCommentsContext } from "@/utils/components/post/use-post-comments-context";

import { Button } from "@/components/ui/button";

import { MentionTextarea } from "@/components/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";

export function PostCommentComposer() {
  const { postId } = usePostCommentsContext();
  const controller = usePostCommentComposerController(postId);

  return (
    <form onSubmit={controller.submit} className="mt-4 flex items-center gap-2.5">
      <UserAvatar
        src={controller.currentUser?.avatar}
        alt={controller.currentUser?.name}
        className="h-8 w-8 shrink-0"
      />

      <div className="flex flex-1 items-center gap-2 rounded-full border border-border-soft bg-surface-1 py-1.5 pl-4 pr-1.5">
        <MentionTextarea
          value={controller.draft}
          onChange={controller.updateDraft}
          placeholder={texts.posts.comments.placeholder}
          className="h-6 min-h-6 flex-1 resize-none border-0 bg-transparent p-0 text-[13px] font-light outline-none"
          maxLength={280}
        />

        <Button
          type="submit"
          size="icon"
          className="h-7 w-7 shrink-0 rounded-full"
          disabled={controller.submitDisabled}
          aria-label={texts.posts.comments.send}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </form>
  );
}
