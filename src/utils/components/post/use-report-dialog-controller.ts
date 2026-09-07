import { useState } from "react";

import { REPORT_REASONS } from "@/constants/report-reasons";
import { usePostCardStore } from "@/stores/post-card.store";
import type { ReportReason } from "@/types/application/report/report-reason";

import { createReport } from "@/lib/api/reports";

export function useReportDialogController(postId: string) {
  const open = usePostCardStore((state) => state.cards[postId]?.showReport ?? false);
  const setShowReport = usePostCardStore((state) => state.setShowReport);
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [description, setDescription] = useState("");

  const submit = async () => {
    try {
      await createReport({
        targetId: postId,
        targetType: "POST",
        reason,
        description: description || undefined,
      });
      setShowReport(postId, false);
      setDescription("");
    } catch {
      // Preserve the existing silent failure behavior.
    }
  };

  const setReasonFromValue = (value: string) => {
    const nextReason = REPORT_REASONS.find((item) => item === value);
    if (nextReason) setReason(nextReason);
  };

  return {
    open,
    setOpen: (nextOpen: boolean) => setShowReport(postId, nextOpen),
    reason,
    reasonOptions: REPORT_REASONS.map((value) => ({
      value,
      label: value.replace(/_/g, " ").toLowerCase(),
    })),
    setReason: setReasonFromValue,
    description,
    setDescription,
    submit,
  };
}
