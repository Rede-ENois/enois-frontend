import { ReactionsDialogContext } from "@/utils/components/post/reactions-dialog-context";
import { usePostCardContext } from "@/utils/components/post/use-post-card-context";
import { useReactionsDialogController } from "@/utils/components/post/use-reactions-dialog-controller";

import { ReactionsDialog } from "@/components/reactions-dialog";

export function ReactionsDialogProvider() {
  const { post } = usePostCardContext();
  const controller = useReactionsDialogController(post.id);

  return (
    <ReactionsDialogContext.Provider value={controller}>
      <ReactionsDialog />
    </ReactionsDialogContext.Provider>
  );
}
