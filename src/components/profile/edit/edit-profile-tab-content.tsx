import type { EditProfileTabContentProps } from "@/types/components/profile/edit/edit-profile-tab-content-props";

import { EditProfileInfoForm } from "./edit-profile-info-form";
import { ProfileCertificationEditor } from "./entry-editors/profile-certification-editor";
import { ProfileEducationEditor } from "./entry-editors/profile-education-editor";
import { ProfileExperienceEditor } from "./entry-editors/profile-experience-editor";

export function EditProfileTabContent({ tab, values, usernameError, onChange }: EditProfileTabContentProps) {
  if (tab === "info") {
    return <EditProfileInfoForm values={values} usernameError={usernameError} onChange={onChange} />;
  }
  if (tab === "experiences") return <ProfileExperienceEditor />;
  if (tab === "education") return <ProfileEducationEditor />;
  return <ProfileCertificationEditor />;
}
