import { useEffect, useState } from "react";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Code2, FolderKanban, Globe, Plus, Search } from "lucide-react";

import { communityProjectsApi } from "@/lib/api";
import { litePageSize } from "@/lib/lite-mode";
import { requireAuth } from "@/lib/require-auth";
import { ogMetas } from "@/lib/seo";
import { useIsAuthenticated } from "@/lib/use-auth";
import { useLiteMode } from "@/lib/use-lite-mode";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/ui/loading-state";

import { AppContainer } from "@/components/app-container";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";

export const Route = createFileRoute("/projetos/")({
  head: () => ({
    meta: [
      { title: texts.projects.seoTitle },
      { name: "description", content: texts.projects.seoDescription },
      ...ogMetas(texts.projects.seoTitle, texts.projects.seoDescription),
    ],
  }),
  component: ProjectsCatalog,
});

const PAGE_SIZE = 24;

function ProjectsCatalog() {
  const lite = useLiteMode();
  const authenticated = useIsAuthenticated();
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<"recent" | "title">("recent");
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(term.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [term]);

  const catalog = useInfiniteQuery({
    queryKey: ["projects", "catalog", query, order],
    queryFn: ({ pageParam }) =>
      communityProjectsApi.catalog({
        query: query || undefined,
        order,
        limit: litePageSize(PAGE_SIZE, lite),
        cursor: pageParam,
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items = catalog.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              <FolderKanban className="h-6 w-6 text-primary" />

              <>{texts.projects.title}</>
            </h1>

            {authenticated && (
              <Button className="w-auto rounded-full gap-2" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" />

                <>{texts.projects.submit}</>
              </Button>
            )}
          </div>

          <p className="max-w-2xl text-sm text-text-subtle">{texts.projects.description}</p>
        </header>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-subtle" />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={texts.projects.searchPlaceholder}
              className="pl-9"
            />
          </div>

          <Button
            variant={order === "recent" ? "default" : "outline"}
            size="sm"
            className="w-auto rounded-full"
            onClick={() => setOrder("recent")}
          >
            {texts.projects.orderRecent}
          </Button>

          <Button
            variant={order === "title" ? "default" : "outline"}
            size="sm"
            className="w-auto rounded-full"
            onClick={() => setOrder("title")}
          >
            {texts.projects.orderTitle}
          </Button>
        </div>

        {catalog.isLoading ? (
          <LoadingState />
        ) : catalog.isError ? (
          <p className="text-sm text-destructive">{texts.projects.error}</p>
        ) : items.length === 0 ? (
          <div className="surface-card">
            <EmptyState
              icon={FolderKanban}
              title={texts.projects.empty}
              description={texts.projects.emptyHint}
            />
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((project) => (
                <li key={project.id}>
                  <Link
                    to="/projetos/$username/$projectSlug"
                    params={{
                      username: project.username ?? "perfil",
                      projectSlug: project.slug,
                    }}
                    className="surface-card block h-full overflow-hidden transition hover:border-primary/50"
                  >
                    {project.cover ? (
                      <img src={project.cover} alt="" className="h-36 w-full object-cover" />
                    ) : (
                      <div
                        className="h-36 w-full"
                        style={{ background: "var(--gradient-primary)" }}
                      />
                    )}

                    <div className="space-y-2 p-4">
                      {project.category && (
                        <span className="inline-block rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary-text">
                          {project.category}
                        </span>
                      )}

                      <h2 className="line-clamp-2 font-semibold text-text-strong">
                        {project.title}
                      </h2>

                      <p className="line-clamp-2 text-sm text-text-subtle">
                        {project.shortDescription || project.description || " "}
                      </p>

                      <div className="flex items-center gap-3 text-xs text-text-subtle">
                        {project.url && (
                          <span className="inline-flex items-center gap-1">
                            <Globe className="h-3.5 w-3.5" />
                            {texts.projects.openProject}
                          </span>
                        )}

                        {project.repoUrl && (
                          <span className="inline-flex items-center gap-1">
                            <Code2 className="h-3.5 w-3.5" />
                            {texts.projects.openRepo}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {catalog.hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="w-auto rounded-full"
                  disabled={catalog.isFetchingNextPage}
                  onClick={() => void catalog.fetchNextPage()}
                >
                  {texts.projects.loadMore}
                </Button>
              </div>
            )}
          </>
        )}

        <ProjectFormDialog open={formOpen} onOpenChange={setFormOpen} />
      </div>
    </AppContainer>
  );
}
