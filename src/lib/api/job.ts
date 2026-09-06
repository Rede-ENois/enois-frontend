import type { Job } from "@/types/application/job/job";
import type { ListJobsOptions } from "@/types/application/job/list-jobs-options";
import type { PageResponse } from "@/types/application/pagination/page-response";

import { api, buildQuery } from "../api-client";

export type { Job } from "@/types/application/job/job";
export type { ListJobsOptions } from "@/types/application/job/list-jobs-options";

export const jobApi = {
  list: (options?: ListJobsOptions) =>
    api.get<PageResponse<Job>>(
      `/jobs${buildQuery({
        ...options,
        cursor: options?.cursor ?? undefined,
        limit: options?.limit ?? 20,
      })}`,
    ),

  getById: (jobId: string) => api.get<Job>(`/jobs/${jobId}`),

  apply: (jobId: string) => api.post<{ status: string }>(`/jobs/${jobId}/applications`),

  save: (jobId: string) => api.post<{ status: string }>(`/jobs/${jobId}/saves`),

  unsave: (jobId: string) => api.delete<{ status: string }>(`/jobs/${jobId}/saves`),
};
