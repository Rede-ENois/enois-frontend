import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";

import { createMentor as createMentorRequest } from "@/lib/api/mentors/create-mentor";

export function useRegisterMentorDialogController() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [skillsText, setSkillsText] = useState("");
  const [price, setPrice] = useState<string>(texts.mentoring.free);

  const createMentor = useMutation({
    mutationFn: () =>
      createMentorRequest({
        expertise: skillsText
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
        price: price || texts.mentoring.free,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setOpen(false);
      setSkillsText("");
      setPrice(texts.mentoring.free);
    },
  });

  return {
    open,
    setOpen,
    skillsText,
    setSkillsText,
    price,
    setPrice,
    saving: createMentor.isPending,
    saveDisabled: !skillsText.trim() || createMentor.isPending,
    save: () => createMentor.mutate(),
  };
}
