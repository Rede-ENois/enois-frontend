import type { PostCardProps } from "@/types/components/post/post-card-props";

import { usePostActionsController } from "@/utils/components/post/use-post-actions-controller";

import { PostActionButtons } from "@/components/post-action-buttons";
import { PostActionPanels } from "@/components/post-action-panels";
import { PostReactionControls } from "@/components/post-reaction-controls";

export function PostActions({ post }: PostCardProps) {
  const controller = usePostActionsController({ post });

  return (
    <>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <PostReactionControls
          active={controller.reactionActive}
          emoji={controller.reactionEmoji}
          title={controller.reactionTitle}
          options={controller.reactionOptions}
          count={controller.postCounters.reactions}
          onOpen={controller.openReactions}
        />

        <PostActionButtons
          comments={controller.postCounters.comments}
          saves={controller.postCounters.saves}
          saved={controller.saved}
          onToggleComments={controller.toggleComments}
          onShare={controller.sharePost}
          onReport={controller.openReport}
          onToggleSave={controller.toggleSave}
        />
      </footer>

      <PostActionPanels postId={post.id} showComments={controller.showComments} />
    </>
  );
}
