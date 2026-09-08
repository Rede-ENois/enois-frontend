import { texts } from "@/texts";
import { useReportDialogContext } from "@/utils/components/post/use-report-dialog-context";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportDescriptionField() {
  const { description, setDescription } = useReportDialogContext();

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-light text-text-subtle">
        {texts.posts.report.description}
      </Label>

      <Textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        rows={3}
        className="border-border-soft bg-surface-1 text-[13px] font-light h-10 border-transparent bg-muted"
      />
    </div>
  );
}
