import { Root as Dialog } from "@radix-ui/react-dialog";

import { REPORT_REASONS } from "@/constants/report-reasons";
import { useReportDialogController } from "@/lib/use-report-dialog-controller";
import { texts } from "@/texts";
import type { ReportReason } from "@/types/application/report/report-reason";
import type { PostIdProps } from "@/types/components/post/post-id-props";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ReportDialog({ postId }: PostIdProps) {
  const { open, setOpen, reason, setReason, description, setDescription, submit } =
    useReportDialogController(postId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.report.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-light text-text-subtle">{texts.posts.report.reason}</Label>
            <select
              value={reason}
              onChange={(event) => setReason(event.target.value as ReportReason)}
              className="flex h-10 w-full rounded-md border border-border-soft bg-background px-3 py-2 text-[13px] font-light text-text-strong border-transparent bg-muted"
            >
              {REPORT_REASONS.map((reportReason) => (
                <option
                  key={reportReason}
                  value={reportReason}
                  className="h-10 border-transparent bg-muted"
                >
                  {reportReason.replace(/_/g, " ").toLowerCase()}
                </option>
              ))}
            </select>
          </div>
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
          <Button className="w-full rounded-full" onClick={submit}>
            {texts.posts.report.action}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
