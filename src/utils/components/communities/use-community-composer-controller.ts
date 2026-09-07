import { type FormEvent, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { createPost } from "@/lib/api/feed/create-post";

export function useCommunityComposerController(communityId: string) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const createPostMutation = useMutation({
    mutationFn: (content: string) => createPost({ type: "INSIGHT", content, communityId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", communityId, "feed"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      setDraft("");
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const content = draft.trim();
    if (content) createPostMutation.mutate(content);
  };

  return {
    draft,
    setDraft,
    submit,
    publishing: createPostMutation.isPending,
    publishDisabled: !draft.trim() || createPostMutation.isPending,
  };
}
