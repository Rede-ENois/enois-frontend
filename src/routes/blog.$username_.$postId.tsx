import { useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import { StyledName, UserAvatar } from "@rede-enois/design-system/domain";
import { Button, ConfirmDialog, useToast } from "@rede-enois/design-system/ui";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { feedApi } from "@/lib/api";
import { blogsApi } from "@/lib/api/blogs";
import { resolveCdnUrl } from "@/lib/api/media";
import { formatarData } from "@/lib/date/format";
import { buildShareTags } from "@/lib/open-graph";

import { AppContainer } from "@/components/app-container";
import { PostActions } from "@/components/post/post-actions";
import { PostComments } from "@/components/post/post-comments";
import { ReactionsSummary } from "@/components/post/reactions-summary";
import { RichText } from "@/components/post/rich-text";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * Um post do blog: `/blog/{username}/{postId}`.
 *
 * O `_` no fim de `$username_` (no NOME DO ARQUIVO) é o que impede esta rota de aninhar na página
 * do blog. Sem ele, `/blog/$username` vira rota-mãe desta, e o filho só apareceria dentro de um
 * `<Outlet/>` — que a página do blog não tem. Era esse o furo: clicar num post não abria nada.
 */
export const Route = createFileRoute("/blog/$username_/$postId")({
  loader: async ({ params }) => {
    try {
      const blog = await blogsApi.get(params.username);
      const post = blog.items.find((item) => item.id === params.postId);
      if (!post) {
        throw notFound();
      }
      // O ponteiro no feed (mesmo id) é quem tem as contagens e a reação de quem lê: buscá-lo aqui
      // deixa a fileira de ações já montada no primeiro HTML, sem piscar depois. Se ele não vier, a
      // página abre do mesmo jeito — só sem as ações.
      const pointer = await feedApi.get(post.id).catch(() => null);
      return { blog, post, pointer };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => ({
    meta: buildShareTags({
      title: loaderData
        ? `${loaderData.post.title} · ${loaderData.blog.title}`
        : texts.blog.seoFallbackTitle,
      description:
        loaderData?.blog.description ||
        texts.blog.seoDescription(loaderData?.blog.authorName ?? params.username),
      url: `${texts.siteUrl}/blog/${encodeURIComponent(params.username)}/${encodeURIComponent(params.postId)}`,
      imageUrl:
        resolveCdnUrl(loaderData?.blog.authorAvatar) || `${texts.siteUrl}/icons/icon-512.png`,
      imageAlt: loaderData
        ? `${loaderData.post.title} · blog ${loaderData.blog.title}`
        : texts.blog.seoFallbackTitle,
    }),
  }),
  notFoundComponent: () => (
    <AppContainer>
      <div className="surface-card p-10 text-center">
        <p className="text-base font-normal text-text-strong">{texts.posts.page.loading}</p>

        <Link
          to="/blogs"
          className="mt-2 inline-block text-sm font-normal text-primary hover:underline"
        >
          {texts.blog.backToBlogs}
        </Link>
      </div>
    </AppContainer>
  ),
  component: BlogPostPage,
});

/**
 * Um post do blog.
 *
 * Markdown vira texto formatado (o mesmo parser do feed, sem innerHTML em lugar nenhum); HTML/CSS
 * roda no quadro isolado das páginas e da bio. O post é público — é o link que a pessoa compartilha.
 */
function BlogPostPage() {
  const { username } = Route.useParams();
  const loaderData = Route.useLoaderData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["blog", username],
    queryFn: () => blogsApi.get(username),
    initialData: loaderData.blog,
    staleTime: 0,
  });

  const blog = data ?? loaderData.blog;
  const post =
    blog.items.find(
      (item: import("@/types/application/blog/blog-post").BlogPost) =>
        item.id === loaderData.post.id,
    ) ?? loaderData.post;

  // O post do blog é o MESMO post do feed (o ponteiro nasce com o id dele), então as ações —
  // reagir, comentar, compartilhar, salvar, denunciar — são as do feed, e as contagens vêm de lá.
  // O post do blog em si só guarda o texto: título, corpo e formato.
  const { data: feedPost } = useQuery({
    queryKey: ["post", post.id],
    queryFn: () => feedApi.get(post.id),
    initialData: loaderData.pointer ?? undefined,
  });

  const commentsRef = useRef<HTMLDivElement>(null);
  // O botão de comentários da fileira rola até a conversa (aqui ela é uma seção fixa, não um
  // bloco que abre e fecha como no feed).
  const focusComments = () =>
    commentsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const deletePost = useMutation({
    mutationFn: () => blogsApi.removePost(post.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog"] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast(texts.blog.editor.deleted);
      navigate({ to: "/blog/$username", params: { username: blog.slug } });
    },
    onError: () => toast(texts.blog.editor.error, "error"),
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <Link
          to="/blog/$username"
          params={{ username: blog.slug }}
          className="inline-flex items-center gap-1.5 text-sm font-normal text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />

          <>{blog.title}</>
        </Link>

        <article className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
          <header className="border-b border-border-soft p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-text-strong">
                {post.title}
              </h1>

              {/* Ações do dono: o post é dele, e a página do post é onde ele está lendo. */}
              {blog.owner && (
                <div className="flex items-center gap-2">
                  <Link to="/blog/post/$postId" params={{ postId: post.id }}>
                    <Button size="sm" variant="outline" className="rounded-full gap-1.5">
                      <Pencil className="h-4 w-4" />

                      <>{texts.common.edit}</>
                    </Button>
                  </Link>

                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full gap-1.5"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />

                    <>{texts.blog.editor.deletePost}</>
                  </Button>
                </div>
              )}
            </div>

            <Link
              to="/perfil/$username"
              params={{ username: blog.authorUsername }}
              className="mt-3 inline-flex items-center gap-2"
            >
              <UserAvatar
                src={blog.authorAvatar}
                alt={blog.authorName}
                className="h-7 w-7 shrink-0"
              />

              <span className="text-xs font-normal text-text-subtle">
                <StyledName name={blog.authorName} style={blog.authorStyle} /> ·{" "}
                {formatarData(post.publishedAt, {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </Link>
          </header>

          {post.bodyFormat === "HTML" ? (
            <SandboxedHtmlFrame
              html={post.body}
              title={post.title}
              className="h-[70vh] w-full rounded-none border-0 bg-transparent shadow-none"
              innerPadding={false}
            />
          ) : (
            <div className="p-5 sm:p-8">
              <RichText
                content={post.body}
                className="whitespace-pre-line break-words text-base font-normal leading-relaxed text-text-strong"
              />
            </div>
          )}

          {/* A fileira de ações do feed, aqui também: reagir, comentar, compartilhar, salvar e
              denunciar. Ela espera o ponteiro do feed chegar, porque é dele que vêm as contagens e
              a reação de quem lê. O link compartilhado daqui é o do blog (é o que a pessoa está
              lendo), não o do post no feed. */}
          {feedPost && (
            <div className="px-5 pb-4 sm:px-8 sm:pb-5">
              <ReactionsSummary post={feedPost} />
              <PostActions
                post={feedPost}
                onComments={focusComments}
                shareUrl={`${texts.siteUrl}/blog/${encodeURIComponent(blog.slug)}/${encodeURIComponent(post.id)}`}
              />
            </div>
          )}
        </article>

        {/* Comentários: o post do blog é um post do Énóis (mesmo id no feed), então a conversa é a
            mesma — quem visita o cantinho comenta aqui, e o dono responde de onde quiser. */}
        <section
          ref={commentsRef}
          className="scroll-mt-24 overflow-hidden rounded-2xl border border-border-soft bg-surface-card"
        >
          <PostComments postId={post.id} postAuthorId={feedPost?.authorId ?? ""} />
        </section>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={texts.blog.editor.deletePost}
        description={texts.blog.editor.deleteHint}
        confirmLabel={texts.blog.editor.deletePost}
        destructive
        pending={deletePost.isPending}
        onConfirm={() => deletePost.mutate()}
      />
    </AppContainer>
  );
}
