import { useEffect, useState } from "react";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { ReactionSummary } from "@/types/application/reaction/reaction-summary";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { CommentItemProps } from "@/types/components/post/comment-item-props";
import {
  CommentItem as CommentItemView,
  applyReactionToSummary,
  removeReactionFromSummary,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { commentsApi, profileApi, reactionsApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { useAuth } from "@/lib/use-auth";

import { MentionTextarea } from "@/components/mention-textarea";
import { ProfilePeek } from "@/components/profile/profile-peek";

import { CommentReactionsDialog } from "./comment-reactions-dialog";
import { formatTime } from "./format-time";
import { MediaGrid } from "./media-grid";
import { ReportDialog } from "./report-dialog";
import { RichText } from "./rich-text";

/** Um comentário (com responder, reagir e excluir). */
export function CommentItem({
  comment,
  replyingTo,
  postAuthorId,
  onPinChanged,
  onDeleted,
}: CommentItemProps) {
  const { toast } = useToast();
  const { requireAuth } = useAuth();
  // Inscrito na query do /me: sem isso, o comentario da propria pessoa so aparecia como tal
  // depois que alguma outra consulta redesenhava a tela (o cache do /me chega em outra hora).
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?.id ?? null;
  const postId = comment.postId;
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);
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
  // Contagem por tipo (pílulas iguais às do post). O resumo do servidor é a base; cada clique
  // atualiza de forma otimista e volta ao valor anterior se a API recusar.
  const [reactionSummary, setReactionSummary] = useState<ReactionSummary>(
    comment.reactionSummary ?? {},
  );
  const [reactionsOpen, setReactionsOpen] = useState(false);

  // Edicao e local ao item: o texto novo e o selo aparecem na hora. Ao remontar (refetch),
  // vale o que veio do servidor, que ja traz o editedAt.
  const [content, setContent] = useState(comment.content);
  const [editedAt, setEditedAt] = useState<string | null>(comment.editedAt ?? null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  // A reação do leitor vem do servidor: sem isto o like "sumia" ao recarregar.
  useEffect(() => {
    setCommentReaction(comment.currentUserReaction ?? null);
    setReactionSummary(comment.reactionSummary ?? {});
  }, [comment.currentUserReaction, comment.reactionSummary, comment.id]);

  const saveEdit = async (next: string) => {
    setSaving(true);
    setEditError(null);
    try {
      const result = await commentsApi.update(postId, comment.id, next);
      setContent(result.content ?? next);
      setEditedAt(result.editedAt);
      return true;
    } catch {
      setEditError(texts.posts.comments.editError);
      return false;
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
    setTimeout(() => {
      document
        .getElementById(`comment-form-${postId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  const handleDelete = async () => {
    try {
      await commentsApi.remove(postId, comment.id);
      onDeleted?.(comment.id);
    } catch {
      // silently fail
    }
  };

  const handleCommentReaction = async (type: ReactionType) => {
    // Post compartilhado abre para quem não tem sessão: reagir manda para o login em vez de falhar
    // em silêncio (mesma regra da reação do post).
    if (!requireAuth()) return;
    const previousReaction = commentReaction;
    const previousSummary = reactionSummary;
    const next = previousReaction === type ? null : type;
    // Otimismo: tira a reação anterior (se houver troca/remoção) e soma a nova. Assim a pílula
    // responde no toque, como no post, e volta ao estado do servidor se a chamada falhar.
    let nextSummary = previousSummary;
    if (previousReaction && previousReaction !== next) {
      nextSummary = removeReactionFromSummary(nextSummary, previousReaction);
    }
    if (next) nextSummary = applyReactionToSummary(nextSummary, next);
    setCommentReaction(next);
    setReactionSummary(nextSummary);
    try {
      if (next === null) {
        await reactionsApi.removeCommentReaction(comment.postId, comment.id);
      } else {
        await reactionsApi.reactComment(comment.postId, comment.id, type);
      }
    } catch {
      setCommentReaction(previousReaction);
      setReactionSummary(previousSummary);
    }
  };

  const handleTogglePin = async () => {
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
  };

  return (
    <CommentItemView
      comment={comment}
      content={content}
      edited={Boolean(editedAt)}
      // Nome e foto levam ao perfil de quem comentou (quando o perfil existe).
      profileHref={comment.authorUsername ? `/perfil/${comment.authorUsername}` : null}
      timeLabel={formatTime(comment.createdAt)}
      replyingTo={replyingTo}
      isOwner={isOwner}
      canPin={canPin}
      pinning={pinning}
      emojis={REACTION_EMOJIS}
      reaction={commentReaction}
      onReact={handleCommentReaction}
      // Sem resumo do servidor (resposta antiga), fica só o total, sem pílulas.
      reactionSummary={comment.reactionSummary == null ? undefined : reactionSummary}
      onShowReactions={() => setReactionsOpen(true)}
      onReply={handleReply}
      onTogglePin={handleTogglePin}
      onDelete={handleDelete}
      onReport={() => setReportOpen(true)}
      saving={saving}
      editError={editError}
      onSaveEdit={saveEdit}
      onCancelEdit={() => setEditError(null)}
      renderRichText={(props) => <RichText {...props} />}
      renderMediaGrid={(props) => <MediaGrid {...props} />}
      renderAuthorTrigger={
        comment.authorUsername
          ? (content) => (
              <ProfilePeek username={comment.authorUsername} name={comment.authorName}>
                {content}
              </ProfilePeek>
            )
          : undefined
      }
      renderEditField={(value, onChange) => (
        <MentionTextarea
          value={value}
          onChange={(next) => onChange(next)}
          rows={3}
          maxLength={1024}
          className="rounded-lg border border-border-soft bg-surface-card px-3 py-2 text-sm font-normal"
          toolbar
        />
      )}
      reportDialog={
        <ReportDialog
          targetId={comment.id}
          targetType="COMMENT"
          open={reportOpen}
          onOpenChange={setReportOpen}
        />
      }
      reactionsDialog={
        <CommentReactionsDialog
          postId={comment.postId}
          commentId={comment.id}
          open={reactionsOpen}
          onOpenChange={setReactionsOpen}
        />
      }
    />
  );
}
