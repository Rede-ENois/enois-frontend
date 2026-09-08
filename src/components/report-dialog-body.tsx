import { texts } from "@/texts";
import type { ReportDialogBodyProps } from "@/types/components/post/report-dialog-body-props";

import { Button } from "@/components/ui/button";

import { ReportDialogFields } from "@/components/report-dialog-fields";

export function ReportDialogBody(props: ReportDialogBodyProps) {
  return (
    <div className="space-y-4 pt-2">
      <ReportDialogFields {...props} />

      <Button className="w-full rounded-full" onClick={props.submit}>
        {texts.posts.report.action}
      </Button>
    </div>
  );
}
