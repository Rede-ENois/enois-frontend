import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { EmptyState, LoadingState } from "@rede-enois/design-system/ui";
import { ArrowLeft, Code2, Globe } from "lucide-react";

import { communityProjectsApi } from "@/lib/api";
import { safeHref } from "@/lib/safe-url";

import { AppContainer } from "@/components/app-container";
import { ProjectCover } from "@/components/projects/project-cover";

export const Route = createFileRoute("/projetos/$username/$projectSlug")({
  head: ({ params }) => ({
    meta: [{ title: `${params.projectSlug} · ${texts.projects.seoTitle}` }],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { username, projectSlug } = Route.useParams();
  const project = useQuery({
    queryKey: ["projects", "detail", username, projectSlug],
    queryFn: () => communityProjectsApi.bySlug(username, projectSlug),
    retry: false,
  });

  if (project.isLoading) {
    return (
      <AppContainer>
        <LoadingState />
      </AppContainer>
    );
  }

  if (project.isError || !project.data) {
    return (
      <AppContainer>
        <div className="mx-auto w-full max-w-3xl space-y-4">
          <BackLink />

          <div className="surface-card">
            <EmptyState icon={Globe} title={texts.projects.notFound} />
          </div>
        </div>
      </AppContainer>
    );
  }

  const data = project.data;
  const tags = (data.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <BackLink />

        <article className="surface-card overflow-hidden">
          <ProjectCover
            src={data.cover}
            className={data.cover ? "h-56 w-full sm:h-72" : "h-40 w-full"}
          />

          <div className="space-y-4 p-5 sm:p-6">
            <div className="space-y-1">
              {data.category && (
                <span className="inline-block rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-text">
                  {data.category}
                </span>
              )}

              <h1 className="text-2xl font-semibold tracking-tight text-text-strong">
                {data.title}
              </h1>

              <p className="text-sm text-text-subtle">
                {texts.projects.submittedBy(data.username ?? "")}
              </p>
            </div>

            {data.shortDescription && (
              <p className="text-sm font-medium text-text-strong">{data.shortDescription}</p>
            )}

            {data.description && (
              <p className="whitespace-pre-line break-words text-sm leading-relaxed text-text-subtle">
                {data.description}
              </p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-surface-2 px-2.5 py-1 text-xs text-text-subtle"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {data.url && (
                <a href={safeHref(data.url) ?? undefined} target="_blank" rel="noopener noreferrer">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                    <Globe className="h-4 w-4" />

                    <>{texts.projects.openProject}</>
                  </span>
                </a>
              )}

              {data.repoUrl && (
                <a
                  href={safeHref(data.repoUrl) ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="inline-flex items-center gap-2 rounded-full border border-border-soft px-4 py-2 text-sm font-medium text-text-strong">
                    <Code2 className="h-4 w-4" />

                    <>{texts.projects.openRepo}</>
                  </span>
                </a>
              )}
            </div>

            {data.status !== "PUBLISHED" && (
              <p className="text-xs text-text-subtle">{texts.projects.status[data.status]}</p>
            )}
          </div>
        </article>
      </div>
    </AppContainer>
  );
}

function BackLink() {
  return (
    <Link
      to="/projetos"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />

      <>{texts.projects.back}</>
    </Link>
  );
}
