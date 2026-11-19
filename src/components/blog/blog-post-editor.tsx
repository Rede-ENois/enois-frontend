import { useEffect, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { BlogPost } from "@/types/application/blog/blog-post";
import type { BlogPostFormat } from "@/types/application/blog/blog-post-format";
import type { VlogAttachment } from "@/types/media-upload/vlog-attachment";
import { Button, Input, MetaLine, Pill, useToast } from "@rede-enois/design-system/ui";
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
  // O seletor de arquivo é nativo (o DS não tem campo de arquivo): o clique vem do botão dele.
  const filePicker = useRef<HTMLInputElement>(null);
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

  // Só conta como "ainda subindo" o anexo sem mídia e sem falha: o que falhou está parado até
  // alguém tentar de novo, e travar a publicação nele sem explicação escondia o erro.
  const pendingAttachments = attachments.some(
    (attachment) => !attachment.media && !attachment.uploadError,
  );

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
  /**
   * Sobe UM anexo. O `uploadAll` para no primeiro arquivo que falha e perde a referência do que já
   * subiu; um por vez, cada anexo tem o próprio estado — o que falhou fica marcado para tentar de
   * novo sem derrubar os outros.
   */
  const uploadOne = async (target: VlogAttachment) => {
    try {
      const [result] = await upload.uploadAll([{ file: target.file }]);
      setAttachments((current) =>
        current.map((attachment) =>
          attachment === target
            ? { ...attachment, media: result ?? null, uploadError: result ? null : "upload" }
            : attachment,
        ),
      );
    } catch (caught) {
      const message =
        caught instanceof Error && caught.message ? caught.message : texts.blog.editor.mediaError;
      setAttachments((current) =>
        current.map((attachment) =>
          attachment === target ? { ...attachment, uploadError: message } : attachment,
        ),
      );
    }
  };

  const retry = (target: VlogAttachment) => {
    // Nova tentativa = anexo novo: o estado `uploadError` fez o papel de remarcar o objeto, e a
    // atualização dele no estado é assíncrona — subir o objeto antigo fazia a resposta do upload
    // não achar a linha e o anexo ficar "enviando" para sempre.
    const attempt: VlogAttachment = { ...target, media: null, uploadError: null };
    setAttachments((current) =>
      current.map((attachment) => (attachment === target ? attempt : attachment)),
    );
    void uploadOne(attempt);
  };

  const addFiles = (files: File[]) => {
    const room = BLOG_POST_MEDIA_LIMIT - attachments.length;
    if (files.length > room) {
      setMediaError(texts.blog.editor.mediaLimit);
    }
    const chosen = files.slice(0, Math.max(room, 0));
    if (chosen.length === 0) return;
    setMediaError(null);
    const added: VlogAttachment[] = chosen.map((file) => ({ file, media: null }));
    setAttachments((current) => [...current, ...added]);
    for (const attachment of added) void uploadOne(attachment);
  };

  const attachmentLabel = (attachment: VlogAttachment, index: number) =>
    attachment.file.name ||
    (attachment.file.type.startsWith("video/") || isVideoFile(attachment.file)
      ? texts.blog.editor.mediaVideo
      : texts.blog.editor.mediaPhoto) ||
    texts.blog.editor.mediaRemove.replace("{{index}}", String(index + 1));

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
            <MetaLine>{texts.blog.editor.mediaTitle}</MetaLine>

            <MetaLine>{texts.blog.editor.mediaHint}</MetaLine>

            {/* A lista é de Pills: cada anexo é o próprio controle — o enviado sai por um clique
                (remover), o que falhou se clica para tentar de novo. */}
            {attachments.map((attachment, index) => {
              const label = attachmentLabel(attachment, index);
              const description = attachment.media
                ? label
                : attachment.uploadError
                  ? `${texts.blog.editor.mediaRetry} · ${label}`
                  : texts.blog.editor.mediaUploading.replace("{{name}}", label);

              return (
                <Pill
                  key={`${attachment.media?.mediaId ?? ""}-${attachment.file.name}-${index}`}
                  size="sm"
                  onClick={() =>
                    attachment.media ? removeAttachment(attachment) : retry(attachment)
                  }
                >
                  {description}
                </Pill>
              );
            })}

            {mediaError && (
              <Pill key="media-error" size="sm" onClick={() => setMediaError(null)}>
                {mediaError}
              </Pill>
            )}

            {pendingAttachments && (
              <Pill key="media-pending" size="sm">
                {texts.blog.editor.mediaPending}
              </Pill>
            )}

            {/* O seletor de arquivo é o do navegador: o botão do DS não tem prop de arquivo nem
                lista (`accept`/`multiple`) para pedir ao design system, então o campo nativo fica
                atrás do botão e o clique vem dele. */}
            <Button
              size="sm"
              variant="outline"
              disabled={attachments.length >= BLOG_POST_MEDIA_LIMIT}
              onClick={() => filePicker.current?.click()}
            >
              {texts.blog.editor.mediaAdd}
            </Button>

            <input
              ref={filePicker}
              aria-label={texts.blog.editor.mediaAdd}
              type="file"
              accept="image/*,video/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              disabled={attachments.length >= BLOG_POST_MEDIA_LIMIT}
              onChange={(event) => {
                const files = [...(event.target.files ?? [])];
                event.target.value = "";
                addFiles(files);
              }}
            />
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
