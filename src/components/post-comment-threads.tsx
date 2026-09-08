import { texts } from "@/texts";
import { usePostCommentsContext } from "@/utils/components/post/use-post-comments-context";

import { CommentItemProvider } from "@/components/post-comment-item-provider";

export function PostCommentThreads() {
  const { threads, showEmptyState } = usePostCommentsContext();

  return (
    <div className="space-y-3">
      {threads.map((thread) => (
        <div key={thread.comment.id}>
          <CommentItemProvider comment={thread.comment} />
          {thread.replies.length > 0 && (
            <div className="ml-10 mt-2 space-y-2 border-l-2 border-border-soft pl-4">
              {thread.replies.map(({ reply, replyingTo }) => (
                <CommentItemProvider key={reply.id} comment={reply} replyingTo={replyingTo} />
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
  );
}
