import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Experience, ExperienceInput } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileEntryList } from "../entry-list/profile-entry-list";
import { experienceFields } from "./profile-entry-fields";

export function ProfileExperienceEditor() {
  const { data: experiences = [] } = useQuery({
    queryKey: ["me", "experiences"],
    queryFn: () => profileApi.experiences.list(),
  });

  return (
    <ProfileEntryList<Experience, ExperienceInput>
      entries={experiences}
      fields={experienceFields}
      currentlyHereKey="currentlyHere"
      createEntry={profileApi.experiences.create}
      updateEntry={profileApi.experiences.update}
      removeEntry={profileApi.experiences.remove}
      queryKey={["me", "experiences"]}
      emptyMessage={texts.profile.edit.emptyExperience}
      newEntry={{ title: "", company: "", location: "", description: "", startDate: "", endDate: "" }}
    />
  );
}
