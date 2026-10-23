import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { BookOpen, PenLine, Plus } from "lucide-react";

import { blogsApi } from "@/lib/api/blogs";
import { requireAuth } from "@/lib/require-auth";
import { ogMetas } from "@/lib/seo";
import { useIsAuthenticated } from "@/lib/use-auth";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { PageHeader } from "@/components/ui/page-header";

import { AppContainer } from "@/components/app-container";
import { BlogEditorDialog } from "@/components/blog/blog-editor-dialog";
import { RichText } from "@/components/post/rich-text";
import { UserAvatar } from "@/components/user-avatar";

export const Route = createFileRoute("/blogs")({
  head: () => ({
    meta: [
      { title: texts.blog.title },
      { name: "description", content: texts.blog.description },
      ...ogMetas(texts.blog.title, texts.blog.description),
    ],
  }),
  component: Blogs,
});

/**
 * A aba Blogs: a vitrine dos cantinhos e o atalho para o seu.
 *
 * O blog de cada pessoa vive em `/blog/{username}` — aqui é a porta de entrada e o lugar de criar o
 * seu, editar o tema e publicar (os posts não passam pelo feed: quem quiser acompanhar se inscreve).
 */
function Blogs() {
  const [editorOpen, setEditorOpen] = useState(false);
  const authenticated = useIsAuthenticated();

  const { data: mine } = useQuery({
    queryKey: ["blog", "me"],
    queryFn: () => blogsApi.mine(),
    enabled: authenticated,
  });

  const { data: directory = [], isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: () => blogsApi.directory(),
  });

  return (
    <AppContainer>
      <div className="space-y-6">
        <PageHeader
          title={texts.blog.title}
          description={texts.blog.description}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full gap-1.5"
                onClick={() => {
                  requireAuth();
                  setEditorOpen(true);
                }}
              >
                <PenLine className="h-4 w-4" aria-hidden />

                <>{mine ? texts.blog.edit : texts.blog.create}</>
              </Button>

              {/* Post mora DENTRO de um blog: sem blog, o caminho é criar o blog primeiro (o botão
                ao lado) — não publicar num cantinho que ainda não existe. */}
              {mine && (
                <Link to="/blog/post/new">
                  <Button size="sm" className="rounded-full gap-1.5">
                    <Plus className="h-4 w-4" aria-hidden />

                    <>{texts.blog.newPost}</>
                  </Button>
                </Link>
              )}
            </>
          }
        />

        {mine && (
          <Link
            to="/blog/$username"
            params={{ username: mine.slug }}
            className="surface-card block p-4 transition hover:border-primary/40 sm:p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {texts.blog.myBlog}
            </p>

            <p className="mt-2 text-base font-semibold text-text-strong">{mine.title}</p>

            <p className="mt-1 text-sm font-normal text-muted-foreground">
              {texts.blog.postsCount(mine.posts)}
            </p>
          </Link>
        )}

        {isLoading ? (
          <LoadingState />
        ) : directory.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={texts.blog.title}
            description={texts.blog.emptyDirectory}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {directory.map((blog) => (
              <Link
                key={blog.slug}
                to="/blog/$username"
                params={{ username: blog.slug }}
                className="surface-card block min-w-0 p-4 transition hover:border-primary/40 sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={blog.authorAvatar}
                    alt={blog.authorName}
                    className="h-10 w-10 shrink-0"
                  />

                  <div className="min-w-0">
                    {/* Duas linhas no celular: o título do blog é o que identifica o cantinho e
                        truncar em uma linha comia boa parte dos nomes longos. */}
                    <p className="line-clamp-2 break-words text-base font-semibold text-text-strong">
                      {blog.title}
                    </p>

                    <p className="truncate text-xs font-normal text-text-subtle">
                      {blog.authorName} · {texts.blog.postsCount(blog.posts)}
                    </p>
                  </div>
                </div>

                {blog.description && (
                  <RichText
                    content={blog.description}
                    className="mt-3 line-clamp-2 text-sm font-normal text-muted-foreground"
                  />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <BlogEditorDialog open={editorOpen} onOpenChange={setEditorOpen} blog={mine ?? null} />
    </AppContainer>
  );
}
