import { useState } from "react";

import type { Profile } from "@/types/application/profile/profile";
import type { EditProfileValues } from "@/types/components/profile/edit-profile-values";
import { createEditProfileValues } from "@/utils/components/profile/create-edit-profile-values";

export function useEditProfileValues(profile: Profile) {
  const [values, setValues] = useState<EditProfileValues>(() => createEditProfileValues(profile));

  const setField = <K extends keyof EditProfileValues>(key: K, value: EditProfileValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  return { values, setField };
}
