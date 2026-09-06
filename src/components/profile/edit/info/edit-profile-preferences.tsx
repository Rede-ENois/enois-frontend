import { texts } from "@/texts";
import type { EditProfilePreferencesProps } from "@/types/components/profile/edit/edit-profile-preferences-props";

import { Switch } from "@/components/ui/switch";

export function EditProfilePreferences({ values, onChange }: EditProfilePreferencesProps) {
  return (
    <div className="flex items-center gap-8">
      <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
        <Switch checked={values.openToWork} onCheckedChange={(value) => onChange("openToWork", value)} />
        {texts.profile.edit.openToWork}
      </label>
      <label className="flex items-center gap-3 text-[13px] font-light text-text-strong">
        <Switch checked={values.isMentor} onCheckedChange={(value) => onChange("isMentor", value)} />
        {texts.profile.edit.mentorAvailable}
      </label>
    </div>
  );
}
