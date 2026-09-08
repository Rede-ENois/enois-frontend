import { Bookmark, Flag, MessageSquare, Share2 } from "lucide-react";

import { texts } from "@/texts";
import { usePostActionsContext } from "@/utils/components/post/use-post-actions-context";

export function PostActionButtons() {
  const { postCounters, saved, toggleComments, sharePost, openReport, toggleSave } =
    usePostActionsContext();
  const actions = [
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
  ];

  return (
    <>
      <div className="flex">
        {actions.map((action) => (
          <button
            key={action.key}
            onClick={action.onClick}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
              action.muted ? "text-muted-foreground" : ""
            }`}
          >
            <action.icon className="h-4 w-4" />

            {action.label !== null && <>{action.label}</>}
          </button>
        ))}
      </div>

      <button
        onClick={toggleSave}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
          saved ? "text-primary" : ""
        }`}
      >
        <Bookmark className="h-4 w-4" />

        <>{postCounters.saves}</>
      </button>
    </>
  );
}
