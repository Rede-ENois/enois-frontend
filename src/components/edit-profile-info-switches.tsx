import { useEditProfileInfoSwitchesController } from "@/utils/components/profile/use-edit-profile-info-switches-controller";

import { Switch } from "@/components/ui/switch";

export function EditProfileInfoSwitches() {
  const { items } = useEditProfileInfoSwitchesController();

  return (
    <div className="flex items-center gap-8">
      {items.map((item) => (
        <label
          key={item.key}
          className="flex items-center gap-3 text-[13px] font-light text-text-strong"
        >
          <Switch checked={item.checked} onCheckedChange={item.setChecked} />

          <>{item.label}</>
        </label>
      ))}
    </div>
  );
}
