import { type FormEvent, useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { commentsApi, feedApi, reactionsApi } from "@/lib/api";
import type { CommentView, PostView, ReactionType } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { createReplyTarget, getRootComments } from "@/utils/comments";

import { PostCardView } from "@/components/post/post-card-view";
import { ReactionsDialog, ReactionsSummary } from "@/components/post/post-reactions";
import { PostReportDialog } from "@/components/post/post-report-dialog";

export function PostCard({ post }: { post: PostView }) {
  const { user: currentUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [commentMentions, setCommentMentions] = useState<string[]>([]);
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [localComments, setLocalComments] = useState<CommentView[]>([]);
  const [postCounters, setPostCounters] = useState(post.counters);
  const [reactionStatus, setReactionStatus] = useState<string | null>(
    post.currentUserReaction ?? null,
  );
  const [saved, setSaved] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    setReactionStatus(post.currentUserReaction ?? null);
  }, [post.currentUserReaction]);

  const { data: savedData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => feedApi.listSaved(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (savedData) setSaved(savedData.items.some((savedPost) => savedPost.id === post.id));
  }, [savedData, post.id]);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;

    try {
      const newComment = await commentsApi.create(
        post.id,
        content,
        replyToId,
        commentMentions,
      );
      setLocalComments((current) => [...current, newComment]);
      setPostCounters((counters) => ({ ...counters, comments: counters.comments + 1 }));
      setDraft("");
      setCommentMentions([]);
      setReplyToId(null);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleReaction = async (type: ReactionType) => {
    try {
      const removing = reactionStatus === type;
      const result = removing
        ? await reactionsApi.removeReaction(post.id)
        : await reactionsApi.react(post.id, type);
      setReactionStatus(removing ? null : type);
      if ("counters" in result && result.counters) setPostCounters(result.counters);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleSave = async () => {
    try {
      const result = saved
        ? await reactionsApi.removeSave(post.id)
        : await reactionsApi.save(post.id);
      setSaved((value) => !value);
      setPostCounters(result.counters);
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleShare = async () => {
    try {
      const result = await reactionsApi.share(post.id);
      setPostCounters(result.counters);
      const url = `${window.location.origin}/feed/${post.id}`;
      const shareAction = navigator.share
        ? () => navigator.share({ url })
        : () => navigator.clipboard.writeText(url);
      await shareAction();
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsApi.remove(post.id, commentId);
      setLocalComments((comments) => comments.filter((comment) => comment.id !== commentId));
      setPostCounters((counters) => ({ ...counters, comments: counters.comments - 1 }));
    } catch {
      // Keep the existing silent-failure behavior.
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      try {
        const data = await commentsApi.list(post.id);
        setLocalComments(data.items);
      } catch {
        // Keep the existing silent-failure behavior.
      }
    }
    setShowComments((value) => !value);
  };

  const startReply = async (comment: CommentView) => {
    const target = await createReplyTarget(comment);
    setDraft(target.draft);
    setCommentMentions(target.mentionedUserIds);
    setReplyToId(target.replyToId);
  };

  return (
    <>
      <PostCardView
        post={post}
        currentUser={currentUser}
        counters={postCounters}
        reactionStatus={reactionStatus}
        saved={saved}
        showComments={showComments}
        comments={localComments}
        rootComments={getRootComments(localComments)}
        draft={draft}
        reactionSummary={
          <ReactionsSummary postId={post.id} reactionStatus={reactionStatus} />
        }
        onReaction={handleReaction}
        onOpenReactions={() => setShowReactions(true)}
        onToggleComments={loadComments}
        onShare={handleShare}
        onReport={() => setShowReport(true)}
        onSave={handleSave}
        onDeleteComment={handleDeleteComment}
        onReply={startReply}
        onDraftChange={(value, mentionedUserIds) => {
          setDraft(value);
          setCommentMentions(mentionedUserIds);
        }}
        onSubmitComment={submitComment}
      />

      <ReactionsDialog
        postId={post.id}
        currentUserReaction={reactionStatus}
        currentUserId={currentUser?.id}
        open={showReactions}
        onOpenChange={setShowReactions}
      />
      <PostReportDialog postId={post.id} open={showReport} onOpenChange={setShowReport} />
    </>
  );
}
