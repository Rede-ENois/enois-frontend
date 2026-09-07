import { texts } from "@/texts";
import type { PostIdProps } from "@/types/components/post/post-id-props";
import { Root as Dialog } from "@radix-ui/react-dialog";

import { useReportDialogController } from "@/utils/components/post/use-report-dialog-controller";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportDialog({ postId }: PostIdProps) {
  const { open, setOpen, reason, reasonOptions, setReason, description, setDescription, submit } =
    useReportDialogController(postId);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.report.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-[11px] font-light text-text-subtle">{field.label}</Label>

              {field.control}
            </div>
          ))}

          <Button className="w-full rounded-full" onClick={submit}>
            {texts.posts.report.action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
