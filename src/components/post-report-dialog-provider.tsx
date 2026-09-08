import { ReportDialogContext } from "@/utils/components/post/report-dialog-context";
import { usePostCardContext } from "@/utils/components/post/use-post-card-context";
import { useReportDialogController } from "@/utils/components/post/use-report-dialog-controller";

import { ReportDialog } from "@/components/post-report-dialog";

export function ReportDialogProvider() {
  const { post } = usePostCardContext();
  const controller = useReportDialogController(post.id);

  return (
    <ReportDialogContext.Provider value={controller}>
      <ReportDialog />
    </ReportDialogContext.Provider>
  );
}
