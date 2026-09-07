import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreatePostInput } from "@/types/application/feed/create-post-input";

import { createPost as createPostRequest } from "@/lib/api/feed/create-post";

export function useCreateFeedPost() {
  const queryClient = useQueryClient();
  const createPost = useMutation({
    mutationFn: (data: CreatePostInput) => createPostRequest(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  return {
    createPost: createPost.mutateAsync,
    createPending: createPost.isPending,
  };
}
