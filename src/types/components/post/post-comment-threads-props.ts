import type { PostCommentThread } from "@/types/components/post/post-comment-thread";

export type PostCommentThreadsProps = {
  threads: PostCommentThread[];
  showEmptyState: boolean;
};
