import { EDIT_PROFILE_INFO_SWITCHES } from "@/constants/edit-profile-info-switches";
import { useEditProfileDialogContext } from "@/utils/components/profile/use-edit-profile-dialog-context";

import { Switch } from "@/components/ui/switch";

export function EditProfileInfoSwitches() {
  const { profileInfo } = useEditProfileDialogContext();
  const { values, setField } = profileInfo;

  return (
    <div className="flex items-center gap-8">
      {EDIT_PROFILE_INFO_SWITCHES.map((item) => (
        <label
          key={item.key}
          className="flex items-center gap-3 text-[13px] font-light text-text-strong"
        >
          <Switch
            checked={values[item.field]}
            onCheckedChange={(checked) => setField(item.field, checked)}
          />

          <>{item.label}</>
        </label>
      ))}
    </div>
  );
}
