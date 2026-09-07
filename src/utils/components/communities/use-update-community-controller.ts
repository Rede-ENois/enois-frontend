import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Community } from "@/types/application/community/community";

import { updateCommunity as updateCommunityRequest } from "@/lib/api/communities/update-community";

import { buildCommunityUpdateRequest } from "@/utils/components/communities/build-community-update-request";

export function useUpdateCommunityController(
  community: Community,
  form: { name: string; description: string; cover: string; avatar: string },
  onClose: () => void,
) {
  const queryClient = useQueryClient();
  const update = useMutation({
    mutationFn: () => updateCommunityRequest(community.id, buildCommunityUpdateRequest(community, form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id] });
      onClose();
    },
  });

  return {
    pending: update.isPending,
    save: () => update.mutate(),
  };
}
