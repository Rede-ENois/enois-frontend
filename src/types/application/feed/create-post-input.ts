import type { PostView } from "./post-view";

export type CreatePostInput = {
  type: PostView["type"];
  content: string;
  tags?: string[];
  mediaIds?: string[];
  mentionedUserIds?: string[];
  communityId?: string;
};
