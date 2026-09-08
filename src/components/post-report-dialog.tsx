import { texts } from "@/texts";
import { useReportDialogContext } from "@/utils/components/post/use-report-dialog-context";
import { Root as Dialog } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ReportDialogBody } from "@/components/report-dialog-body";

export function ReportDialog() {
  const { open, setOpen } = useReportDialogContext();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.report.title}</DialogTitle>
        </DialogHeader>

        <ReportDialogBody />
      </DialogContent>
    </Dialog>
  );
}
