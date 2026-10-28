import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute, notFound } from "@tanstack/react-router";

import { texts } from "@/texts";
import { StyledName, UserAvatar, UserBadges } from "@rede-enois/design-system/domain";
import { Button, useToast } from "@rede-enois/design-system/ui";
import { ArrowLeft, PenLine, Plus, Rss } from "lucide-react";

import { blogsApi } from "@/lib/api/blogs";
import { resolveCdnUrl } from "@/lib/api/media";
import { formatarData } from "@/lib/date/format";
import { buildShareTags } from "@/lib/open-graph";
import { plainPreview } from "@/lib/rich-text/preview";
import { useAuth } from "@/lib/use-auth";

import { AppContainer } from "@/components/app-container";
import { RichText } from "@/components/post/rich-text";
import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

export const Route = createFileRoute("/blog/$username")({
  loader: async ({ params }) => {
    try {
      return await blogsApi.get(params.username);
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData: blog, params }) => ({
    meta: buildShareTags({
      title: blog ? texts.blog.seoTitle(blog.title) : texts.blog.seoFallbackTitle,
      description:
        blog?.description || texts.blog.seoDescription(blog?.authorName ?? params.username),
      url: `${texts.siteUrl}/blog/${encodeURIComponent(params.username)}`,
      imageUrl: resolveCdnUrl(blog?.authorAvatar) || `${texts.siteUrl}/icons/icon-512.png`,
      imageAlt: blog ? `Blog ${blog.title} no Énóis` : texts.blog.seoFallbackTitle,
    }),
  }),
  notFoundComponent: () => (
    <AppContainer>
      <div className="surface-card p-10 text-center">
        <p className="text-base font-normal text-text-strong">{texts.blog.notFound}</p>

        <Link
          to="/blogs"
          className="mt-2 inline-block text-sm font-normal text-primary hover:underline"
        >
          {texts.blog.backToBlogs}
        </Link>
      </div>
    </AppContainer>
  ),
  component: BlogPage,
});

/**
 * A página pública do blog: `/blog/{username}`.
 *
 * Abre para quem recebeu o link (sem sessão) — a sessão, quando existe, só acrescenta o botão de
 * inscrever e as ações de dono. O tema em HTML/CSS roda no mesmo quadro isolado das páginas e da bio.
 */
function BlogPage() {
  const { username } = Route.useParams();
  const loaderBlog = Route.useLoaderData();
  const { user: me, requireAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: live } = useQuery({
    queryKey: ["blog", username],
    queryFn: () => blogsApi.get(username),
    initialData: loaderBlog,
    // `subscribed`/`owner` dependem de QUEM pergunta, e o SSR não tem sessão: sem isto o dado do
    // loader vale como fresco por 30s no cliente (a mesma armadilha da comunidade).
    staleTime: 0,
  });

  const blog = live ?? loaderBlog;

  const subscribe = useMutation({
    mutationFn: () =>
      blog.subscribed ? blogsApi.unsubscribe(blog.slug) : blogsApi.subscribe(blog.slug),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog", username] });
      queryClient.invalidateQueries({ queryKey: ["blogs"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast(blog.subscribed ? texts.blog.unsubscribe : texts.blog.subscribed);
    },
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <Link
          to="/blogs"
          className="inline-flex items-center gap-1.5 text-sm font-normal text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />

          <>{texts.blog.backToBlogs}</>
        </Link>

        <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
          {blog.themeHtml ? (
            <SandboxedHtmlFrame
              html={blog.themeHtml}
              title={blog.title}
              className="h-64 w-full rounded-none border-0 bg-transparent shadow-none"
              innerPadding={false}
            />
          ) : (
            <div className="border-b border-border-soft p-5 sm:p-6">
              <h1 className="text-2xl font-semibold tracking-tight text-text-strong">
                {blog.title}
              </h1>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-6">
            <Link
              to="/perfil/$username"
              params={{ username: blog.authorUsername }}
              className="flex items-center gap-3"
            >
              <UserAvatar
                src={blog.authorAvatar}
                alt={blog.authorName}
                className="h-10 w-10 shrink-0"
              />

              <div>
                <p className="flex items-center gap-1 text-sm font-semibold text-text-strong">
                  <StyledName name={blog.authorName} style={blog.authorStyle} />
                  <UserBadges badges={blog.authorBadges} badge={blog.authorBadge} />
                </p>

                <p className="text-xs font-normal text-text-subtle">
                  {texts.blog.postsCount(blog.posts)}
                </p>
              </div>
            </Link>

            <div className="flex flex-wrap gap-2">
              {blog.owner ? (
                <>
                  <Link to="/blog/post/new">
                    <Button size="sm" className="rounded-full gap-1.5">
                      <Plus className="h-4 w-4" aria-hidden />

                      <>{texts.blog.newPost}</>
                    </Button>
                  </Link>

                  <Link to="/blogs">
                    <Button size="sm" variant="outline" className="rounded-full gap-1.5">
                      <PenLine className="h-4 w-4" aria-hidden />

                      <>{texts.blog.edit}</>
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  size="sm"
                  variant={blog.subscribed ? "outline" : "default"}
                  className="rounded-full gap-1.5"
                  disabled={subscribe.isPending}
                  onClick={() => {
                    if (!requireAuth()) return;
                    subscribe.mutate();
                  }}
                >
                  <Rss className="h-4 w-4" aria-hidden />

                  <>{blog.subscribed ? texts.blog.subscribed : texts.blog.subscribe}</>
                </Button>
              )}
            </div>
          </div>

          {blog.description && (
            <RichText
              content={blog.description}
              className="px-4 pb-4 text-sm font-normal text-muted-foreground sm:px-6 sm:pb-6"
            />
          )}

          {!blog.owner && !blog.subscribed && (
            <p className="px-4 pb-4 text-xs font-normal text-text-subtle sm:px-6 sm:pb-6">
              {texts.blog.subscribeHint}
            </p>
          )}
        </div>

        {blog.items.length === 0 ? (
          <p className="surface-card p-8 text-center text-sm font-normal text-muted-foreground">
            {texts.blog.empty}
          </p>
        ) : (
          <div className="space-y-3">
            {blog.items.map((post) => {
              // O resumo: sem ele a lista mostrava só o título, e um post cheio de texto parecia
              // vazio. Post escrito no editor livre (HTML/CSS) não tem resumo em texto — o rótulo
              // diz o que é, em vez de abrir um espaço em branco no card.
              const preview = post.bodyFormat === "MARKDOWN" ? plainPreview(post.body) : "";

              return (
                <Link
                  key={post.id}
                  to="/blog/$username/$postId"
                  params={{ username: blog.slug, postId: post.id }}
                  className="surface-card block p-4 transition hover:border-primary/40 sm:p-5"
                >
                  <p className="text-base font-semibold text-text-strong">{post.title}</p>

                  {preview !== "" ? (
                    <p className="mt-1 line-clamp-2 text-sm font-normal text-muted-foreground">
                      {preview}
                    </p>
                  ) : post.bodyFormat === "HTML" ? (
                    <p className="mt-1 text-sm font-normal text-text-subtle">
                      {texts.blog.pagePost}
                    </p>
                  ) : null}

                  <p className="mt-1 text-xs font-normal text-text-subtle">
                    {formatarData(post.publishedAt, {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppContainer>
  );
}
