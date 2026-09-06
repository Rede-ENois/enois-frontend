import type { FormEventHandler } from "react";

import type { CommentView } from "@/types/application/comment/comment-view";
import type { Profile } from "@/types/application/profile/profile";

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
