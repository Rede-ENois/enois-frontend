import { useState } from "react";

import type { PostView } from "@/types/application/feed/post-view";

export function useFeedComposerFormState() {
  const [draft, setDraft] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostView["type"]>("INSIGHT");

  const handleDraftChange = (value: string, userIds: string[]) => {
    setDraft(value);
    setMentionedUserIds(userIds);
  };

  const reset = () => {
    setDraft("");
    setMentionedUserIds([]);
    setPostType("INSIGHT");
  };

  return {
    draft,
    mentionedUserIds,
    postType,
    setPostType,
    handleDraftChange,
    reset,
  };
}
