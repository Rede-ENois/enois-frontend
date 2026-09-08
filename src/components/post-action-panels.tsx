import { PostCommentsProvider } from "@/components/post-comments-provider";
import { ReportDialogProvider } from "@/components/post-report-dialog-provider";
import { ReactionsDialogProvider } from "@/components/reactions-dialog-provider";

export function PostActionPanels() {
  return (
    <>
      <ReactionsDialogProvider />
      <ReportDialogProvider />
      <PostCommentsProvider />
    </>
  );
}
