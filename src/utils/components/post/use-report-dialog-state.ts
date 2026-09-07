import { useState } from "react";

import { REPORT_REASONS } from "@/constants/report-reasons";
import { usePostCardStore } from "@/stores/post-card.store";
import type { ReportReason } from "@/types/application/report/report-reason";

export function useReportDialogState(postId: string) {
  const open = usePostCardStore((state) => state.cards[postId]?.showReport ?? false);
  const setShowReport = usePostCardStore((state) => state.setShowReport);
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [description, setDescription] = useState("");

  return {
    open,
    setOpen: (nextOpen: boolean) => setShowReport(postId, nextOpen),
    reason,
    setReason: (value: string) => {
      const nextReason = REPORT_REASONS.find((item) => item === value);
      if (nextReason) setReason(nextReason);
    },
    description,
    setDescription,
    clearDescription: () => setDescription(""),
  };
}
