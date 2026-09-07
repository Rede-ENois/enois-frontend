import type { Experience } from "@/types/application/profile/experience";
import type { ExperienceRequest } from "@/types/application/profile/experience-request";

import { useEditProfileExperiencesController } from "@/utils/components/profile/use-edit-profile-experiences-controller";

import { SubList } from "@/components/edit-profile-sub-list";

export function EditProfileExperiences() {
  const props = useEditProfileExperiencesController();

  return <SubList<Experience, ExperienceRequest> {...props} />;
}
