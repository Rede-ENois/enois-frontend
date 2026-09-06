import type { ReactNode } from "react";

import type { PostView } from "@/types/application/feed/post-view";

import type { PostActionsProps } from "./post-actions-props";
import type { PostCommentsProps } from "./post-comments-props";

export type PostCardViewProps = PostActionsProps &
  PostCommentsProps & {
    post: PostView;
    areCommentsVisible: boolean;
    reactionSummary: ReactNode;
  };
