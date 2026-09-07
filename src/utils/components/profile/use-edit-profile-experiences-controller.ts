import { texts } from "@/texts";

import { createExperience } from "@/lib/api/profile/experiences/create-experience";
import { deleteExperience } from "@/lib/api/profile/experiences/delete-experience";
import { listExperiences } from "@/lib/api/profile/experiences/list-experiences";
import { updateExperience } from "@/lib/api/profile/experiences/update-experience";
import { useProfileSubListController } from "@/utils/components/profile/use-profile-sub-list-controller";

export function useEditProfileExperiencesController() {
  return useProfileSubListController(["me", "experiences"], listExperiences, {
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
    emptyMessage: texts.profile.edit.emptyExperience,
    newItem: {
      title: "",
      company: "",
      location: "",
      description: "",
      startDate: "",
      endDate: "",
    },
  });
}
