import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateCommunityInput } from "@/types/application/community/create-community-input";

import { createCommunity as createCommunityRequest } from "@/lib/api/communities/create-community";

export function useCreateCommunity(form: CreateCommunityInput, onCreated: () => void) {
  const queryClient = useQueryClient();
  const create = useMutation({
    mutationFn: () => createCommunityRequest(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      onCreated();
    },
  });

  return {
    createCommunity: () => create.mutate(),
    createPending: create.isPending,
  };
}
