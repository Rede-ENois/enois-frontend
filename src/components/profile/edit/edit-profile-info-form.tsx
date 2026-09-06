import type { EditProfileInfoFormProps } from "@/types/components/profile/edit/edit-profile-info-form-props";

import { EditProfileDiscoveryFields } from "./info/edit-profile-discovery-fields";
import { EditProfilePreferences } from "./info/edit-profile-preferences";
import { EditProfilePrimaryFields } from "./info/edit-profile-primary-fields";
import { EditProfileWorkFields } from "./info/edit-profile-work-fields";

export function EditProfileInfoForm({ values, usernameError, onChange }: EditProfileInfoFormProps) {
  return (
    <div className="space-y-5">
      <EditProfilePrimaryFields values={values} usernameError={usernameError} onChange={onChange} />
      <EditProfileWorkFields values={values} onChange={onChange} />
      <EditProfileDiscoveryFields values={values} onChange={onChange} />
      <EditProfilePreferences values={values} onChange={onChange} />
    </div>
  );
}
