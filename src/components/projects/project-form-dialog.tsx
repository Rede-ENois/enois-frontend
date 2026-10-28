import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { CommunityProjectView } from "@/types/application/projects/community-project-view";
import {
  ProjectFormDialog as ProjectFormDialogView,
  type ProjectFormValues,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { communityProjectsApi } from "@/lib/api";

/** Criar/editar projeto: mesma ficha do card e da página, sem mexer nos campos de jogo. */
export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: CommunityProjectView | null;
  onSaved?: (project: CommunityProjectView) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (form: ProjectFormValues) => {
      const data = {
        title: form.title,
        shortDescription: form.shortDescription,
        description: form.description,
        url: form.url,
        repoUrl: form.repoUrl,
        tags: form.tags,
        category: form.category,
        slug: form.slug,
        cover: form.cover,
      };
      return project
        ? communityProjectsApi.edit(project.id, data)
        : communityProjectsApi.submit(data);
    },
    onSuccess: (saved) => {
      toast(project ? texts.projects.editor.updated : texts.projects.editor.sent, "success");
      void queryClient.invalidateQueries({ queryKey: ["projects"] });
      onSaved?.(saved);
      onOpenChange(false);
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.projects.editor.error, "error"),
  });

  return (
    <ProjectFormDialogView
      open={open}
      onOpenChange={onOpenChange}
      project={project}
      savePending={save.isPending}
      onSave={(form) => save.mutate(form)}
    />
  );
}
