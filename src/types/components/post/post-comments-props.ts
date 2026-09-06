import type { FormEventHandler } from "react";

import type { CommentView, Profile } from "@/lib/api";

export type PostCommentsProps = {
  currentUser: Profile | null | undefined;
  comments: CommentView[];
  rootComments: CommentView[];
  commentContent: string;
  onDeleteComment: (commentId: string) => void;
  onReply: (comment: CommentView) => void;
  onCommentContentChange: (value: string, mentionedUserIds: string[]) => void;
  onSubmitComment: FormEventHandler<HTMLFormElement>;
};
