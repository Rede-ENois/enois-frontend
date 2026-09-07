import { texts } from "@/texts";
import type { PostCommentThreadsProps } from "@/types/components/post/post-comment-threads-props";

import { CommentItem } from "@/components/post-comment-item";

export function PostCommentThreads({ threads, showEmptyState }: PostCommentThreadsProps) {
  return (
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
  );
}
