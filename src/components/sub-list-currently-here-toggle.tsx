import { texts } from "@/texts";
import type { SubListCurrentlyHereToggleProps } from "@/types/components/profile/edit-profile-dialog/sub-list-currently-here-toggle-props";

import { Switch } from "@/components/ui/switch";

export function SubListCurrentlyHereToggle({
  checked,
  onCheckedChange,
}: SubListCurrentlyHereToggleProps) {
  return (
    <label className="flex items-center gap-2 text-[13px] font-light text-text-strong">
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
      <>{texts.profile.edit.currentlyHere}</>
    </label>
  );
}
