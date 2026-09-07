import type { CreateReportResponse } from "@/types/application/report/create-report-response";
import type { ReportInput } from "@/types/application/report/report-input";

import { apiRequest } from "../api-request";

export const reportsApi = {
  create: (data: ReportInput) => apiRequest<CreateReportResponse>("POST", "/reports", data, { idempotent: true }),
};
