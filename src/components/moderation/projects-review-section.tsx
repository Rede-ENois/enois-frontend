import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { ProjectsReviewSection as ProjectsReviewSectionView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { communityProjectsApi } from "@/lib/api";

/** Fila de projetos enviados pela comunidade: mesma revisão dos jogos, em espaço próprio. */
export function ProjectsReviewSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const pending = useQuery({
    queryKey: ["moderator", "projects"],
    queryFn: () => communityProjectsApi.pending(30),
    retry: false,
  });

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["moderator", "projects"] });

  const approve = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | undefined }) =>
      communityProjectsApi.approve(id, note),
    onSuccess: () => {
      toast(texts.moderator.projects.approved, "success");
      refresh();
    },
    onError: () => toast(texts.moderator.projects.error, "error"),
  });

  const reject = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string | undefined }) =>
      communityProjectsApi.reject(id, note?.trim() || ""),
    onSuccess: () => {
      toast(texts.moderator.projects.rejected, "success");
      refresh();
    },
    onError: () => toast(texts.moderator.projects.error, "error"),
  });

  return (
    <ProjectsReviewSectionView
      loading={pending.isLoading}
      error={pending.isError}
      projects={pending.data ?? []}
      approvePending={approve.isPending}
      rejectPending={reject.isPending}
      onApprove={(id, note) => approve.mutate({ id, note })}
      onReject={(id, note) => reject.mutate({ id, note })}
    />
  );
}
