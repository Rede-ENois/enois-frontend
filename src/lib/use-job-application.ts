import { useMutation, useQueryClient } from "@tanstack/react-query";

import { applyToJob } from "@/lib/api/jobs/apply-to-job";

export function useJobApplication(jobId: string) {
  const queryClient = useQueryClient();
  const apply = useMutation({
    mutationFn: () => applyToJob(jobId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  return { apply: () => apply.mutate(), applying: apply.isPending };
}
