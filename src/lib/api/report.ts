import type { ReportInput, ReportReason } from "@/types/application/report/report";

import { api } from "../api-client";

export type { ReportInput, ReportReason } from "@/types/application/report/report";

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
