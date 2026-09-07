import type { StatusResponse } from "@/types/application/api/status-response";

import { apiRequest } from "@/lib/api-request";

export function applyToJob(jobId: string) {
  return apiRequest<StatusResponse>("POST", `/jobs/${jobId}/applications`, undefined, {
    idempotent: true,
  });
}
