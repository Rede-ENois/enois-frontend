import type { ReportInput } from "@/types/application/report/report-input";
import type { ReportReason } from "@/types/application/report/report-reason";

import { api } from "../api-client";

export type { ReportInput } from "@/types/application/report/report-input";
export type { ReportReason } from "@/types/application/report/report-reason";

export const REPORT_REASONS = [
  "AI_GENERATED",
  "FAKE_CONTENT",
  "SCAM",
  "DISCRIMINATION",
  "PREJUDICE",
  "HARASSMENT",
  "SPAM",
  "VIOLENCE",
  "COPYRIGHT",
  "OTHER",
] as const satisfies readonly ReportReason[];

export const reportApi = {
  create: (input: ReportInput) => api.post<{ id: string; status: string }>("/reports", input),
};
