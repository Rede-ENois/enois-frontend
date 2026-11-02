import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ProjectsManagerProps } from "@/types/components/profile/projects-manager-props";
import {
  type ProjectInput,
  ProjectsManager as ProjectsManagerView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { projectsApi } from "@/lib/api";
import { projectQueries } from "@/lib/query-options/projects";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * Gerenciador de projetos (dono do perfil): lista + editor, com a dualidade da
 * casa — preencher o formulário estruturado OU escrever o HTML do card (que o
 * backend sanitiza e o quadro isolado renderiza, como a bio e a capa).
 */
export function ProjectsManager({ open, onOpenChange, onSaved }: ProjectsManagerProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects = [] } = useQuery({
    ...projectQueries.profileMine(),
    enabled: open,
  });

  const salvar = useMutation({
    mutationFn: ({ id, input }: { id: string | undefined; input: ProjectInput }) =>
      id ? projectsApi.update(id, input) : projectsApi.create(input),
    onSuccess: () => {
      toast(texts.profile.projects.saved);
      void queryClient.invalidateQueries({ queryKey: projectQueries.all });
      onSaved();
    },
    onError: (error) => {
      toast(
        error instanceof Error && error.message.includes("20")
          ? error.message
          : texts.profile.projects.error,
        "error",
      );
    },
  });

  const excluir = useMutation({
    mutationFn: (id: string) => projectsApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectQueries.all });
      onSaved();
    },
  });

  return (
    <ProjectsManagerView
      open={open}
      onOpenChange={onOpenChange}
      projects={projects}
      savePending={salvar.isPending}
      onSave={async (id, input) => {
        try {
          await salvar.mutateAsync({ id, input });
          return true;
        } catch {
          return false;
        }
      }}
      onDelete={(id) => excluir.mutate(id)}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
    />
  );
}
