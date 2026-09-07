import type { PageResponse } from "@/types/application/api/page-response";
import type { StatusResponse } from "@/types/application/api/status-response";
import type { Job } from "@/types/application/job/job";
import type { ListJobsParams } from "@/types/application/job/list-jobs-params";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "../api-request";

export const jobsApi = {
  list: (params?: ListJobsParams) => apiRequest<PageResponse<Job>>("GET", `/jobs${buildQuery({ ...params, cursor: params?.cursor ?? undefined, limit: params?.limit ?? 20 })}`),
  get: (jobId: string) => apiRequest<Job>("GET", `/jobs/${jobId}`),
  apply: (jobId: string) => apiRequest<StatusResponse>("POST", `/jobs/${jobId}/applications`, undefined, { idempotent: true }),
  save: (jobId: string) => apiRequest<StatusResponse>("POST", `/jobs/${jobId}/saves`, undefined, { idempotent: true }),
  removeSave: (jobId: string) => apiRequest<StatusResponse>("DELETE", `/jobs/${jobId}/saves`, null, { idempotent: true }),
};
