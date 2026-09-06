import type { PostView } from "@/types/application/feed/post-view";

export type ComposerPostTypeActionsProps = {
  postType: PostView["type"];
  onChange: (type: PostView["type"]) => void;
};
