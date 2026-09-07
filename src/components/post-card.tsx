import { useEffect, useState } from "react";

import { Root as Popover, Trigger as PopoverTrigger } from "@radix-ui/react-popover";
import { useQuery } from "@tanstack/react-query";

import { Bookmark, Flag, Heart, MessageSquare, Share2 } from "lucide-react";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { typeMeta } from "@/constants/post-type-meta";
import { feedApi } from "@/lib/api/feed";
import { reactionsApi } from "@/lib/api/reactions";
import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { PostCardProps } from "@/types/components/post/post-card-props";
import { linkifyText } from "@/utils/linkify-text";

import { AuthorInfo } from "@/components/post-author-info";
import { PostComments } from "@/components/post-comments";
import { LinkPreviews } from "@/components/post-link-previews";
import { MediaGrid } from "@/components/post-media-grid";
import { ReactionsDialog } from "@/components/reactions-dialog";
import { ReactionsSummary } from "@/components/reactions-summary";
import { ReportDialog } from "@/components/post-report-dialog";
import { Badge } from "@/components/ui/badge";
import { PopoverContent } from "@/components/ui/popover-content";

export function PostCard({ post }: PostCardProps) {
  const meta = typeMeta[post.type] ?? typeMeta.INSIGHT;
  const [showComments, setShowComments] = useState(false);
  const [saved, setSaved] = useState(false);
  const initializePostCard = usePostCardStore((state) => state.initializePostCard);
  const disposePostCard = usePostCardStore((state) => state.disposePostCard);
  const card = usePostCardStore((state) => state.cards[post.id]);
  const setPostCounters = usePostCardStore((state) => state.setPostCounters);
  const setReactionStatus = usePostCardStore((state) => state.setReactionStatus);
  const setShowReactions = usePostCardStore((state) => state.setShowReactions);
  const setShowReport = usePostCardStore((state) => state.setShowReport);

  const postCounters = card?.postCounters ?? post.counters;
  const reactionStatus = card?.reactionStatus ?? post.currentUserReaction ?? null;

  useEffect(() => {
    initializePostCard(post);
    return () => disposePostCard(post.id);
  }, [disposePostCard, initializePostCard, post]);

  useEffect(() => {
    setReactionStatus(post.id, post.currentUserReaction ?? null);
  }, [post.currentUserReaction, post.id, setReactionStatus]);

  const { data: savedData } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => feedApi.listSaved(),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (savedData) {
      setSaved(savedData.items.some((savedPost) => savedPost.id === post.id));
    }
  }, [savedData, post.id]);

  const handleReaction = async (type: ReactionType) => {
    try {
      if (reactionStatus === type) {
        const result = await reactionsApi.removeReaction(post.id);
        setReactionStatus(post.id, null);
        if ("counters" in result) setPostCounters(post.id, result.counters!);
      } else {
        const result = await reactionsApi.react(post.id, type);
        setReactionStatus(post.id, type);
        if ("counters" in result) setPostCounters(post.id, result.counters!);
      }
    } catch {
      // silently fail
    }
  };

  const handleSave = async () => {
    try {
      const result = saved
        ? await reactionsApi.removeSave(post.id)
        : await reactionsApi.save(post.id);
      setSaved(!saved);
      setPostCounters(post.id, result.counters);
    } catch {
      // silently fail
    }
  };

  const handleShare = async () => {
    try {
      const result = await reactionsApi.share(post.id);
      setPostCounters(post.id, result.counters);
      const url = `${window.location.origin}/feed/${post.id}`;
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // silently fail
    }
  };

  return (
    <article className="min-w-0 rounded-2xl border border-border-soft bg-surface-card p-4 transition sm:p-5">
      <header className="flex justify-between items-start gap-3">
        <AuthorInfo
          authorUsername={post.authorUsername}
          authorName={post.authorName}
          authorAvatar={post.authorAvatar}
          createdAt={post.createdAt}
          fallbackClassName={meta.classAvatar}
        />
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
        >
          {meta.label}
        </span>
      </header>

      <p className="mt-4 whitespace-pre-line break-words text-[15px] font-light leading-relaxed text-text-strong">
        {linkifyText(post.content)}
      </p>

      {post.mediaIds.length > 0 && (
        <div className="mt-4">
          <MediaGrid mediaIds={post.mediaIds} />
        </div>
      )}

      <ReactionsSummary postId={post.id} />
      <LinkPreviews content={post.content} />

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-full border border-border-soft bg-transparent font-light text-text-subtle"
            >
              {texts.posts.tag(tag)}
            </Badge>
          ))}
        </div>
      )}

      <footer className="mt-4 flex justify-between flex-wrap items-center gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <div className="flex">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
                  reactionStatus ? "text-primary" : ""
                }`}
                title={
                  reactionStatus
                    ? texts.posts.reactions.reactedWith(REACTION_EMOJIS[reactionStatus])
                    : texts.posts.reactions.react
                }
              >
                {reactionStatus ? (
                  <span className="text-base leading-none">{REACTION_EMOJIS[reactionStatus]}</span>
                ) : (
                  <Heart className="h-4 w-4" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              side="top"
              className="w-fit rounded-2xl border-border p-1.5"
            >
              <div className="flex gap-1">
                {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(
                  ([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => handleReaction(type)}
                      className={`rounded-lg px-2 py-1 text-xl transition hover:bg-muted ${
                        reactionStatus === type ? "bg-muted ring-1 ring-primary" : ""
                      }`}
                      title={type.toLowerCase()}
                    >
                      {emoji}
                    </button>
                  ),
                )}
              </div>
            </PopoverContent>
          </Popover>
          <button
            onClick={() => setShowReactions(post.id, true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs tabular-nums transition hover:bg-muted hover:text-foreground text-muted-foreground"
          >
            {postCounters.reactions}
          </button>
          <button
            onClick={() => setShowComments((visible) => !visible)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
          >
            <MessageSquare className="h-4 w-4" /><>{postCounters.comments}</>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground"
          >
            <Share2 className="h-4 w-4" /><>{texts.posts.share}</>
          </button>
          <button
            onClick={() => setShowReport(post.id, true)}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground text-muted-foreground"
          >
            <Flag className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
            saved ? "text-primary" : ""
          }`}
        >
          <Bookmark className="h-4 w-4" /><>{postCounters.saves}</>
        </button>
      </footer>

      <ReactionsDialog postId={post.id} />
      <ReportDialog postId={post.id} />
      <PostComments postId={post.id} visible={showComments} />
    </article>
  );
}
