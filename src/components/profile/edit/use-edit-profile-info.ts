import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { ApiError, profileApi } from "@/lib/api";
import type { Profile, UpdateProfileInput } from "@/lib/api";
import { texts } from "@/texts";
import { buildProfileUpdate } from "@/utils/profile";

import type { EditProfileInfoValues } from "./edit-profile-info-types";

function getInitialValues(profile: Profile): EditProfileInfoValues {
  return {
    username: profile.username,
    name: profile.name,
    headline: profile.headline ?? "",
    bio: profile.bio ?? "",
    company: profile.company ?? "",
    location: profile.location ?? "",
    availability: profile.availability ?? "",
    portfolio: profile.portfolio ?? "",
    linksText: (profile.externalLinks ?? []).join("\n"),
    skillsText: (profile.skills ?? []).join(", "),
    goalsText: (profile.goals ?? []).join(", "),
    openToWork: profile.openToWork,
    isMentor: profile.isMentor,
  };
}

export function useEditProfileInfo(profile: Profile, onSaved: () => void) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [usernameError, setUsernameError] = useState("");
  const [values, setValues] = useState<EditProfileInfoValues>(() => getInitialValues(profile));

  const updateProfileMutation = useMutation({
    mutationFn: (input: UpdateProfileInput) => profileApi.updateCurrent(input),
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });
      if (updatedProfile.username && updatedProfile.username !== profile.username) {
        queryClient.invalidateQueries({ queryKey: ["profile", updatedProfile.username] });
        router.navigate({
          to: "/perfil/$username",
          params: { username: updatedProfile.username },
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

  const handleChange = <K extends keyof EditProfileInfoValues>(
    field: K,
    value: EditProfileInfoValues[K],
  ) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    if (field === "username") setUsernameError("");
  };

  const handleSave = async () => {
    setUsernameError("");
    await updateProfileMutation.mutateAsync(buildProfileUpdate(profile, values));
  };

  return {
    values,
    usernameError,
    handleChange,
    handleSave,
    isSaving: updateProfileMutation.isPending,
  };
}
