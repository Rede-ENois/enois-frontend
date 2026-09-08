import { PostActionsProvider } from "@/components/post-actions-provider";
import { PostCardContent } from "@/components/post-card-content";
import { PostCardHeader } from "@/components/post-card-header";

export function PostCard() {
  return (
    <article className="min-w-0 rounded-2xl border border-border-soft bg-surface-card p-4 transition sm:p-5">
      <PostCardHeader />
      <PostCardContent />
      <PostActionsProvider />
    </article>
  );
}
