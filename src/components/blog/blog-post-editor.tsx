import { useEffect, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { BlogPost } from "@/types/application/blog/blog-post";
import type { BlogPostFormat } from "@/types/application/blog/blog-post-format";
import type { VlogAttachment } from "@/types/media-upload/vlog-attachment";
import { Button, Input, Pill, useToast } from "@rede-enois/design-system/ui";
import { ArrowLeft, Eye, ImageUp, PenLine, X } from "lucide-react";

import { blogsApi } from "@/lib/api/blogs";
import { feedApi } from "@/lib/api/feed";
import { mediaApi } from "@/lib/api/media";
import { getCurrentUserId } from "@/lib/current-user";
import { refreshFeedFirstPage } from "@/lib/feed/post-query-cache";
import {
  BLOG_POST_MEDIA_LIMIT,
  importedMedia,
  uploadedMediaIds,
} from "@/lib/media-upload/vlog-media";
import { useMediaUpload } from "@/lib/use-media-upload";
import { isVideoFile } from "@/lib/video-limit";

import { AppContainer } from "@/components/app-container";
import { HtmlEditor } from "@/components/html-editor";
import { MentionTextarea } from "@/components/mention-textarea";
import { RichText } from "@/components/post/rich-text";

/**
 * Escrever ou editar um post do blog, em tela cheia (`/blog/post/new` e `/blog/post/{id}`).
 * Com `post` é edição (preenche e salva por cima); sem ele publica um post novo. Dois formatos: "Texto" (markdown simples, com barra e prévia) e "HTML/CSS" (editor
 * livre). O backend guarda o que a pessoa escreveu (markdown como markdown, HTML sanitizado).
 */
export function BlogPostEditor({
  post,
  continueDraftId,
}: {
  post?: BlogPost | null;
  /** Id do rascunho que a pessoa veio retomar da lista "Continuar escrevendo" (?rascunho=). */
  continueDraftId?: string;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [format, setFormat] = useState<BlogPostFormat>(post?.bodyFormat ?? "MARKDOWN");
  const [preview, setPreview] = useState(false);
  const [avisar, setAvisar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftSaved, setDraftSaved] = useState<boolean | null>(null);
  const [attachments, setAttachments] = useState<VlogAttachment[]>(
    (post?.mediaIds ?? []).map((id) => ({
      file: new File([], ""),
      media: importedMedia(id, null),
    })),
  );
  const [mediaError, setMediaError] = useState<string | null>(null);
  const upload = useMediaUpload();

  // Restaura depois da hidratação e só então permite gravar: o formulário vazio não apaga o rascunho.
  // O rascunho mora no servidor (lista por pessoa — quem escreve mais de um texto não perde
  // material); o localStorage continua como rede de segurança para quando a rede falha.
  useEffect(() => {
    if (post) return;
    let cancelled = false;
    const userId = getCurrentUserId();
    const localKey = userId ? `connect-grow-blog-post-draft:${userId}` : null;

    (async () => {
      let restored = false;
      try {
        const { drafts } = await feedApi.drafts();
        const artigo = continueDraftId
          ? drafts.find((d) => d.id === continueDraftId)
          : drafts.find((d) => d.type === "ARTICLE" && (d.articleBody || d.content));
        if (!cancelled && artigo) {
          // O rascunho de artigo guarda o TÍTULO no content e o corpo no articleBody.
          setTitle(artigo.content ?? "");
          setBody(artigo.articleBody ?? "");
          setDraftId(artigo.id);
          restored = true;
        }
      } catch {
        // Sem rede, o localStorage segura a escrita do dia.
      }
      if (!cancelled && !restored && localKey) {
        try {
          const raw = localStorage.getItem(localKey);
          if (raw) {
            const draft = JSON.parse(raw) as Record<string, unknown>;
            if (
              draft &&
              typeof draft.title === "string" &&
              typeof draft.body === "string" &&
              (draft.format === "MARKDOWN" || draft.format === "HTML") &&
              typeof draft.avisar === "boolean"
            ) {
              setTitle(draft.title);
              setBody(draft.body);
              setFormat(draft.format);
              setAvisar(draft.avisar);
            }
          }
        } catch {
          // Um rascunho ilegível não impede escrever outro post.
        }
      }
      if (!cancelled) setDraftSaved(restored ? true : null);
    })();

    return () => {
      cancelled = true;
    };
  }, [post, continueDraftId]);

  // Autosave no servidor com espera entre salvamentos: cada tecla não vira requisição. O rascunho
  // novo nasce na primeira gravação e ganha id; daí em diante o id atualiza o mesmo rascunho.
  // Com a rede fora, o localStorage segura o rascunho do dia (a restauração dele já cobre o caso).
  useEffect(() => {
    if (post) return;
    if (!title.trim() && !body.trim()) return;
    const timer = window.setTimeout(async () => {
      try {
        const payload = {
          type: "ARTICLE",
          content: title.trim(),
          articleBody: body,
        };
        const { draft } = draftId
          ? await feedApi.saveDraftById(draftId, payload)
          : await feedApi.createDraft(payload);
        setDraftId(draft.id);
        setDraftSaved(true);
      } catch {
        const userId = getCurrentUserId();
        if (userId) {
          try {
            localStorage.setItem(
              `connect-grow-blog-post-draft:${userId}`,
              JSON.stringify({ title, body, format, avisar }),
            );
          } catch {
            // Sem servidor e sem armazenamento: mantenha a página aberta.
          }
        }
        setDraftSaved(false);
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [post, draftId, title, body, format, avisar]);

  const pendingAttachments = attachments.some((attachment) => !attachment.media);

  const publish = useMutation({
    onMutate: () => JSON.stringify({ title, body, format, avisar }),
    mutationFn: () => {
      const mediaIds = uploadedMediaIds(attachments);
      return post
        ? blogsApi.editPost(post.id, { title, body, format, mediaIds })
        : blogsApi.publish({ title, body, format, mediaIds, notifySubscribers: avisar });
    },
    onSuccess: async (_result, _variables, submittedDraft) => {
      if (!post && draftId) {
        try {
          await feedApi.discardDraftById(draftId);
        } catch {
          // A publicação já foi concluída mesmo se o descarte do rascunho falhar.
        }
      }
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      void refreshFeedFirstPage(queryClient);
      toast(post ? texts.blog.editor.updated : texts.blog.editor.published);
      const mine = await blogsApi.mine().catch(() => null);
      if (mine) {
        navigate({ to: "/blog/$username", params: { username: mine.slug } });
      } else {
        navigate({ to: "/blogs" });
      }
    },
    onError: (err) => setError(err instanceof Error ? err.message : texts.blog.editor.error),
  });

  const canPublish =
    title.trim().length > 0 && body.trim().length > 0 && !publish.isPending && !pendingAttachments;

  // O anexo sobe assim que é escolhido: ao salvar, o post só guarda os ids. Falha na subida deixa
  // o anexo marcado para remover e tentar de novo, em vez de ir embora sem aviso.
  const addFiles = async (files: File[]) => {
    const room = BLOG_POST_MEDIA_LIMIT - attachments.length;
    if (files.length > room) {
      setMediaError(texts.blog.editor.mediaLimit);
    }
    const chosen = files.slice(0, Math.max(room, 0));
    if (chosen.length === 0) return;
    setMediaError(null);
    const added: VlogAttachment[] = chosen.map((file) => ({ file, media: null }));
    setAttachments((current) => [...current, ...added]);
    try {
      const results: Awaited<ReturnType<typeof upload.uploadAll>> = await upload.uploadAll(
        chosen.map((file) => ({ file })),
      );
      setAttachments((current) =>
        current.map((attachment) => {
          const index = added.indexOf(attachment);
          return index >= 0 && results[index]
            ? { ...attachment, media: results[index] }
            : attachment;
        }),
      );
    } catch {
      setAttachments((current) => current.filter((attachment) => !added.includes(attachment)));
      setMediaError(texts.blog.editor.mediaError);
    }
  };

  const removeAttachment = (target: VlogAttachment) => {
    const isUploaded = !!target.media;
    setAttachments((current) => current.filter((attachment) => attachment !== target));
    setMediaError(null);
    // Mídia que subiu e não entrou no post não deve ficar órfã no storage: o servidor recusa a
    // remoção de mídia já em uso, e aí a limpeza periódica cuida dela.
    if (isUploaded) {
      void mediaApi.delete(target.media!.mediaId).catch(() => undefined);
    }
  };

  return (
    <AppContainer>
      <div className="space-y-4">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-text-strong"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />

          <>{texts.blog.title}</>
        </Link>

        <h1 className="text-xl font-semibold tracking-tight text-text-strong">
          {post ? texts.blog.editor.editPost : texts.blog.newPost}
        </h1>

        {!post && (title || body) && draftSaved !== null && (
          <p role="status" className="text-xs text-text-subtle">
            {draftSaved ? texts.blog.editor.draftSaved : texts.blog.editor.draftSaveError}
          </p>
        )}

        <div className="space-y-3">
          <Input
            aria-label={texts.blog.editor.postTitle}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={texts.blog.editor.postTitle}
            maxLength={200}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Pill active={format === "MARKDOWN"} onClick={() => setFormat("MARKDOWN")} size="md">
              {texts.blog.editor.modeText}
            </Pill>

            <Pill active={format === "HTML"} onClick={() => setFormat("HTML")} size="md">
              {texts.blog.editor.modeHtml}
            </Pill>

            {format === "MARKDOWN" && (
              <Pill active={preview} onClick={() => setPreview((current) => !current)} size="md">
                {preview ? (
                  <span className="inline-flex items-center gap-1.5">
                    <PenLine className="h-3.5 w-3.5" aria-hidden />

                    <>{texts.blog.editor.write}</>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5" aria-hidden />

                    <>{texts.blog.editor.preview}</>
                  </span>
                )}
              </Pill>
            )}
          </div>

          {format === "MARKDOWN" ? (
            <div className="space-y-2">
              {preview ? (
                <div className="min-h-[60vh] rounded-2xl border border-border bg-muted/40 px-3 py-2">
                  <RichText
                    content={body}
                    className="whitespace-pre-line break-words text-sm font-normal leading-relaxed text-text-strong"
                  />
                </div>
              ) : (
                <MentionTextarea
                  value={body}
                  onChange={(value) => setBody(value)}
                  placeholder={texts.blog.editor.textHint}
                  className="min-h-[60vh] rounded-2xl border border-border bg-muted/40 px-3 py-2 text-sm font-normal"
                  maxLength={20_000}
                  toolbar
                />
              )}

              <p className="text-xs font-normal text-text-subtle">{texts.blog.editor.textHint}</p>
            </div>
          ) : (
            <HtmlEditor
              id="blog-post-html"
              value={body}
              onChange={setBody}
              label={texts.blog.editor.modeHtml}
              description={texts.blog.editor.htmlHint}
              placeholder={
                '<style>\n.post { color: #f4efff; }\n</style>\n<article class="post">...</article>'
              }
              emptyPreview="Cole um HTML para ver a pré-visualização."
              frameTitle={texts.blog.newPost}
              maxLength={20_000}
              previewClassName="-mx-3 -mb-3 mt-3 h-[60vh] w-full"
            />
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-text-strong">{texts.blog.editor.mediaTitle}</p>

            <p className="text-xs font-normal text-text-subtle">{texts.blog.editor.mediaHint}</p>

            {attachments.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {attachments.map((attachment, index) => (
                  <li key={`${attachment.media?.mediaId ?? ""}-${attachment.file.name}-${index}`}>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full gap-1.5"
                      disabled={!attachment.media}
                      onClick={() => removeAttachment(attachment)}
                      aria-label={texts.blog.editor.mediaRemove(index)}
                    >
                      <ImageUp className="h-3.5 w-3.5" aria-hidden />

                      <>
                        {attachment.file.name ||
                          (attachment.file.type.startsWith("video/") || isVideoFile(attachment.file)
                            ? texts.blog.editor.mediaVideo
                            : texts.blog.editor.mediaPhoto)}
                      </>

                      <X className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            {pendingAttachments && (
              <p role="status" className="text-xs font-normal text-text-subtle">
                {texts.blog.editor.mediaUploading}
              </p>
            )}

            {mediaError && (
              <p role="alert" className="text-xs text-destructive">
                {mediaError}
              </p>
            )}

            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm hover:bg-muted/40">
              <ImageUp className="h-4 w-4" aria-hidden />

              <>{texts.blog.editor.mediaAdd}</>

              <input
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                disabled={attachments.length >= BLOG_POST_MEDIA_LIMIT}
                aria-label={texts.blog.editor.mediaAdd}
                onChange={(event) => {
                  const files = [...(event.target.files ?? [])];
                  event.target.value = "";
                  void addFiles(files);
                }}
              />
            </label>

            {pendingAttachments && (
              <p className="text-xs font-normal text-text-subtle">
                {texts.blog.editor.mediaPending}
              </p>
            )}
          </div>

          {!post && (
            <label className="flex items-start gap-2 text-xs font-normal text-text-subtle">
              <input
                type="checkbox"
                checked={avisar}
                onChange={(event) => setAvisar(event.target.checked)}
                className="mt-0.5"
              />

              <span>
                <span className="block font-medium text-text-strong">
                  {texts.blog.editor.notifySubscribers}
                </span>

                {texts.blog.editor.notifySubscribersHint}
              </span>
            </label>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Link to="/blogs">
              <Button size="sm" variant="outline">
                {texts.common.cancel}
              </Button>
            </Link>

            <Button size="sm" onClick={() => publish.mutate()} disabled={!canPublish}>
              {publish.isPending
                ? texts.common.publishing
                : post
                  ? texts.blog.editor.savePost
                  : texts.blog.editor.publish}
            </Button>
          </div>
        </div>
      </div>
    </AppContainer>
  );
}
