import { texts } from "@/texts";
import type { EditProfileInfoFormProps } from "@/types/components/profile/edit-profile-info-form-props";

import { Switch } from "@/components/ui/switch";

export function EditProfileInfoSwitches({
  values,
  setField,
}: Pick<EditProfileInfoFormProps, "values" | "setField">) {
  const switches = [
    {
      key: "open-to-work",
      label: texts.profile.edit.openToWork,
      checked: values.openToWork,
      onChange: (checked: boolean) => setField("openToWork", checked),
    },
    {
      key: "mentor",
      label: texts.profile.edit.mentorAvailable,
      checked: values.isMentor,
      onChange: (checked: boolean) => setField("isMentor", checked),
    },
  ];

  return (
    <div className="flex items-center gap-8">
      {switches.map((item) => (
        <label
          key={item.key}
          className="flex items-center gap-3 text-[13px] font-light text-text-strong"
        >
          <Switch checked={item.checked} onCheckedChange={item.onChange} />

          <>{item.label}</>
        </label>
      ))}
    </div>
  );
}
