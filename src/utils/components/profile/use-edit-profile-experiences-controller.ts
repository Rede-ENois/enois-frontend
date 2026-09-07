import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Experience } from "@/types/application/profile/experience";
import type { ExperienceRequest } from "@/types/application/profile/experience-request";
import type { SubListProps } from "@/types/components/profile/edit-profile-dialog/sub-list-props";

import { createExperience } from "@/lib/api/profile/experiences/create-experience";
import { deleteExperience } from "@/lib/api/profile/experiences/delete-experience";
import { listExperiences } from "@/lib/api/profile/experiences/list-experiences";
import { updateExperience } from "@/lib/api/profile/experiences/update-experience";

export function useEditProfileExperiencesController() {
  const { data: items = [] } = useQuery({
    queryKey: ["me", "experiences"],
    queryFn: listExperiences,
  });

  const props: SubListProps<Experience, ExperienceRequest> = {
    items,
    fields: [
      { key: "title", label: texts.profile.edit.experienceFields.title, required: true },
      { key: "company", label: texts.profile.edit.experienceFields.company, required: true },
      { key: "location", label: texts.profile.edit.experienceFields.location },
      {
        key: "description",
        label: texts.profile.edit.experienceFields.description,
        multiline: true,
      },
      { key: "startDate", label: texts.profile.edit.experienceFields.startDate, type: "date" },
      { key: "endDate", label: texts.profile.edit.experienceFields.endDate, type: "date" },
    ],
    currentlyHereKey: "currentlyHere",
    createApi: createExperience,
    updateApi: updateExperience,
    deleteApi: deleteExperience,
    queryKey: ["me", "experiences"],
    emptyMessage: texts.profile.edit.emptyExperience,
    newItem: {
      title: "",
      company: "",
      location: "",
      description: "",
      startDate: "",
      endDate: "",
    },
  };

  return props;
}
