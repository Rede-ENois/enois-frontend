import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { CommunityProjectView } from "@/types/application/projects/community-project-view";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  LoadingState,
  useToast,
} from "@rede-enois/design-system/ui";
import { ArrowLeft, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

import { communityProjectsApi } from "@/lib/api";
import { projectQueries } from "@/lib/query-options/projects";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { ProjectFormDialog } from "@/components/projects/project-form-dialog";

export const Route = createFileRoute("/projetos/painel")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.projects.panel.title }] }),
  component: ProjectsPanel,
});

function ProjectsPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommunityProjectView | null>(null);
  const [removing, setRemoving] = useState<CommunityProjectView | null>(null);

  const mine = useQuery({
    ...projectQueries.communityMine(),
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: projectQueries.all });

  const resubmit = useMutation({
    mutationFn: (projectId: string) => communityProjectsApi.resubmit(projectId),
    onSuccess: () => {
      toast(texts.projects.editor.sent, "success");
      refresh();
    },
    onError: () => toast(texts.projects.editor.error, "error"),
  });

  const remove = useMutation({
    mutationFn: (projectId: string) => communityProjectsApi.remove(projectId),
    onSuccess: () => {
      setRemoving(null);
      toast(texts.projects.panel.removed, "success");
      refresh();
    },
    onError: () => toast(texts.projects.editor.error, "error"),
  });

  if (mine.isLoading) {
    return (
      <AppContainer>
        <LoadingState />
      </AppContainer>
    );
  }

  const items = mine.data ?? [];

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Link
          to="/projetos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.projects.back}</>
        </Link>

        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">{texts.projects.panel.title}</h1>

            <p className="text-sm text-text-subtle">{texts.projects.panel.description}</p>
          </div>

          <Button
            className="w-auto rounded-full gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />

            <>{texts.projects.submit}</>
          </Button>
        </header>

        {items.length === 0 ? (
          <div className="surface-card">
            <EmptyState
              icon={Plus}
              title={texts.projects.empty}
              description={texts.projects.emptyHint}
            />
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((project) => (
              <li key={project.id} className="surface-card space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-text-strong">{project.title}</h2>

                    <p className="text-xs text-text-subtle">
                      {texts.projects.status[project.status]}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {project.status === "REJECTED" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-auto rounded-full gap-1.5"
                        disabled={resubmit.isPending}
                        onClick={() => resubmit.mutate(project.id)}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />

                        <>{texts.projects.panel.resubmit}</>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-auto rounded-full gap-1.5"
                      onClick={() => {
                        setEditing(project);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />

                      <>{texts.projects.editor.editTitle}</>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-auto rounded-full gap-1.5 text-destructive"
                      onClick={() => setRemoving(project)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />

                      <>{texts.projects.panel.remove}</>
                    </Button>
                  </div>
                </div>

                {project.status === "REJECTED" && project.reviewNote && (
                  <p className="text-xs text-destructive">
                    {texts.projects.panel.reviewNote(project.reviewNote)}
                  </p>
                )}

                {project.shortDescription && (
                  <p className="line-clamp-2 text-sm text-text-subtle">
                    {project.shortDescription}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        <ProjectFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          project={editing}
          onSaved={refresh}
        />
        <ConfirmDialog
          open={removing !== null}
          onOpenChange={(open) => !open && setRemoving(null)}
          title={texts.projects.panel.remove}
          description={removing?.title ?? ""}
          confirmLabel={texts.projects.panel.remove}
          destructive
          pending={remove.isPending}
          onConfirm={() => removing && remove.mutate(removing.id)}
        />
      </div>
    </AppContainer>
  );
}
