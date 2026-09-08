import { texts } from "@/texts";
import type { PostIdProps } from "@/types/components/post/post-id-props";
import { useReportDialogController } from "@/utils/components/post/use-report-dialog-controller";
import { Root as Dialog } from "@radix-ui/react-dialog";

import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";

import { ReportDialogBody } from "@/components/report-dialog-body";

export function ReportDialog({ postId }: PostIdProps) {
  const controller = useReportDialogController(postId);

  return (
    <Dialog open={controller.open} onOpenChange={controller.setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-light">{texts.posts.report.title}</DialogTitle>
        </DialogHeader>

        <ReportDialogBody
          reason={controller.reason}
          reasonOptions={controller.reasonOptions}
          setReason={controller.setReason}
          description={controller.description}
          setDescription={controller.setDescription}
          submit={controller.submit}
        />
      </DialogContent>
    </Dialog>
  );
}
