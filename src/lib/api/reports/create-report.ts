import type { CreateReportResponse } from "@/types/application/report/create-report-response";
import type { ReportInput } from "@/types/application/report/report-input";

import { apiRequest } from "@/lib/api-request";

export function createReport(data: ReportInput) {
  return apiRequest<CreateReportResponse>("POST", "/reports", data, { idempotent: true });
}
