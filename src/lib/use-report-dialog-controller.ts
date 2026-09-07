import { useState } from "react";

import { createReport } from "@/lib/api/reports";
import { usePostCardStore } from "@/stores/post-card.store";
import type { ReportReason } from "@/types/application/report/report-reason";

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
      // silently fail
    }
  };

  return {
    open,
    setOpen: (nextOpen: boolean) => setShowReport(postId, nextOpen),
    reason,
    setReason,
    description,
    setDescription,
    submit,
  };
}
