import type { ChangeEvent } from "react";

import { createReportReasonOptions } from "@/utils/components/post/create-report-reason-options";
import { createSubmitPostReport } from "@/utils/components/post/create-submit-post-report";
import { useReportDialogState } from "@/utils/components/post/use-report-dialog-state";

export function useReportDialogController(postId: string) {
  const dialog = useReportDialogState(postId);
  const submit = createSubmitPostReport(postId, dialog.reason, dialog.description, () => {
    dialog.setOpen(false);
    dialog.clearDescription();
  });

  const handleReasonChange = (event: ChangeEvent<HTMLSelectElement>) => {
    dialog.setReason(event.target.value);
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    dialog.setDescription(event.target.value);
  };

  return {
    open: dialog.open,
    setOpen: dialog.setOpen,
    reason: dialog.reason,
    reasonOptions: createReportReasonOptions(),
    handleReasonChange,
    description: dialog.description,
    handleDescriptionChange,
    submit,
  };
}
