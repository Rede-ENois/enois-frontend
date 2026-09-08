import type { ChangeEvent } from "react";

import { texts } from "@/texts";
import { createMentorInput } from "@/utils/components/mentoring/create-mentor-input";
import { useCreateMentor } from "@/utils/components/mentoring/use-create-mentor";
import { useRegisterMentorFormState } from "@/utils/components/mentoring/use-register-mentor-form-state";

export function useRegisterMentorFormController(onCreated: () => void) {
  const form = useRegisterMentorFormState();
  const create = useCreateMentor(createMentorInput(form.skillsText, form.price), () => {
    form.reset();
    onCreated();
  });

  const handleSkillsChange = (event: ChangeEvent<HTMLInputElement>) => {
    form.setSkillsText(event.target.value);
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    form.setPrice(event.target.value);
  };

  return {
    fields: [
      {
        key: "skills",
        label: texts.mentoring.expertise,
        value: form.skillsText,
        onChange: handleSkillsChange,
        placeholder: texts.mentoring.expertisePlaceholder,
      },
      {
        key: "price",
        label: texts.mentoring.investment,
        value: form.price,
        onChange: handlePriceChange,
        placeholder: texts.mentoring.free,
      },
    ],
    saving: create.saving,
    saveDisabled: !form.skillsText.trim() || create.saving,
    save: create.save,
  };
}
