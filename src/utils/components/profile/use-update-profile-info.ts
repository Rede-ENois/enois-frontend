import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";
import type { EditProfileValues } from "@/types/components/profile/edit-profile-values";

import { ApiError } from "@/lib/api-client";
import { updateProfile as updateProfileRequest } from "@/lib/api/profile/update-profile";

import { buildProfileUpdateRequest } from "@/utils/components/profile/build-profile-update-request";

export function useUpdateProfileInfo(profile: Profile, onSaved: () => void) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [usernameError, setUsernameError] = useState("");
  const updateProfile = useMutation({
    mutationFn: updateProfileRequest,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
      if (updated.username && updated.username !== profile.username) {
        queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
        router.navigate({
          to: "/perfil/$username",
          params: { username: updated.username },
          replace: true,
        });
      }
      onSaved();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setUsernameError(texts.profile.edit.usernameTaken);
      }
    },
  });

  return {
    usernameError,
    clearUsernameError: () => setUsernameError(""),
    save: async (values: EditProfileValues) => {
      setUsernameError("");
      await updateProfile.mutateAsync(buildProfileUpdateRequest(profile, values));
    },
    isSaving: updateProfile.isPending,
  };
}
