import { PostActionButtons } from "@/components/post-action-buttons";
import { PostActionPanels } from "@/components/post-action-panels";
import { PostReactionControls } from "@/components/post-reaction-controls";

export function PostActions() {
  return (
    <>
      <footer className="mt-4 flex flex-wrap items-center justify-between gap-1 border-t border-border pt-3 text-sm text-muted-foreground">
        <PostReactionControls />
        <PostActionButtons />
      </footer>

      <PostActionPanels />
    </>
  );
}
