import { createReportReasonOptions } from "@/utils/components/post/create-report-reason-options";
import { createSubmitPostReport } from "@/utils/components/post/create-submit-post-report";
import { useReportDialogState } from "@/utils/components/post/use-report-dialog-state";

export function useReportDialogController(postId: string) {
  const dialog = useReportDialogState(postId);
  const submit = createSubmitPostReport(postId, dialog.reason, dialog.description, () => {
    dialog.setOpen(false);
    dialog.clearDescription();
  });

  return {
    open: dialog.open,
    setOpen: dialog.setOpen,
    reason: dialog.reason,
    reasonOptions: createReportReasonOptions(),
    setReason: dialog.setReason,
    description: dialog.description,
    setDescription: dialog.setDescription,
    submit,
  };
}
