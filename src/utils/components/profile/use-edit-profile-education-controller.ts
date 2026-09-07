import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";

import { createEducation } from "@/lib/api/profile/education/create-education";
import { deleteEducation } from "@/lib/api/profile/education/delete-education";
import { listEducation } from "@/lib/api/profile/education/list-education";
import { updateEducation } from "@/lib/api/profile/education/update-education";

export function useEditProfileEducationController() {
  const { data: items = [] } = useQuery({
    queryKey: ["me", "education"],
    queryFn: listEducation,
  });

  return {
    items,
    fields: [
      { key: "school", label: texts.profile.edit.educationFields.school, required: true },
      { key: "degree", label: texts.profile.edit.educationFields.degree, required: true },
      { key: "field", label: texts.profile.edit.educationFields.field },
      {
        key: "description",
        label: texts.profile.edit.educationFields.description,
        multiline: true,
      },
      { key: "startDate", label: texts.profile.edit.educationFields.startDate, type: "date" },
      { key: "endDate", label: texts.profile.edit.educationFields.endDate, type: "date" },
    ],
    currentlyHereKey: "currentlyHere",
    createApi: createEducation,
    updateApi: updateEducation,
    deleteApi: deleteEducation,
    queryKey: ["me", "education"],
    emptyMessage: texts.profile.edit.emptyEducation,
    newItem: {
      school: "",
      degree: "",
      field: "",
      description: "",
      startDate: "",
      endDate: "",
    },
  } as const;
}
