import type { FormEventHandler } from "react";

import { Send } from "lucide-react";

import type { CommentView, Profile } from "@/lib/api";
import { texts } from "@/texts";
import { getParentAuthorName, getReplies } from "@/utils/comments";

import { MentionTextarea } from "@/components/mention-textarea";
import { PostCommentItem } from "@/components/post/post-comment-item";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";

type PostCommentsProps = {
  currentUser: Profile | null | undefined;
  comments: CommentView[];
  rootComments: CommentView[];
  draft: string;
  onDeleteComment: (commentId: string) => void;
  onReply: (comment: CommentView) => void;
  onDraftChange: (value: string, mentionedUserIds: string[]) => void;
  onSubmitComment: FormEventHandler<HTMLFormElement>;
};

export function PostComments({
  currentUser,
  comments,
  rootComments,
  draft,
  onDeleteComment,
  onReply,
  onDraftChange,
  onSubmitComment,
}: PostCommentsProps) {
  return (
    <section className="mt-4 border-t border-border-soft pt-4">
      <div className="space-y-3">
        {rootComments.map((comment) => {
          const replies = getReplies(comments, comment.id);
          return (
            <div key={comment.id}>
              <PostCommentItem
                comment={comment}
                currentUserId={currentUser?.id}
                onDelete={onDeleteComment}
                onReply={onReply}
              />
              {replies.length > 0 && (
                <div className="ml-10 mt-2 space-y-2 border-l-2 border-border-soft pl-4">
                  {replies.map((reply) => (
                    <PostCommentItem
                      key={reply.id}
                      comment={reply}
                      replyingTo={getParentAuthorName(comments, reply.parentCommentId)}
                      currentUserId={currentUser?.id}
                      onDelete={onDeleteComment}
                      onReply={onReply}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {rootComments.length === 0 && (
          <p className="py-4 text-center text-[13px] font-light text-text-subtle">
            {texts.posts.comments.empty}
          </p>
        )}
      </div>

      <form onSubmit={onSubmitComment} className="mt-4 flex items-center gap-2.5">
        <UserAvatar
          src={currentUser?.avatar}
          alt={currentUser?.name}
          className="h-8 w-8 shrink-0"
        />
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
            disabled={!draft.trim()}
            aria-label={texts.posts.comments.send}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </form>
    </section>
  );
}
