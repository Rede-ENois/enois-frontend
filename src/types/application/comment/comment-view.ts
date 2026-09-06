export type CommentView = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  parentCommentId: string | null;
  content: string;
  createdAt: string;
  status: "ACTIVE" | "DELETED";
};
