import type { EditProfileDialogBodyProps } from "@/types/components/profile/edit-profile-dialog/edit-profile-dialog-body-props";

import { EditProfileCertifications } from "@/components/edit-profile-certifications";
import { EditProfileEducation } from "@/components/edit-profile-education";
import { EditProfileExperiences } from "@/components/edit-profile-experiences";
import { EditProfileInfoForm } from "@/components/edit-profile-info-form";

export function EditProfileDialogBody({ activeTab, profileInfo }: EditProfileDialogBodyProps) {
  return (
    <div className="space-y-6 px-6 pb-6 pt-4">
      {activeTab === "info" && <EditProfileInfoForm {...profileInfo} />}
      {activeTab === "experiences" && <EditProfileExperiences />}
      {activeTab === "education" && <EditProfileEducation />}
      {activeTab === "certifications" && <EditProfileCertifications />}
    </div>
  );
}
