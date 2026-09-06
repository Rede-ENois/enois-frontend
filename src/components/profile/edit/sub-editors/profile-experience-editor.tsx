import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Experience, ExperienceInput } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileSubList } from "../sub-list/profile-sub-list";
import { experienceFields } from "./profile-sub-fields";

export function ProfileExperienceEditor() {
  const { data: experiences = [] } = useQuery({
    queryKey: ["me", "experiences"],
    queryFn: () => profileApi.experiences.list(),
  });

  return (
    <ProfileSubList<Experience, ExperienceInput>
      items={experiences}
      fields={experienceFields}
      currentlyHereKey="currentlyHere"
      createApi={profileApi.experiences.create}
      updateApi={profileApi.experiences.update}
      removeApi={profileApi.experiences.remove}
      queryKey={["me", "experiences"]}
      emptyMessage={texts.profile.edit.emptyExperience}
      newItem={{ title: "", company: "", location: "", description: "", startDate: "", endDate: "" }}
    />
  );
}
