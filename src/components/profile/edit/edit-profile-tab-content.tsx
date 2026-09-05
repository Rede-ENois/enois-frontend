import { EditProfileInfoForm } from "./edit-profile-info-form";
import type { EditProfileInfoChange, EditProfileInfoValues } from "./edit-profile-info-types";
import type { EditProfileTab } from "./edit-profile-shell";
import { ProfileCertificationEditor } from "./sub-editors/profile-certification-editor";
import { ProfileEducationEditor } from "./sub-editors/profile-education-editor";
import { ProfileExperienceEditor } from "./sub-editors/profile-experience-editor";

export function EditProfileTabContent({ tab, values, usernameError, onChange }: {
  tab: EditProfileTab;
  values: EditProfileInfoValues;
  usernameError: string;
  onChange: EditProfileInfoChange;
}) {
  if (tab === "info") {
    return <EditProfileInfoForm values={values} usernameError={usernameError} onChange={onChange} />;
  }
  if (tab === "experiences") return <ProfileExperienceEditor />;
  if (tab === "education") return <ProfileEducationEditor />;
  return <ProfileCertificationEditor />;
}
