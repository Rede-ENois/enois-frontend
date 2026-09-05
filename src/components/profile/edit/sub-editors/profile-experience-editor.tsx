import { useQuery } from "@tanstack/react-query";

import { profileApi } from "@/lib/api";
import type { Experience } from "@/lib/api";
import { texts } from "@/texts";

import { ProfileSubList } from "../sub-list/profile-sub-list";
import { experienceFields } from "./profile-sub-fields";

type ExperienceRequest = Parameters<typeof profileApi.experiences.create>[0];

export function ProfileExperienceEditor() {
  const { data: items = [] } = useQuery({ queryKey: ["me", "experiences"], queryFn: () => profileApi.experiences.list() });

  return (
    <ProfileSubList<Experience, ExperienceRequest>
      items={items}
      fields={experienceFields}
      currentlyHereKey="currentlyHere"
      createApi={profileApi.experiences.create}
      updateApi={profileApi.experiences.update}
      deleteApi={profileApi.experiences.delete}
      queryKey={["me", "experiences"]}
      emptyMessage={texts.profile.edit.emptyExperience}
      newItem={{ title: "", company: "", location: "", description: "", startDate: "", endDate: "" }}
    />
  );
}
