import { texts } from "@/texts";
import type { ReportDialogFieldsProps } from "@/types/components/post/report-dialog-fields-props";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportDialogFields({
  reason,
  reasonOptions,
  setReason,
  description,
  setDescription,
}: ReportDialogFieldsProps) {
  const fields = [
    {
      key: "reason",
      label: texts.posts.report.reason,
      control: (
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
      ),
    },
    {
      key: "description",
      label: texts.posts.report.description,
      control: (
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="border-border-soft bg-surface-1 text-[13px] font-light h-10 border-transparent bg-muted"
        />
      ),
    },
  ];

  return (
    <>
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-[11px] font-light text-text-subtle">{field.label}</Label>
          {field.control}
        </div>
      ))}
    </>
  );
}
