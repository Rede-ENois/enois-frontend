import { useEffect, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { UseAcceptedAnswerResult } from "@/types/lib/feed/use-accepted-answer-result";
import { useToast } from "@rede-enois/design-system/ui";

import { feedApi } from "@/lib/api";
import { updatePostInQueryCache } from "@/lib/feed/post-query-cache";

/**
 * Accepted answer of a QUESTION post, optimistic: the badge and the order move on tap, the post
 * caches follow, and everything rolls back if the API refuses. The state is local because the post
 * can come from lists outside the feed caches (profile, saved, community).
 */
export function useAcceptedAnswer(
  postId: string,
  serverAcceptedId: string | null,
): UseAcceptedAnswerResult {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [acceptedId, setAcceptedId] = useState(serverAcceptedId);
  const [pending, setPending] = useState(false);

  // A refetch (or another card of the same post) brings the server's answer.
  useEffect(() => setAcceptedId(serverAcceptedId), [serverAcceptedId]);

  const apply = (next: string | null) => {
    setAcceptedId(next);
    updatePostInQueryCache(queryClient, postId, (post) => ({
      ...post,
      acceptedCommentId: next,
      resolved: next != null,
    }));
  };

  const change = async (next: string | null) => {
    if (pending) return;
    const previous = acceptedId;
    setPending(true);
    apply(next);
    try {
      const result = next
        ? await feedApi.acceptAnswer(postId, next)
        : await feedApi.unacceptAnswer(postId);
      apply(result.acceptedCommentId);
    } catch {
      apply(previous);
      toast(texts.posts.comments.acceptError, "error");
    } finally {
      setPending(false);
    }
  };

  return {
    acceptedId,
    pending,
    accept: (commentId) => void change(commentId),
    unaccept: () => void change(null),
    // The backend reopens the question when its accepted comment is deleted.
    commentDeleted: (commentId) => {
      if (commentId === acceptedId) apply(null);
    },
  };
}
