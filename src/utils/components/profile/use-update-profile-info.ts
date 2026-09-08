import { useMutation } from "@tanstack/react-query";

import type { Profile } from "@/types/application/profile/profile";
import type { EditProfileValues } from "@/types/components/profile/edit-profile-values";
import { buildProfileUpdateRequest } from "@/utils/components/profile/build-profile-update-request";
import { useProfileUpdateSuccess } from "@/utils/components/profile/use-profile-update-success";
import { useProfileUsernameError } from "@/utils/components/profile/use-profile-username-error";

import { updateProfile as updateProfileRequest } from "@/lib/api/profile/update-profile";

export function useUpdateProfileInfo(profile: Profile, onSaved: () => void) {
  const username = useProfileUsernameError();
  const handleSuccess = useProfileUpdateSuccess(profile, onSaved);
  const updateProfile = useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: handleSuccess,
    onError: username.handleProfileUpdateError,
  });

  return {
    usernameError: username.usernameError,
    clearUsernameError: username.clearUsernameError,
    save: async (values: EditProfileValues) => {
      username.clearUsernameError();
      await updateProfile.mutateAsync(buildProfileUpdateRequest(profile, values));
    },
    isSaving: updateProfile.isPending,
  };
}
