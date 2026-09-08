import type { Education } from "@/types/application/profile/education";
import type { EducationRequest } from "@/types/application/profile/education-request";
import { useEditProfileEducationController } from "@/utils/components/profile/use-edit-profile-education-controller";

import { SubList } from "@/components/edit-profile-sub-list";

export function EditProfileEducation() {
  const props = useEditProfileEducationController();

  return <SubList<Education, EducationRequest> {...props} />;
}
