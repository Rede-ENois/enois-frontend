import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { BlogPost } from "@/types/application/blog/blog-post";
import type { BlogPostFormat } from "@/types/application/blog/blog-post-format";
import { ArrowLeft, Eye, PenLine } from "lucide-react";

import { blogsApi } from "@/lib/api/blogs";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/pill";
import { useToast } from "@/components/ui/toast";

import { AppContainer } from "@/components/app-container";
import { HtmlEditor } from "@/components/html-editor";
import { MentionTextarea } from "@/components/mention-textarea";
import { RichText } from "@/components/post/rich-text";

/**
 * Escrever ou editar um post do blog, em tela cheia (`/blog/post/new` e `/blog/post/{id}`).
 * Com `post` é edição (preenche e salva por cima); sem ele publica um post novo. Dois formatos: "Texto" (markdown simples, com barra e prévia) e "HTML/CSS" (editor
 * livre). O backend guarda o que a pessoa escreveu (markdown como markdown, HTML sanitizado).
 */
export function BlogPostEditor({ post }: { post?: BlogPost | null }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState(post?.title ?? "");
  const [body, setBody] = useState(post?.body ?? "");
  const [format, setFormat] = useState<BlogPostFormat>(post?.bodyFormat ?? "MARKDOWN");
  const [preview, setPreview] = useState(false);
  const [avisar, setAvisar] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publish = useMutation({
    mutationFn: () =>
      post
        ? blogsApi.editPost(post.id, { title, body, format })
        : blogsApi.publish({ title, body, format, notifySubscribers: avisar }),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
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

  const canPublish = title.trim().length > 0 && body.trim().length > 0 && !publish.isPending;

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

        <div className="space-y-3">
          <Input
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
