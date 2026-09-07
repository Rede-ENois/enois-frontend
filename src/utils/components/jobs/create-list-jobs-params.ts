import type { ListJobsParams } from "@/types/application/job/list-jobs-params";
import type { JobsFiltersProps } from "@/types/components/jobs/jobs-filters-props";

export function createListJobsParams(
  filters: Pick<JobsFiltersProps, "query" | "level" | "location" | "type" | "skills">,
): ListJobsParams {
  return {
    query: filters.query || undefined,
    level: filters.level || undefined,
    location: filters.location || undefined,
    type: filters.type || undefined,
    skills: filters.skills || undefined,
  };
}
