import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Education } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileSubList } from "../sub-list/profile-sub-list";
import { educationFields } from "./profile-sub-fields";

type EducationRequest = Parameters<typeof profileApi.education.create>[0];

export function ProfileEducationEditor() {
  const { data: items = [] } = useQuery({
    queryKey: ["me", "education"],
    queryFn: () => profileApi.education.list(),
  });

  return (
    <ProfileSubList<Education, EducationRequest>
      items={items}
      fields={educationFields}
      currentlyHereKey="currentlyHere"
      createApi={profileApi.education.create}
      updateApi={profileApi.education.update}
      deleteApi={profileApi.education.delete}
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
