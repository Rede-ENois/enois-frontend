import { useEffect, useState } from "react";

import { Link } from "@tanstack/react-router";

import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { CommentItemProps } from "@/types/components/post/comment-item-props";
import { Flag, Heart, MessageCircle, Pencil, Pin, PinOff, Trash2 } from "lucide-react";

import { REACTION_EMOJIS, commentsApi, profileApi, reactionsApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { hideExternalPageUrls } from "@/lib/shared-links";

import { Button } from "@/components/ui/button";
import { ReadMore } from "@/components/ui/read-more";
import { useToast } from "@/components/ui/toast";

import { MentionTextarea } from "@/components/mention-textarea";
import { UserAvatar } from "@/components/user-avatar";
import { UserBadges } from "@/components/user-badge";

import { formatTime } from "./format-time";
import { LinkPreviews } from "./link-previews";
import { MediaGrid } from "./media-grid";
import { ReactionPicker } from "./reaction-picker";
import { ReportDialog } from "./report-dialog";
import { RichText } from "./rich-text";

/** Um comentário (com responder, reagir e excluir). */
export function CommentItem({ comment, replyingTo, postAuthorId, onPinChanged }: CommentItemProps) {
  const { toast } = useToast();
  // Inscrito na query do /me: sem isso, o comentario da propria pessoa so aparecia como tal
  // depois que alguma outra consulta redesenhava a tela (o cache do /me chega em outra hora).
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const postId = comment.postId;
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);
  const removeComment = usePostCardStore((state) => state.removeComment);
  const updateCommentCount = usePostCardStore((state) => state.updateCommentCount);
  const isOwner = currentUserId === comment.authorId;
  // O autor do post fixa qualquer comentário; o autor do comentário fixa o próprio.
  const canPin =
    Boolean(currentUserId) &&
    comment.parentCommentId == null &&
    (currentUserId === postAuthorId || isOwner);
  const [pinning, setPinning] = useState(false);
  const [commentReaction, setCommentReaction] = useState<ReactionType | null>(
    comment.currentUserReaction ?? null,
  );

  // Edicao e local ao item: o texto novo e o selo aparecem na hora. Ao remontar (refetch),
  // vale o que veio do servidor, que ja traz o editedAt.
  const [content, setContent] = useState(comment.content);
  const [editedAt, setEditedAt] = useState<string | null>(comment.editedAt ?? null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // A reação do leitor vem do servidor: sem isto o like "sumia" ao recarregar.
  useEffect(() => {
    setCommentReaction(comment.currentUserReaction ?? null);
  }, [comment.currentUserReaction, comment.id]);

  const saveEdit = async () => {
    const next = editDraft.trim();
    if (!next || next === content) {
      setEditing(false);
      setEditDraft(content);
      return;
    }

    setSaving(true);
    setEditError(null);
    try {
      const result = await commentsApi.update(postId, comment.id, next);
      setContent(result.content ?? next);
      setEditedAt(result.editedAt);
      setEditing(false);
    } catch {
      setEditError(texts.posts.comments.editError);
    } finally {
      setSaving(false);
    }
  };

  const handleReply = async () => {
    try {
      const profile = await profileApi.getById(comment.authorId);
      if (profile?.username) {
        setDraft(postId, `@${profile.username} `);
        setCommentMentions(postId, [comment.authorId]);
      }
    } catch {
      setDraft(postId, `${comment.authorName} `);
    }
    setReplyToId(postId, comment.id);
  };

  const handleDelete = async () => {
    try {
      await commentsApi.remove(postId, comment.id);
      removeComment(postId, comment.id);
      updateCommentCount(postId, -1);
    } catch {
      // silently fail
    }
  };

  const handleCommentReaction = async (type: ReactionType) => {
    try {
      if (commentReaction === type) {
        await reactionsApi.removeCommentReaction(comment.postId, comment.id);
        setCommentReaction(null);
      } else {
        await reactionsApi.reactComment(comment.postId, comment.id, type);
        setCommentReaction(type);
      }
    } catch {
      /* ignore */
    }
  };

  // Nome e foto levam ao perfil de quem comentou (quando o perfil existe).
  const profileLink = comment.authorUsername ? (
    <Link
      to="/perfil/$username"
      params={{ username: comment.authorUsername }}
      className="text-xs font-medium text-text-strong hover:underline"
    >
      {comment.authorName}
    </Link>
  ) : (
    <span className="text-xs font-medium text-text-strong">{comment.authorName}</span>
  );

  const avatar = (
    <UserAvatar
      frame={comment.authorAvatarFrame}
      src={comment.authorAvatar}
      alt={comment.authorName}
      className="h-8 w-8 shrink-0"
    />
  );

  return (
    <div className="flex gap-2 sm:gap-2.5">
      {comment.authorUsername ? (
        <Link
          to="/perfil/$username"
          params={{ username: comment.authorUsername }}
          className="shrink-0 transition hover:opacity-80"
          aria-label={texts.posts.comments.viewProfile(comment.authorName)}
        >
          {avatar}
        </Link>
      ) : (
        avatar
      )}

      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-surface-1 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            {profileLink}

            <UserBadges badges={comment.authorBadges} badge={comment.authorBadge} />
            {replyingTo && (
              <span className="text-xs font-normal text-text-subtle">
                {texts.posts.comments.replyingTo(replyingTo)}
              </span>
            )}
            {comment.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-text">
                <Pin className="h-3 w-3" />

                <>{texts.posts.comments.pinned}</>
              </span>
            )}

            <span className="text-xs font-normal text-text-subtle">
              {formatTime(comment.createdAt)}
              {editedAt ? ` · ${texts.posts.edited}` : ""}
            </span>
          </div>

          {editing ? (
            <div className="mt-1 space-y-2">
              <MentionTextarea
                value={editDraft}
                onChange={(value) => setEditDraft(value)}
                rows={3}
                maxLength={1024}
                className="rounded-lg border border-border-soft bg-surface-card px-3 py-2 text-sm font-normal"
                toolbar
              />

              {editError && <p className="text-xs text-destructive">{editError}</p>}

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={saving || !editDraft.trim()}
                  onClick={() => void saveEdit()}
                >
                  {saving ? texts.common.saving : texts.common.save}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => {
                    setEditing(false);
                    setEditDraft(content);
                    setEditError(null);
                  }}
                >
                  {texts.common.cancel}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-0.5">
                <ReadMore
                  clampClassName="line-clamp-5"
                  moreLabel={texts.common.readMore}
                  lessLabel={texts.common.readLess}
                >
                  <RichText
                    content={hideExternalPageUrls(content)}
                    mediaSpoiler={comment.mediaSpoiler}
                    className="whitespace-pre-line break-words text-sm font-normal leading-relaxed text-text-strong"
                  />
                </ReadMore>
              </div>

              {comment.mediaIds && comment.mediaIds.length > 0 && (
                <div className="mt-2 max-w-full">
                  <MediaGrid mediaIds={comment.mediaIds} compact mediaSpoiler={comment.mediaSpoiler} />
                </div>
              )}

              <LinkPreviews content={content} />
            </>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-1 gap-y-0.5 px-3 text-text-subtle">
          <ReactionPicker
            activeType={commentReaction}
            onReact={handleCommentReaction}
            buttonClassName={`flex h-7 items-center gap-1 rounded-full px-1.5 transition-colors hover:bg-surface-2 hover:text-primary ${
              commentReaction ? "text-primary" : ""
            }`}
            buttonTitle={texts.posts.reactions.react}
          >
            {commentReaction ? (
              <span className="text-sm leading-none">{REACTION_EMOJIS[commentReaction]}</span>
            ) : (
              <Heart className="h-3.5 w-3.5" />
            )}
            {(comment.reactionCount ?? 0) > 0 && (
              <span className="text-xs tabular-nums">{comment.reactionCount}</span>
            )}
          </ReactionPicker>

          <button
            onClick={handleReply}
            title={texts.posts.comments.reply}
            aria-label={texts.posts.comments.reply}
            className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-surface-2 hover:text-primary"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>

          {canPin && !editing && (
            <button
              onClick={async () => {
                setPinning(true);
                try {
                  if (comment.pinned) {
                    await commentsApi.unpin(postId, comment.id);
                  } else {
                    await commentsApi.pin(postId, comment.id);
                  }
                  onPinChanged?.();
                } catch {
                  toast(texts.posts.comments.pinError, "error");
                } finally {
                  setPinning(false);
                }
              }}
              disabled={pinning}
              title={comment.pinned ? texts.posts.comments.unpin : texts.posts.comments.pin}
              aria-label={comment.pinned ? texts.posts.comments.unpin : texts.posts.comments.pin}
              className={`grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-surface-2 hover:text-primary disabled:opacity-50 ${
                comment.pinned ? "text-primary" : ""
              }`}
            >
              {comment.pinned ? (
                <PinOff className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {isOwner && !editing && (
            <button
              onClick={() => {
                setEditDraft(content);
                setEditing(true);
              }}
              title={texts.common.edit}
              aria-label={texts.common.edit}
              className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-surface-2 hover:text-primary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {isOwner && (
            <button
              onClick={handleDelete}
              title={texts.posts.comments.delete}
              aria-label={texts.posts.comments.delete}
              className="grid h-7 w-7 place-items-center rounded-full text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          {!isOwner && (
            <button
              onClick={() => setReportOpen(true)}
              title={texts.posts.report.action}
              aria-label={texts.posts.report.action}
              className="grid h-7 w-7 place-items-center rounded-full transition-colors hover:bg-surface-2 hover:text-primary"
            >
              <Flag className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <ReportDialog
        targetId={comment.id}
        targetType="COMMENT"
        open={reportOpen}
        onOpenChange={setReportOpen}
      />
    </div>
  );
}
