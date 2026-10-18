import type { Dispatch, SetStateAction } from "react";

import type { PostView } from "@/types/application/feed/post-view";

export type Props = {
  draft: string;
  setDraft: Dispatch<SetStateAction<string>>;
  articleBody: string;
  setArticleBody: Dispatch<SetStateAction<string>>;
  mentionedUserIds: string[];
  setMentionedUserIds: Dispatch<SetStateAction<string[]>>;
  postType: PostView["type"];
  setPostType: Dispatch<SetStateAction<PostView["type"]>>;
  setTypePickerOpen: Dispatch<SetStateAction<boolean>>;
};
