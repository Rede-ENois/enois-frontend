import type { Profile } from "@/types/application/profile/profile";
import { useEditProfileValues } from "@/utils/components/profile/use-edit-profile-values";
import { useUpdateProfileInfo } from "@/utils/components/profile/use-update-profile-info";

export function useEditProfileInfo(profile: Profile, onSaved: () => void) {
  const form = useEditProfileValues(profile);
  const update = useUpdateProfileInfo(profile, onSaved);

  const setUsername = (value: string) => {
    form.setField("username", value);
    update.clearUsernameError();
  };

  return {
    values: form.values,
    usernameError: update.usernameError,
    setField: form.setField,
    setUsername,
    save: () => update.save(form.values),
    isSaving: update.isSaving,
  };
}
