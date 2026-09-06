import type { ReportReason } from "./report-reason";

export type ReportInput = {
  targetId: string;
  targetType: "POST" | "COMMENT" | "USER";
  reason: ReportReason;
  description?: string;
};
