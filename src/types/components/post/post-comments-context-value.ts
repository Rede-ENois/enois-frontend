import type { PostCommentThread } from "@/types/components/post/post-comment-thread";

export type PostCommentsContextValue = {
  postId: string;
  showComments: boolean;
  showEmptyState: boolean;
  threads: PostCommentThread[];
};
