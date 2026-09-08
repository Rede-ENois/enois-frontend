import { EDIT_PROFILE_INFO_SWITCHES } from "@/constants/edit-profile-info-switches";
import { useEditProfileDialogContext } from "@/utils/components/profile/use-edit-profile-dialog-context";

export function useEditProfileInfoSwitchesController() {
  const { profileInfo } = useEditProfileDialogContext();
  const { values, setField } = profileInfo;

  return {
    items: EDIT_PROFILE_INFO_SWITCHES.map((item) => ({
      ...item,
      checked: values[item.field],
      setChecked: (checked: boolean) => setField(item.field, checked),
    })),
  };
}
