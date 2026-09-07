import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { Profile } from "@/types/application/profile/profile";
import type { UpdateProfileRequest } from "@/types/application/profile/update-profile-request";

import { updateProfile as updateProfileRequest } from "@/lib/api/profile/update-profile";

export function useProfileMediaUpdater(user: Profile) {
  const queryClient = useQueryClient();
  const updateProfile = useMutation({
    mutationFn: (data: Pick<UpdateProfileRequest, "avatar" | "banner">) =>
      updateProfileRequest(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user.username] });
    },
  });

  return updateProfile.mutateAsync;
}
