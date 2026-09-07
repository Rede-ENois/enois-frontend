import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";
import type { EditProfileValues } from "@/types/components/profile/edit-profile-values";

import { ApiError } from "@/lib/api-client";
import { updateProfile as updateProfileRequest } from "@/lib/api/profile/update-profile";

export function useEditProfileInfo(profile: Profile, onSaved: () => void) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [values, setValues] = useState<EditProfileValues>({
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
  });
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

  const setField = <K extends keyof EditProfileValues>(key: K, value: EditProfileValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const setUsername = (value: string) => {
    setField("username", value);
    setUsernameError("");
  };

  const save = async () => {
    setUsernameError("");
    await updateProfile.mutateAsync({
      username: values.username !== profile.username ? values.username : undefined,
      name: values.name !== profile.name ? values.name : undefined,
      headline: values.headline || null,
      bio: values.bio || null,
      company: values.company || null,
      location: values.location || null,
      availability: values.availability || null,
      portfolio: values.portfolio || null,
      externalLinks: values.linksText
        ? values.linksText
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      skills: values.skillsText
        ? values.skillsText
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      goals: values.goalsText
        ? values.goalsText
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
      openToWork: values.openToWork,
      isMentor: values.isMentor,
    });
  };

  return {
    values,
    usernameError,
    setField,
    setUsername,
    save,
    isSaving: updateProfile.isPending,
  };
}
