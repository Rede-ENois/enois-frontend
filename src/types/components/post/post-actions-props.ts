import type { PostEngagementActionsProps } from "./post-engagement-actions-props";
import type { ReactionActionProps } from "./reaction-action-props";

export type PostActionsProps = ReactionActionProps &
  PostEngagementActionsProps & {
    isSaved: boolean;
    onSave: () => void;
  };
