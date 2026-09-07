import { texts } from "@/texts";
import type { PostCommentsProps } from "@/types/components/post/post-comments-props";
import { Send } from "lucide-react";

import { usePostCommentsController } from "@/utils/components/post/use-post-comments-controller";

import { Button } from "@/components/ui/button";

import { MentionTextarea } from "@/components/mention-textarea";
import { CommentItem } from "@/components/post-comment-item";
import { UserAvatar } from "@/components/user-avatar";

export function PostComments({ postId, visible }: PostCommentsProps) {
  const {
    currentUser,
    draft,
    updateDraft,
    submit,
    submitDisabled,
    showComments,
    showEmptyState,
    threads,
  } = usePostCommentsController(postId, visible);

  if (!showComments) return null;

  return (
    <section className="mt-4 border-t border-border-soft pt-4">
      <div className="space-y-3">
        {threads.map((thread) => (
          <div key={thread.comment.id}>
            <CommentItem comment={thread.comment} />
            {thread.replies.length > 0 && (
              <div className="ml-10 mt-2 space-y-2 border-l-2 border-border-soft pl-4">
                {thread.replies.map(({ reply, replyingTo }) => (
                  <CommentItem key={reply.id} comment={reply} replyingTo={replyingTo} />
                ))}
              </div>
            )}
          </div>
        ))}
        {showEmptyState && (
          <p className="py-4 text-center text-[13px] font-light text-text-subtle">
            {texts.posts.comments.empty}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="mt-4 flex items-center gap-2.5">
        <UserAvatar
          src={currentUser?.avatar}
          alt={currentUser?.name}
          className="h-8 w-8 shrink-0"
        />

        <div className="flex flex-1 items-center gap-2 rounded-full border border-border-soft bg-surface-1 py-1.5 pl-4 pr-1.5">
          <MentionTextarea
            value={draft}
            onChange={updateDraft}
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
    </section>
  );
}
