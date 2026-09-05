import type { FormEventHandler, ReactNode } from "react";

import type { CommentView, PostView, Profile, ReactionType } from "@/lib/api";

export type PostCardViewProps = {
  post: PostView;
  currentUser: Profile | null | undefined;
  counters: PostView["counters"];
  reactionStatus: string | null;
  saved: boolean;
  showComments: boolean;
  comments: CommentView[];
  rootComments: CommentView[];
  draft: string;
  reactionSummary: ReactNode;
  onReaction: (type: ReactionType) => void;
  onOpenReactions: () => void;
  onToggleComments: () => void;
  onShare: () => void;
  onReport: () => void;
  onSave: () => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (comment: CommentView) => void;
  onDraftChange: (value: string, mentionedUserIds: string[]) => void;
  onSubmitComment: FormEventHandler<HTMLFormElement>;
};
