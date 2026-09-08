import type { EditProfileInfoFormProps } from "@/types/components/profile/edit-profile-info-form-props";

import { EditProfileInfoFields } from "@/components/edit-profile-info-fields";
import { EditProfileInfoSwitches } from "@/components/edit-profile-info-switches";

export function EditProfileInfoForm(props: EditProfileInfoFormProps) {
  return (
    <div className="space-y-5">
      <EditProfileInfoFields {...props} />
      <EditProfileInfoSwitches values={props.values} setField={props.setField} />
    </div>
  );
}
