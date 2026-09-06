import type { FormEventHandler, ReactNode } from "react";

import type { CommentView, PostView, Profile } from "@/lib/api";

import type { PostProps } from "./post-props";
import type { ReactionActionProps } from "./reaction-action-props";

export type PostCardViewProps = PostProps &
  ReactionActionProps & {
    currentUser: Profile | null | undefined;
    counters: PostView["counters"];
    isSaved: boolean;
    areCommentsVisible: boolean;
    comments: CommentView[];
    rootComments: CommentView[];
    commentContent: string;
    reactionSummary: ReactNode;
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
