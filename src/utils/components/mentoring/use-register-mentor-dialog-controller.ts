import { createMentorInput } from "@/utils/components/mentoring/create-mentor-input";
import { useCreateMentor } from "@/utils/components/mentoring/use-create-mentor";
import { useRegisterMentorFormState } from "@/utils/components/mentoring/use-register-mentor-form-state";

export function useRegisterMentorDialogController() {
  const form = useRegisterMentorFormState();
  const create = useCreateMentor(createMentorInput(form.skillsText, form.price), form.reset);

  return {
    open: form.open,
    setOpen: form.setOpen,
    skillsText: form.skillsText,
    setSkillsText: form.setSkillsText,
    price: form.price,
    setPrice: form.setPrice,
    saving: create.saving,
    saveDisabled: !form.skillsText.trim() || create.saving,
    save: create.save,
  };
}
