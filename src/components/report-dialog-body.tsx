import { texts } from "@/texts";
import { useReportDialogContext } from "@/utils/components/post/use-report-dialog-context";

import { Button } from "@/components/ui/button";

import { ReportDialogFields } from "@/components/report-dialog-fields";

export function ReportDialogBody() {
  const { submit } = useReportDialogContext();

  return (
    <div className="space-y-4 pt-2">
      <ReportDialogFields />

      <Button className="w-full rounded-full" onClick={submit}>
        {texts.posts.report.action}
      </Button>
    </div>
  );
}
