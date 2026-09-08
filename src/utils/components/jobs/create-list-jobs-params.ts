import type { ListJobsParams } from "@/types/application/job/list-jobs-params";
import type { JobsFilterValues } from "@/types/components/jobs/jobs-filter-values";

export function createListJobsParams(filters: JobsFilterValues): ListJobsParams {
  return {
    query: filters.query || undefined,
    level: filters.level || undefined,
    location: filters.location || undefined,
    type: filters.type || undefined,
    skills: filters.skills || undefined,
  };
}
