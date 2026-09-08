import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useCommunityEditDialogStore } from "@/stores/community-edit-dialog.store";
import type { Community } from "@/types/application/community/community";
import { buildCommunityUpdateRequest } from "@/utils/components/communities/build-community-update-request";

import { updateCommunity as updateCommunityRequest } from "@/lib/api/communities/update-community";

export function useUpdateCommunityController(
  community: Community,
  form: { name: string; description: string; cover: string; avatar: string },
) {
  const queryClient = useQueryClient();
  const close = useCommunityEditDialogStore((state) => state.close);
  const update = useMutation({
    mutationFn: () =>
      updateCommunityRequest(community.id, buildCommunityUpdateRequest(community, form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community", community.id] });
      close();
    },
  });

  return {
    pending: update.isPending,
    save: () => update.mutate(),
  };
}
