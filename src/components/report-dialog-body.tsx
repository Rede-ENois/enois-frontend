import { texts } from "@/texts";
import { useReportDialogContext } from "@/utils/components/post/use-report-dialog-context";

import { Button } from "@/components/ui/button";

import { ReportDescriptionField } from "@/components/report-description-field";
import { ReportReasonField } from "@/components/report-reason-field";

export function ReportDialogBody() {
  const { submit } = useReportDialogContext();

  return (
    <div className="space-y-4 pt-2">
      <ReportReasonField />
      <ReportDescriptionField />

      <Button className="w-full rounded-full" onClick={submit}>
        {texts.posts.report.action}
      </Button>
    </div>
  );
}
