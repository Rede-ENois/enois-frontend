import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Job } from "@/types/application/job/job";
import { formatPostedAt } from "@/utils/format-posted-at";

import { applyToJob } from "@/lib/api/jobs/apply-to-job";

export function useJobCardController(job: Job) {
  const queryClient = useQueryClient();
  const apply = useMutation({
    mutationFn: () => applyToJob(job.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });

  return {
    companyInitial: job.company[0],
    postedAtLabel: formatPostedAt(job.postedAt),
    matchLabel: job.matchScore ? texts.jobs.match(job.matchScore) : null,
    showSalary: Boolean(job.salary),
    apply: () => apply.mutate(),
    applying: apply.isPending,
  };
}
