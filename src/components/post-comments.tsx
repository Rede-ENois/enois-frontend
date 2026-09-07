import { type FormEvent, useEffect, useState } from "react";

import { Send } from "lucide-react";

import { createComment } from "@/lib/api/comments/create-comment";
import { listComments } from "@/lib/api/comments/list-comments";
import { getCurrentUser } from "@/lib/current-user";
import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { PostCommentsProps } from "@/types/components/post/post-comments-props";

import { MentionTextarea } from "@/components/mention-textarea";
import { CommentItem } from "@/components/post-comment-item";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function PostComments({ postId, visible }: PostCommentsProps) {
  const currentUser = getCurrentUser();
  const card = usePostCardStore((state) => state.cards[postId]);
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);
  const setComments = usePostCardStore((state) => state.setComments);
  const addComment = usePostCardStore((state) => state.addComment);
  const updateCommentCount = usePostCardStore((state) => state.updateCommentCount);
  const [loaded, setLoaded] = useState(false);

  const draft = card?.draft ?? "";
  const commentMentions = card?.commentMentions ?? [];
  const replyToId = card?.replyToId ?? null;
  const localComments = card?.localComments ?? [];

  useEffect(() => {
    if (!visible) {
      setLoaded(false);
      return;
    }

    let cancelled = false;
    setLoaded(false);

    listComments(postId)
      .then((data) => {
        if (!cancelled) setComments(postId, data.items);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [postId, setComments, visible]);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    try {
      const newComment = await createComment(postId, content, replyToId, commentMentions);
      addComment(postId, newComment);
      updateCommentCount(postId, 1);
      setDraft(postId, "");
      setCommentMentions(postId, []);
      setReplyToId(postId, null);
    } catch {
      // silently fail
    }
  };

  if (!visible || !loaded) return null;

  const rootComments = localComments.filter((comment) => !comment.parentCommentId);

  return (
    <section className="mt-4 border-t border-border-soft pt-4">
      <div className="space-y-3">
        {rootComments.map((comment) => {
          const replies = localComments.filter((reply) => reply.parentCommentId === comment.id);
          return (
            <div key={comment.id}>
              <CommentItem comment={comment} />
              {replies.length > 0 && (
                <div className="ml-10 mt-2 space-y-2 border-l-2 border-border-soft pl-4">
                  {replies.map((reply) => {
                    const parentAuthor = localComments.find(
                      (candidate) => candidate.id === reply.parentCommentId,
                    )?.authorName;
                    return (
                      <CommentItem key={reply.id} comment={reply} replyingTo={parentAuthor} />
                    );
                  })}
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

      <form onSubmit={submitComment} className="mt-4 flex items-center gap-2.5">
        <UserAvatar
          src={currentUser?.avatar}
          alt={currentUser?.name}
          className="h-8 w-8 shrink-0"
        />
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border-soft bg-surface-1 py-1.5 pl-4 pr-1.5">
          <MentionTextarea
            value={draft}
            onChange={(value, ids) => {
              setDraft(postId, value);
              setCommentMentions(postId, ids);
            }}
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
