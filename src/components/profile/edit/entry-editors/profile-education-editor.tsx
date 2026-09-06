import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Education, EducationInput } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileEntryList } from "../entry-list/profile-entry-list";
import { educationFields } from "./profile-entry-fields";

export function ProfileEducationEditor() {
  const { data: educationEntries = [] } = useQuery({
    queryKey: ["me", "education"],
    queryFn: () => profileApi.education.list(),
  });

  return (
    <ProfileEntryList<Education, EducationInput>
      entries={educationEntries}
      fields={educationFields}
      currentlyHereKey="currentlyHere"
      createEntry={profileApi.education.create}
      updateEntry={profileApi.education.update}
      removeEntry={profileApi.education.remove}
      queryKey={["me", "education"]}
      emptyMessage={texts.profile.edit.emptyEducation}
      newEntry={{
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
