import { Bookmark, Flag, MessageSquare, Share2 } from "lucide-react";

import { texts } from "@/texts";
import type { PostActionButtonsProps } from "@/types/components/post/post-action-buttons-props";

export function PostActionButtons({
  comments,
  saves,
  saved,
  onToggleComments,
  onShare,
  onReport,
  onToggleSave,
}: PostActionButtonsProps) {
  const actions = [
    {
      key: "comments",
      icon: MessageSquare,
      label: comments,
      onClick: onToggleComments,
      muted: false,
    },
    {
      key: "share",
      icon: Share2,
      label: texts.posts.share,
      onClick: onShare,
      muted: false,
    },
    {
      key: "report",
      icon: Flag,
      label: null,
      onClick: onReport,
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
        onClick={onToggleSave}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
          saved ? "text-primary" : ""
        }`}
      >
        <Bookmark className="h-4 w-4" />

        <>{saves}</>
      </button>
    </>
  );
}
