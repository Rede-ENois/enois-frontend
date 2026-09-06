import type { FormEventHandler, ReactNode } from "react";

import type { CommentView, PostView, Profile, ReactionType } from "@/lib/api";

export type PostCardViewProps = {
  post: PostView;
  currentUser: Profile | null | undefined;
  counters: PostView["counters"];
  currentReaction: string | null;
  isSaved: boolean;
  areCommentsVisible: boolean;
  comments: CommentView[];
  rootComments: CommentView[];
  commentContent: string;
  reactionSummary: ReactNode;
  onReaction: (type: ReactionType) => void;
  onOpenReactions: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
  onSave: () => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (comment: CommentView) => void;
  onCommentContentChange: (value: string, mentionedUserIds: string[]) => void;
  onSubmitComment: FormEventHandler<HTMLFormElement>;
};
