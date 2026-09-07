import { REPORT_REASONS } from "@/constants/report-reasons";

export function createReportReasonOptions() {
  return REPORT_REASONS.map((value) => ({
    value,
    label: value.replace(/_/g, " ").toLowerCase(),
  }));
}
