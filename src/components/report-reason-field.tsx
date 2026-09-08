import { texts } from "@/texts";
import { useReportDialogContext } from "@/utils/components/post/use-report-dialog-context";

import { Label } from "@/components/ui/label";

export function ReportReasonField() {
  const { reason, reasonOptions, setReason } = useReportDialogContext();

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-light text-text-subtle">{texts.posts.report.reason}</Label>

      <select
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="flex h-10 w-full rounded-md border border-border-soft bg-background px-3 py-2 text-[13px] font-light text-text-strong border-transparent bg-muted"
      >
        {reasonOptions.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="h-10 border-transparent bg-muted"
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
