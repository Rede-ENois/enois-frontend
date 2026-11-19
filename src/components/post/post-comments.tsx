import { useCallback, useEffect, useRef, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { COMMENT_COUNTER_FROM, COMMENT_MAX_LENGTH } from "@/constants/post-content-limits";
import { selectCommentMentions, usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { CommentView } from "@/types/application/comment/comment-view";
import type { MediaItem } from "@/types/routes/feed/media-item";
import {
  type CommentsError,
  PostComments as PostCommentsView,
  orderCommentsWithAccepted,
} from "@rede-enois/design-system/domain";
import { Button } from "@rede-enois/design-system/ui";
import { RefreshCw } from "lucide-react";

import { commentsApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { formatarData } from "@/lib/date/format";
import { updatePostInQueryCache } from "@/lib/feed/post-query-cache";
import { useAcceptedAnswer } from "@/lib/feed/use-accepted-answer";
import { liteInterval, litePageSize } from "@/lib/lite-mode";
import { useAuth } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";
import { useMediaUpload } from "@/lib/use-media-upload";

import { MentionTextarea } from "@/components/mention-textarea";

import { CommentItem } from "./comment-item";
import { GifPickerDialog } from "./gif-picker-dialog";

const PAGE_SIZE = 20;

/** Intervalo entre atualizações silenciosas dos comentários na publicação aberta. */
export const COMMENTS_LIVE_REFRESH_MS = 30_000;

function mergeRefreshedComments(
  current: CommentView[],
  fresh: CommentView[],
  sort: (items: CommentView[]) => CommentView[],
): { next: CommentView[]; addedCount: number } {
  const freshById = new Map(fresh.map((item) => [item.id, item]));
  const existingIds = new Set(current.map((item) => item.id));
  const newItems = fresh.filter((item) => !existingIds.has(item.id));
  const updated = current.map((item) => freshById.get(item.id) ?? item);
  return {
    next: sort([...updated, ...newItems]),
    addedCount: newItems.length,
  };
}

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
  highlightCommentId = null,
  liveRefresh = false,
}: {
  postId: string;
  postAuthorId: string;
  /** QUESTION post: the asker can mark one answer, which goes to the top. */
  isQuestion?: boolean;
  acceptedCommentId?: string | null;
  /** Comentário a abrir em destaque (notificação de comentário). */
  highlightCommentId?: string | null;
  /** Ativo apenas na publicação aberta (/post/:id ou blog) para não fazer polling nos cards do feed. */
  liveRefresh?: boolean;
}) {
  // Em modo lite a primeira página (e cada "carregar mais") já vem maior.
  const lite = useLiteMode();
  const pageSize = litePageSize(PAGE_SIZE, lite);
  const { requireAuth } = useAuth();
  const queryClient = useQueryClient();
  const [comments, setComments] = useState<CommentView[]>([]);
  // Notificação de comentário (issue #1022): quando as linhas estão na tela, rola até O comentário
  // e o realça por um instante. O anel some sozinho; a rolagem é o que leva o olhar.
  const [highlighting, setHighlighting] = useState(false);
  const hasComments = comments.length > 0;
  useEffect(() => {
    if (!highlightCommentId || !hasComments) return;
    const row = document.querySelector(`[data-comment-id="${highlightCommentId}"]`);
    if (!row) return; // comentário em página ainda não carregada: sem linha, sem rolagem.
    row.scrollIntoView({ block: "center", behavior: "smooth" });
    setHighlighting(true);
    const timer = window.setTimeout(() => setHighlighting(false), 2400);
    return () => window.clearTimeout(timer);
  }, [highlightCommentId, hasComments]);
  const commentsRef = useRef<CommentView[]>(comments);
  commentsRef.current = comments;
  const draft = usePostCardStore((state) => state.cards[postId]?.draft ?? "");
  const mentions = usePostCardStore(selectCommentMentions(postId));
  const replyToId = usePostCardStore((state) => state.cards[postId]?.replyToId ?? null);
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [lastAddedCount, setLastAddedCount] = useState(0);
  const [error, setError] = useState<CommentsError | null>(null);
  /** Razao da recusa vinda da API: sem ela, "tente de novo" nao diz o que corrigir. */
  const [sendErrorDetail, setSendErrorDetail] = useState<string | null>(null);
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

  // The post this list belongs to now. Moving from one post to another keeps the component (the post
  // page reuses it): a late answer for the previous post must not land on the new one, or its
  // comments showed under the new post and reactions went to the old one.
  const currentPostId = useRef(postId);
  currentPostId.current = postId;

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSendErrorDetail(null);
    setComments([]);
    setCursor(null);
    setHasMore(false);
    try {
      const page = await commentsApi.list(postId, null, pageSize);
      if (currentPostId.current !== postId) return;
      setComments(oldestFirst(page.items));
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch {
      if (currentPostId.current === postId) setError("load");
    } finally {
      if (currentPostId.current === postId) setLoading(false);
    }
  }, [postId, pageSize]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const refreshFirstPage = useCallback(async () => {
    if (loading || sending || refreshing) return;
    if (typeof document !== "undefined" && document.hidden) return;
    setRefreshing(true);
    try {
      const page = await commentsApi.list(postId, null, pageSize);
      if (currentPostId.current !== postId) return;
      const existingIds = new Set(commentsRef.current.map((item) => item.id));
      const addedCount = page.items.filter((item) => !existingIds.has(item.id)).length;
      setComments((current) => mergeRefreshedComments(current, page.items, oldestFirst).next);
      setLastAddedCount(addedCount);
      setLastRefreshedAt(new Date());
      if (addedCount > 0) {
        updatePostInQueryCache(queryClient, postId, (current) => ({
          ...current,
          counters: {
            ...current.counters,
            comments: current.counters.comments + addedCount,
          },
        }));
      }
    } catch {
      // Atualização em segundo plano: falha silenciosa para não interromper a leitura.
    } finally {
      if (currentPostId.current === postId) setRefreshing(false);
    }
  }, [loading, pageSize, postId, queryClient, refreshing, sending]);

  useEffect(() => {
    if (!liveRefresh) return;
    const intervalMs = liteInterval(COMMENTS_LIVE_REFRESH_MS, lite);
    const timer = window.setInterval(() => {
      void refreshFirstPage();
    }, intervalMs);
    const onVisibilityChange = () => {
      if (!document.hidden) {
        void refreshFirstPage();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [lite, liveRefresh, refreshFirstPage]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await commentsApi.list(postId, cursor, pageSize);
      if (currentPostId.current !== postId) return;
      setComments((current) => oldestFirst([...current, ...page.items]));
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch {
      if (currentPostId.current === postId) setError("load");
    } finally {
      setLoadingMore(false);
    }
  };

  const canSend = Boolean(draft.trim()) || media.length > 0;

  const submit = async (website: string): Promise<boolean> => {
    const content = draft.trim();
    if (!canSend || sending) return false;
    // Comentar e uma acao: sem sessao (link compartilhado aberto por outra pessoa) vai para o login.
    if (!requireAuth()) return false;

    if (posting) return false;
    setPosting(true);
    setSending(true);
    // A nova tentativa apaga o aviso da anterior.
    setError(null);
    setSendErrorDetail(null);
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
    } catch (failure) {
      // Envio recusado não é a lista falhando: o erro fica junto do campo e os comentários já
      // carregados continuam na tela. Antes isso caía em "load" e a thread inteira virava
      // "Não foi possível carregar os comentários" — o sintoma do comentário que some ao enviar.
      // A razão que a API deu (ex.: conteúdo duplicado) acompanha o aviso: é acionável, e o
      // texto genérico não é.
      setError(media.length > 0 ? "upload" : "send");
      // Só o ApiError traz mensagem da API de verdade; um Error qualquer de rede/bug não é
      // acionável — sem detalhe, o aviso volta ao texto genérico ("Tente de novo").
      setSendErrorDetail(failure instanceof ApiError ? failure.message : null);
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

  const liveStatusLabel = refreshing
    ? "Atualizando comentários…"
    : lastRefreshedAt
      ? `Comentários atualizados às ${formatarData(lastRefreshedAt, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}${lastAddedCount > 0 ? ` (+${lastAddedCount} ${lastAddedCount === 1 ? "novo" : "novos"})` : ""}`
      : "Atualização automática ativa";

  return (
    <>
      {liveRefresh && !loading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-live="polite"
          disabled={refreshing}
          onClick={() => void refreshFirstPage()}
        >
          <RefreshCw aria-hidden="true" />
          {liveStatusLabel}
        </Button>
      )}

      <PostCommentsView
        formId={`comment-form-${postId}`}
        comments={shownComments}
        loading={loading}
        loadingMore={loadingMore}
        hasMore={hasMore}
        error={error}
        sendErrorDetail={sendErrorDetail}
        onRetry={loadFirstPage}
        onLoadMore={loadMore}
        renderComment={(comment, replyingTo) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            commentDomId={comment.id}
            highlighted={highlighting && highlightCommentId === comment.id}
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
        composerField={({ toolsOpen, replyingTo }) => (
          <MentionTextarea
            value={draft}
            onChange={(value, ids) => {
              setDraft(postId, value);
              setCommentMentions(postId, ids);
            }}
            placeholder={
              replyingTo
                ? texts.posts.comments.replyPlaceholder(replyingTo)
                : texts.posts.comments.placeholder
            }
            className="w-full resize-none border-0 bg-transparent px-2 py-1.5 text-sm font-normal outline-none"
            rows={1}
            maxLength={COMMENT_MAX_LENGTH}
            // The counter speaks up near the limit only: a quiet field otherwise.
            showCounter={draft.length >= COMMENT_COUNTER_FROM}
            toolbar
            toolbarVisible={toolsOpen}
            emoteInline
            onPasteImages={addMediaFiles}
            // requestSubmit passa pelo mesmo submit do botão (validação, anexos e login).
            onSubmitShortcut={() =>
              (
                document.getElementById(`comment-form-${postId}`) as HTMLFormElement | null
              )?.requestSubmit()
            }
          />
        )}
        canSend={canSend}
        sending={sending}
        onSubmit={submit}
        onOpenGifPicker={() => setGifOpen(true)}
        gifPicker={<GifPickerDialog open={gifOpen} onOpenChange={setGifOpen} onSelect={addGif} />}
      />
    </>
  );
}
