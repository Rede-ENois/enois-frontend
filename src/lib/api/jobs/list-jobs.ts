import type { PageResponse } from "@/types/application/api/page-response";
import type { Job } from "@/types/application/job/job";
import type { ListJobsParams } from "@/types/application/job/list-jobs-params";
import { buildQuery } from "@/utils/build-query";

import { apiRequest } from "@/lib/api-request";

export function listJobs(params?: ListJobsParams) {
  return apiRequest<PageResponse<Job>>(
    "GET",
    `/jobs${buildQuery({
      ...params,
      cursor: params?.cursor ?? undefined,
      limit: params?.limit ?? 20,
    })}`,
  );
}
