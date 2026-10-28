import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Button, EmptyState, Input, useToast } from "@rede-enois/design-system/ui";
import { FolderKanban, Globe } from "lucide-react";

import { communityProjectsApi } from "@/lib/api";
import { safeHref } from "@/lib/safe-url";

import { ListRowSkeletons } from "@/components/skeletons/list-row-skeletons";

/** Fila de projetos enviados pela comunidade: mesma revisão dos jogos, em espaço próprio. */
export function ProjectsReviewSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const pending = useQuery({
    queryKey: ["moderator", "projects"],
    queryFn: () => communityProjectsApi.pending(30),
    retry: false,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["moderator", "projects"] });

  const approve = useMutation({
    mutationFn: (id: string) => communityProjectsApi.approve(id, notes[id]),
    onSuccess: () => {
      toast(texts.moderator.projects.approved, "success");
      refresh();
    },
    onError: () => toast(texts.moderator.projects.error, "error"),
  });

  const reject = useMutation({
    mutationFn: (id: string) => communityProjectsApi.reject(id, notes[id]?.trim() || ""),
    onSuccess: () => {
      toast(texts.moderator.projects.rejected, "success");
      refresh();
    },
    onError: () => toast(texts.moderator.projects.error, "error"),
  });

  if (pending.isLoading) return <ListRowSkeletons />;
  if (pending.isError)
    return <p className="text-sm text-destructive">{texts.moderator.projects.error}</p>;

  const items = pending.data ?? [];

  return (
    <section className="space-y-4">
      <div className="surface-card space-y-1 p-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FolderKanban className="h-5 w-5 text-primary" />

          <>{texts.moderator.projects.title}</>
        </h2>

        <p className="text-sm text-text-subtle">{texts.moderator.projects.description}</p>
      </div>

      {items.length === 0 ? (
        <div className="surface-card">
          <EmptyState icon={FolderKanban} title={texts.moderator.projects.empty} />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((project) => (
            <li key={project.id} className="surface-card space-y-3 p-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-text-strong">{project.title}</h3>

                <p className="break-words text-xs text-text-subtle">
                  @{project.username} · {project.category ?? texts.moderator.projects.noCategory}
                </p>

                {project.shortDescription && (
                  <p className="text-sm text-text-subtle">{project.shortDescription}</p>
                )}

                <div className="flex flex-wrap gap-3 pt-1 text-xs">
                  {project.url && (
                    <a
                      href={safeHref(project.url) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />

                      <>{texts.moderator.projects.openProject}</>
                    </a>
                  )}

                  {project.repoUrl && (
                    <a
                      href={safeHref(project.repoUrl) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {texts.moderator.projects.openRepo}
                    </a>
                  )}
                </div>
              </div>

              <Input
                value={notes[project.id] ?? ""}
                onChange={(event) =>
                  setNotes((current) => ({ ...current, [project.id]: event.target.value }))
                }
                placeholder={texts.moderator.projects.notePlaceholder}
                maxLength={500}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="w-auto rounded-full"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate(project.id)}
                >
                  {texts.moderator.projects.approve}
                </Button>

                <Button
                  variant="destructive"
                  size="sm"
                  className="w-auto rounded-full"
                  disabled={reject.isPending || (notes[project.id] ?? "").trim().length < 3}
                  onClick={() => reject.mutate(project.id)}
                >
                  {texts.moderator.projects.reject}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
