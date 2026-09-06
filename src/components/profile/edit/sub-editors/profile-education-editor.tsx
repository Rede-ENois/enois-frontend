import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Education, EducationInput } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileSubList } from "../sub-list/profile-sub-list";
import { educationFields } from "./profile-sub-fields";

export function ProfileEducationEditor() {
  const { data: educationItems = [] } = useQuery({
    queryKey: ["me", "education"],
    queryFn: () => profileApi.education.list(),
  });

  return (
    <ProfileSubList<Education, EducationInput>
      items={educationItems}
      fields={educationFields}
      currentlyHereKey="currentlyHere"
      createApi={profileApi.education.create}
      updateApi={profileApi.education.update}
      removeApi={profileApi.education.remove}
      queryKey={["me", "education"]}
      emptyMessage={texts.profile.edit.emptyEducation}
      newItem={{
        school: "",
        degree: "",
        field: "",
        description: "",
        startDate: "",
        endDate: "",
      }}
    />
  );
}
