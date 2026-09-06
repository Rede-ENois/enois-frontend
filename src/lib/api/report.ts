import { api } from "../api-client";

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
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export interface ReportInput {
  targetId: string;
  targetType: "POST" | "COMMENT" | "USER";
  reason: ReportReason;
  description?: string;
}

export const reportApi = {
  create: (input: ReportInput) => api.post<{ id: string; status: string }>("/reports", input),
};
