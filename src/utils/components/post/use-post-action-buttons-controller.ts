import { texts } from "@/texts";
import { usePostActionsContext } from "@/utils/components/post/use-post-actions-context";
import { Bookmark, Flag, MessageSquare, Share2 } from "lucide-react";

export function usePostActionButtonsController() {
  const { postCounters, saved, toggleComments, sharePost, openReport, toggleSave } =
    usePostActionsContext();

  return {
    primaryActions: [
      {
        key: "comments",
        icon: MessageSquare,
        label: postCounters.comments,
        onClick: toggleComments,
        muted: false,
      },
      {
        key: "share",
        icon: Share2,
        label: texts.posts.share,
        onClick: sharePost,
        muted: false,
      },
      {
        key: "report",
        icon: Flag,
        label: null,
        onClick: openReport,
        muted: true,
      },
    ],
    saveAction: {
      icon: Bookmark,
      label: postCounters.saves,
      onClick: toggleSave,
      active: saved,
    },
  };
}
