import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { BlogPost } from "@/types/application/blog/blog-post";
import {
  type BlogPostEditorValues,
  BlogPostEditor as BlogPostEditorView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { blogsApi } from "@/lib/api/blogs";

import { AppContainer } from "@/components/app-container";
import { MentionTextarea } from "@/components/mention-textarea";
import { RichText } from "@/components/post/rich-text";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * Escrever ou editar um post do blog, em tela cheia (`/blog/post/new` e `/blog/post/{id}`).
 * Com `post` é edição (preenche e salva por cima); sem ele publica um post novo. Dois formatos: "Texto" (markdown simples, com barra e prévia) e "HTML/CSS" (editor
 * livre). O backend guarda o que a pessoa escreveu (markdown como markdown, HTML sanitizado).
 */
export function BlogPostEditor({ post }: { post?: BlogPost | null }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const publish = useMutation({
    mutationFn: ({ title, body, format, notifySubscribers }: BlogPostEditorValues) =>
      post
        ? blogsApi.editPost(post.id, { title, body, format })
        : blogsApi.publish({ title, body, format, notifySubscribers }),
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

  return (
    <AppContainer>
      <BlogPostEditorView
        post={post}
        backHref="/blogs"
        pending={publish.isPending}
        error={error}
        onSubmit={(values) => publish.mutate(values)}
        renderMentionTextarea={(props) => <MentionTextarea {...props} />}
        renderRichText={(props) => <RichText {...props} />}
        renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
      />
    </AppContainer>
  );
}
