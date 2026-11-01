import { useCallback, useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { CommentView } from "@/types/application/comment/comment-view";
import type { MediaItem } from "@/types/routes/feed/media-item";
import {
  type CommentsError,
  PostComments as PostCommentsView,
  orderCommentsWithAccepted,
} from "@rede-enois/design-system/domain";

import { commentsApi } from "@/lib/api";
import { updatePostInQueryCache } from "@/lib/feed/post-query-cache";
import { useAcceptedAnswer } from "@/lib/feed/use-accepted-answer";
import { litePageSize } from "@/lib/lite-mode";
import { useAuth } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";
import { useMediaUpload } from "@/lib/use-media-upload";

import { MentionTextarea } from "@/components/mention-textarea";

import { CommentItem } from "./comment-item";
import { GifPickerDialog } from "./gif-picker-dialog";

const PAGE_SIZE = 20;

/**
 * Comentarios de um post: carrega as páginas, guarda o rascunho (no store do card) e os anexos, e
 * envia. Como a API devolve os mais recentes primeiro, "ver comentarios anteriores" carrega a
 * proxima pagina e acrescenta no fim.
 */
export function PostComments({
  postId,
  postAuthorId,
  isQuestion = false,
  acceptedCommentId = null,
}: {
  postId: string;
  postAuthorId: string;
  /** QUESTION post: the asker can mark one answer, which goes to the top. */
  isQuestion?: boolean;
  acceptedCommentId?: string | null;
}) {
  // Em modo lite a primeira página (e cada "carregar mais") já vem maior.
  const lite = useLiteMode();
  const pageSize = litePageSize(PAGE_SIZE, lite);
  const { requireAuth } = useAuth();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<CommentView[]>([]);
  const draft = usePostCardStore((state) => state.cards[postId]?.draft ?? "");
  const mentions = usePostCardStore((state) => state.cards[postId]?.commentMentions ?? []);
  const replyToId = usePostCardStore((state) => state.cards[postId]?.replyToId ?? null);
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<CommentsError | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaSpoiler, setMediaSpoiler] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [posting, setPosting] = useState(false);
  const upload = useMediaUpload();
  const acceptedAnswer = useAcceptedAnswer(postId, acceptedCommentId);
  // The accepted flag follows the optimistic answer, not the flag each comment was loaded with.
  const shownComments = isQuestion
    ? orderCommentsWithAccepted(
        comments.map((comment) => ({
          ...comment,
          accepted: comment.id === acceptedAnswer.acceptedId,
        })),
        acceptedAnswer.acceptedId,
      )
    : comments;

  const addMediaFiles = (incoming: File[]) => {
    const files = incoming.filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setMedia((current) => {
      const room = 4 - current.length;
      if (room <= 0) {
        setError("mediaLimit");
        return current;
      }
      setError(null);
      return [
        ...current,
        ...files.slice(0, room).map((file) => ({
          type: "image" as const,
          file,
          preview: URL.createObjectURL(file),
        })),
      ];
    });
  };

  const addAudio = (file: File) => {
    setMedia((current) =>
      current.length >= 4
        ? current
        : [...current, { type: "audio", file, preview: URL.createObjectURL(file) }],
    );
  };

  // O GIF entra como URL no proprio texto do comentario — o link-previews transforma em imagem — e
  // e assim que ele sempre funcionou aqui. Quem escolhe a URL e o seletor (busca no provedor ou link
  // colado no modo alternativo), que ja entrega so link aceito.
  const addGif = (url: string) => {
    setDraft(postId, draft ? `${draft}\n${url}` : url);
  };

  // O servidor entrega do mais novo para o mais antigo (cursor), mas a leitura de uma thread
  // fica confusa assim. Ordenamos por data crescente no cliente e, ao carregar páginas
  // anteriores, mesclamos mantendo o mais antigo no topo.
  // Fixado sempre primeiro; o resto em ordem crescente (a thread se lê de cima para baixo).
  const oldestFirst = (items: CommentView[]) =>
    [...items].sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
    });

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await commentsApi.list(postId, null, pageSize);
      setComments(oldestFirst(page.items));
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch {
      setError("load");
    } finally {
      setLoading(false);
    }
  }, [postId, pageSize]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await commentsApi.list(postId, cursor, pageSize);
      setComments((current) => oldestFirst([...current, ...page.items]));
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch {
      setError("load");
    } finally {
      setLoadingMore(false);
    }
  };

  const submit = async (website: string): Promise<boolean> => {
    const content = draft.trim();
    if (!content || sending) return false;
    // Comentar e uma acao: sem sessao (link compartilhado aberto por outra pessoa) vai para o login.
    if (!requireAuth()) return false;

    if (posting) return false;
    setPosting(true);
    setSending(true);
    try {
      let mediaIds: string[] = [];
      let finalContent = content;
      if (media.length > 0) {
        const results = await upload.uploadAll(media.map((m) => ({ file: m.file })));
        mediaIds = results.map((r) => r.mediaId);
        // Mídia NO MEIO do texto (item 9): mesmo caminho do post — o marcador pendente inserido
        // pelo autor vira o id real no upload; pendente sem anexo restante some.
        finalContent = finalContent.replace(/\{\{media:pendente-(\d+)\}\}/g, (_marker, index) => {
          const uploaded = mediaIds[Number(index)];
          return uploaded ? `{{media:${uploaded}}}` : "";
        });
      }
      const created = await commentsApi.create(
        postId,
        finalContent,
        replyToId,
        mentions,
        mediaIds,
        website,
        mediaSpoiler,
      );
      setComments((current) => oldestFirst([...current, created]));
      updatePostInQueryCache(queryClient, postId, (current) => ({
        ...current,
        counters: { ...current.counters, comments: current.counters.comments + 1 },
      }));
      setDraft(postId, "");
      setCommentMentions(postId, []);
      setReplyToId(postId, null);
      media.forEach((m) => URL.revokeObjectURL(m.preview));
      setMedia([]);
      setMediaSpoiler(false);
      return true;
    } catch {
      setError(media.length > 0 ? "upload" : "load");
      return false;
    } finally {
      setPosting(false);
      setSending(false);
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((current) => current.filter((comment) => comment.id !== commentId));
    acceptedAnswer.commentDeleted(commentId);
    updatePostInQueryCache(queryClient, postId, (current) => ({
      ...current,
      counters: { ...current.counters, comments: Math.max(0, current.counters.comments - 1) },
    }));
  };

  return (
    <PostCommentsView
      formId={`comment-form-${postId}`}
      comments={shownComments}
      loading={loading}
      loadingMore={loadingMore}
      hasMore={hasMore}
      error={error}
      onRetry={loadFirstPage}
      onLoadMore={loadMore}
      renderComment={(comment, replyingTo) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          replyingTo={replyingTo}
          postAuthorId={postAuthorId}
          onPinChanged={() => void loadFirstPage()}
          onDeleted={handleCommentDeleted}
          acceptance={
            isQuestion
              ? {
                  pending: acceptedAnswer.pending,
                  onAccept: () => acceptedAnswer.accept(comment.id),
                  onUnaccept: acceptedAnswer.unaccept,
                }
              : undefined
          }
        />
      )}
      replyToId={replyToId}
      onCancelReply={() => setReplyToId(postId, null)}
      media={media}
      mediaSpoiler={mediaSpoiler}
      onToggleMediaSpoiler={() => setMediaSpoiler((active) => !active)}
      onRemoveMedia={(index) => {
        const item = media[index];
        if (item) URL.revokeObjectURL(item.preview);
        setMedia((current) => {
          const next = current.filter((_, i) => i !== index);
          if (next.length === 0) setMediaSpoiler(false);
          return next;
        });
      }}
      onInsertMedia={(index) => setDraft(postId, `${draft}{{media:pendente-${index}}}`)}
      onAddImages={addMediaFiles}
      onAddAudio={addAudio}
      onErrorChange={setError}
      composerField={
        <MentionTextarea
          value={draft}
          onChange={(value, ids) => {
            setDraft(postId, value);
            setCommentMentions(postId, ids);
          }}
          placeholder={texts.posts.comments.placeholder}
          className="w-full resize-none border-0 bg-transparent px-2 py-1 text-sm font-normal outline-none"
          maxLength={800}
          toolbar
          onPasteImages={addMediaFiles}
          // requestSubmit passa pelo mesmo submit do botão (validação, anexos e login).
          onSubmitShortcut={() =>
            (
              document.getElementById(`comment-form-${postId}`) as HTMLFormElement | null
            )?.requestSubmit()
          }
        />
      }
      canSend={Boolean(draft.trim()) || media.length > 0}
      sending={sending}
      onSubmit={submit}
      onOpenGifPicker={() => setGifOpen(true)}
      gifPicker={<GifPickerDialog open={gifOpen} onOpenChange={setGifOpen} onSelect={addGif} />}
    />
  );
}
