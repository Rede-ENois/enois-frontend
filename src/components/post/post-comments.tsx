import { type ChangeEvent, type FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { usePostCardStore } from "@/stores/post-card.store";
import { texts } from "@/texts";
import type { CommentView } from "@/types/application/comment/comment-view";
import type { PostIdProps } from "@/types/components/post/post-id-props";
import type { MediaItem } from "@/types/routes/feed/media-item";
import { EyeOff, Image, Loader2, Mic, Send, Square, X } from "lucide-react";

import { commentsApi } from "@/lib/api";
import { getCurrentUser } from "@/lib/current-user";
import { litePageSize } from "@/lib/lite-mode";
import { useAuth } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";

import { MentionTextarea } from "@/components/mention-textarea";
import { SpoilerPreview } from "@/components/post/spoiler-preview";
import { CommentSkeletons } from "@/components/skeletons/comment-skeletons";

import { CommentItem } from "./comment-item";
import { GifPickerDialog } from "./gif-picker-dialog";

const PAGE_SIZE = 20;

/**
 * Comentarios de um post.
 *
 * A lista tem altura maxima com scroll proprio (comentario longo nao empurra o resto do card
 * para fora da tela) e o campo de escrita fica sempre visivel abaixo. Como a API devolve os
 * mais recentes primeiro, "ver comentarios anteriores" carrega a proxima pagina e acrescenta no
 * fim; respostas cujo comentario pai ainda nao foi carregado aparecem como raiz para nao sumirem.
 */
export function PostComments({ postId, postAuthorId }: { postId: string; postAuthorId: string }) {
  // Em modo lite a primeira página (e cada "carregar mais") já vem maior.
  const lite = useLiteMode();
  const pageSize = litePageSize(PAGE_SIZE, lite);
  const currentUser = getCurrentUser();
  const { requireAuth } = useAuth();
  const comments = usePostCardStore((state) => state.cards[postId]?.localComments ?? []);
  const draft = usePostCardStore((state) => state.cards[postId]?.draft ?? "");
  const mentions = usePostCardStore((state) => state.cards[postId]?.commentMentions ?? []);
  const replyToId = usePostCardStore((state) => state.cards[postId]?.replyToId ?? null);
  const setComments = usePostCardStore((state) => state.setComments);
  const addComment = usePostCardStore((state) => state.addComment);
  const setDraft = usePostCardStore((state) => state.setDraft);
  const setCommentMentions = usePostCardStore((state) => state.setCommentMentions);
  const setReplyToId = usePostCardStore((state) => state.setReplyToId);
  const updateCommentCount = usePostCardStore((state) => state.updateCommentCount);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaSpoiler, setMediaSpoiler] = useState(false);
  const [gifOpen, setGifOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [posting, setPosting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useMediaUpload();

  // Gravar áudio: o mesmo caminho do anexo (vira arquivo e sobe como mídia) — o que muda é que o
  // arquivo nasce do microfone. Sem suporte no navegador, o botão nem aparece.
  const canRecord = typeof window !== "undefined" && typeof window.MediaRecorder !== "undefined";

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const startRecording = async () => {
    if (media.length >= 4) {
      setError(texts.posts.comments.mediaLimit);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        audioChunksRef.current = [];
        setRecordedSeconds(0);
        if (blob.size === 0) return;
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type });
        setMedia((current) =>
          current.length >= 4
            ? current
            : [...current, { type: "audio", file, preview: URL.createObjectURL(file) }],
        );
      };
      recorder.start();
      recorderRef.current = recorder;
      setError(null);
      setRecordedSeconds(0);
      setRecording(true);
    } catch {
      setError(texts.posts.comments.micDenied);
    }
  };

  // Cronômetro da gravação e teto de 3 minutos: arquivo de áudio longo é caro de subir e ninguém
  // ouve — melhor cortar sozinho do que descobrir depois.
  useEffect(() => {
    if (!recording) return;
    const timer = setInterval(() => setRecordedSeconds((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [recording]);

  useEffect(() => {
    if (recording && recordedSeconds >= 180) stopRecording();
  }, [recording, recordedSeconds]);

  const addMediaFiles = (incoming: File[]) => {
    const files = incoming.filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) return;
    setMedia((current) => {
      const room = 4 - current.length;
      if (room <= 0) {
        setError(texts.posts.comments.mediaLimit);
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

  const addMedia = (event: ChangeEvent<HTMLInputElement>) => {
    addMediaFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
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
      setComments(postId, oldestFirst(page.items));
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch {
      setError(texts.posts.comments.error);
    } finally {
      setLoading(false);
    }
  }, [postId, setComments, pageSize]);

  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadMore = async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await commentsApi.list(postId, cursor, pageSize);
      setComments(postId, oldestFirst([...comments, ...page.items]));
      setCursor(page.nextCursor);
      setHasMore(Boolean(page.nextCursor));
    } catch {
      setError(texts.posts.comments.error);
    } finally {
      setLoadingMore(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const content = draft.trim();
    if (!content || sending) return;
    // Comentar e uma acao: sem sessao (link compartilhado aberto por outra pessoa) vai para o login.
    if (!requireAuth()) return;

    if (posting) return;
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
        String(formData.get("website") ?? ""),
        mediaSpoiler,
      );
      addComment(postId, created);
      updateCommentCount(postId, 1);
      setDraft(postId, "");
      setCommentMentions(postId, []);
      setReplyToId(postId, null);
      media.forEach((m) => URL.revokeObjectURL(m.preview));
      setMedia([]);
      setMediaSpoiler(false);
      // O comentario novo entra no topo; rola a lista para o usuario ver.
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError(media.length > 0 ? texts.posts.comments.uploadFailed : texts.posts.comments.error);
    } finally {
      setPosting(false);
      setSending(false);
    }
  };

  const byId = new Map<string, CommentView>(comments.map((comment) => [comment.id, comment]));
  // Resolve a raiz de cada comentario subindo pelos pais ja carregados. Assim uma resposta a uma
  // resposta continua aparecendo sob o mesmo comentario-raiz — antes ela nao era renderizada
  // (nao era raiz nem resposta direta da raiz) e parecia que "nao renderizava".
  const rootIdByComment = new Map<string, string>();
  for (const comment of comments) {
    let currentId = comment.id;
    let parentId = comment.parentCommentId;
    const guard = new Set<string>();
    while (parentId && byId.has(parentId) && !guard.has(currentId)) {
      guard.add(currentId);
      currentId = parentId;
      parentId = byId.get(parentId)?.parentCommentId ?? null;
    }
    rootIdByComment.set(comment.id, currentId);
  }
  const roots = comments.filter((comment) => rootIdByComment.get(comment.id) === comment.id);
  const replyToName = replyToId ? byId.get(replyToId)?.authorName : undefined;

  return (
    <section className="mt-4 border-t border-border-soft pt-4">
      <div
        ref={listRef}
        // Sem `overscroll-contain`: quando a lista ainda não transborda, ele impede a propagação
        // do toque para a página e o usuário não consegue rolar (relato em tablet/Fennec — o
        // último post da viewport travava o scroll até fechar os comentários).
        className="max-h-[55vh] min-h-0 space-y-3 overflow-y-auto pr-1"
      >
        {loading && <CommentSkeletons />}

        {!loading && error && (
          <div className="py-4 text-center">
            <p className="text-sm font-normal text-destructive">{error}</p>

            <Button
              variant="outline"
              size="sm"
              className="mt-2 rounded-full"
              onClick={loadFirstPage}
            >
              {texts.posts.comments.retry}
            </Button>
          </div>
        )}

        {!loading && !error && roots.length === 0 && (
          <p className="py-4 text-center text-sm font-normal text-text-subtle">
            {texts.posts.comments.empty}
          </p>
        )}

        {!loading &&
          !error &&
          roots.map((comment) => {
            const replies = comments.filter(
              (c) => c.id !== comment.id && rootIdByComment.get(c.id) === comment.id,
            );
            return (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  postAuthorId={postAuthorId}
                  onPinChanged={() => void loadFirstPage()}
                />

                {replies.length > 0 && (
                  <div className="ml-6 mt-2 space-y-2 border-l-2 border-border-soft pl-3 sm:ml-10 sm:pl-4">
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        replyingTo={byId.get(reply.parentCommentId ?? "")?.authorName}
                        postAuthorId={postAuthorId}
                        onPinChanged={() => void loadFirstPage()}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {loadingMore && <CommentSkeletons count={1} />}

        {!loading && !error && hasMore && (
          <div className="pt-1 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full text-sm font-normal text-primary"
              disabled={loadingMore}
              onClick={loadMore}
            >
              {loadingMore ? texts.posts.comments.loadingMore : texts.posts.comments.loadMore}
            </Button>
          </div>
        )}
      </div>

      <form onSubmit={submit} className="mt-4">
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div className="min-w-0">
          {replyToId && (
            <div className="mb-1 flex items-center gap-2 pl-4 text-xs font-normal text-primary">
              <span className="truncate">
                {replyToName
                  ? texts.posts.comments.replyingTo(replyToName)
                  : texts.posts.comments.reply}
              </span>

              <button
                type="button"
                onClick={() => setReplyToId(postId, null)}
                className="shrink-0 text-text-subtle hover:text-foreground"
                aria-label={texts.posts.comments.cancelReply}
                title={texts.posts.comments.cancelReply}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {media.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {media.map((item, i) => (
                <div key={item.preview} className="relative">
                  {item.type === "audio" ? (
                    <audio
                      src={item.preview}
                      controls
                      className="h-16 w-56 rounded-lg border border-border-soft"
                    />
                  ) : (
                    <SpoilerPreview
                      active={mediaSpoiler}
                      label={texts.posts.mediaSpoiler.badge}
                      className="h-16 w-16 rounded-lg"
                    >
                      <img
                        src={item.preview}
                        alt=""
                        className="h-16 w-16 rounded-lg border border-border-soft object-cover"
                      />
                    </SpoilerPreview>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(item.preview);
                      setMedia((current) => {
                        const next = current.filter((_, index) => index !== i);
                        if (next.length === 0) setMediaSpoiler(false);
                        return next;
                      });
                    }}
                    className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-foreground text-background shadow"
                    aria-label={texts.posts.comments.removeMedia}
                    title={texts.posts.comments.removeMedia}
                  >
                    <X className="h-3 w-3" />
                  </button>

                  {/* Item 9: insere o marcador no ponto do texto (o pendente vira id real no upload). */}
                  <button
                    type="button"
                    title={texts.posts.comments.insertInText}
                    onClick={() => setDraft(postId, `${draft}{{media:pendente-${i}}}`)}
                    className="mt-1 flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-primary/40 px-1 py-0.5 text-[10px] font-normal text-primary transition hover:bg-primary/10"
                  >
                    {texts.posts.comments.insertInText}
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMediaSpoiler((active) => !active)}
                className={`inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs transition ${
                  mediaSpoiler
                    ? "bg-primary text-primary-foreground"
                    : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
                }`}
                aria-label={
                  mediaSpoiler
                    ? texts.posts.comments.mediaSpoilerActive
                    : texts.posts.comments.mediaSpoiler
                }
                title={
                  mediaSpoiler
                    ? texts.posts.comments.mediaSpoilerActive
                    : texts.posts.comments.mediaSpoiler
                }
              >
                <EyeOff className="h-3.5 w-3.5" />
                {mediaSpoiler
                  ? texts.posts.comments.mediaSpoilerActive
                  : texts.posts.comments.mediaSpoiler}
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-border-soft bg-surface-1 p-2">
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
            />

            <div className="mt-1 flex items-center gap-1 px-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={addMedia}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid h-8 w-8 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary"
                aria-label={texts.posts.comments.attachMedia}
                title={texts.posts.comments.attachMedia}
              >
                <Image className="h-4 w-4" />
              </button>

              {canRecord && (
                <button
                  type="button"
                  onClick={() => (recording ? stopRecording() : void startRecording())}
                  className="grid h-8 w-8 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2 hover:text-primary"
                  aria-label={
                    recording
                      ? texts.posts.comments.stopRecording
                      : texts.posts.comments.recordAudio
                  }
                  title={
                    recording
                      ? texts.posts.comments.stopRecording
                      : texts.posts.comments.recordAudio
                  }
                >
                  {recording ? (
                    <Square className="h-4 w-4 text-destructive" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </button>
              )}

              {recording && (
                <span className="text-xs font-normal text-destructive" aria-live="polite">
                  {texts.posts.comments.recording(
                    Math.floor(recordedSeconds / 60),
                    recordedSeconds % 60,
                  )}
                </span>
              )}

              <button
                type="button"
                onClick={() => setGifOpen(true)}
                className="h-8 rounded-full px-2 text-xs font-semibold text-text-subtle transition hover:bg-surface-2 hover:text-primary"
                aria-label={texts.posts.comments.gif}
              >
                {texts.posts.comments.gif}
              </button>

              <Button
                type="submit"
                size="icon"
                // h-9 (36px) em vez de 28px: era pequeno demais para o dedo no celular.
                className="ml-auto h-9 w-9 shrink-0 rounded-full"
                disabled={(!draft.trim() && media.length === 0) || sending}
                aria-label={texts.posts.comments.send}
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      <GifPickerDialog open={gifOpen} onOpenChange={setGifOpen} onSelect={addGif} />
    </section>
  );
}
