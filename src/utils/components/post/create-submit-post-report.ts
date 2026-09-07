import type { ReportReason } from "@/types/application/report/report-reason";

import { createReport } from "@/lib/api/reports";

export function createSubmitPostReport(
  postId: string,
  reason: ReportReason,
  description: string,
  onSubmitted: () => void,
) {
  return async () => {
    try {
      await createReport({
        targetId: postId,
        targetType: "POST",
        reason,
        description: description || undefined,
      });
      onSubmitted();
    } catch {
      // Preserve the existing silent failure behavior.
    }
  };
}
