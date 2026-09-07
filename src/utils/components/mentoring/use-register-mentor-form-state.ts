import { useState } from "react";

import { texts } from "@/texts";

export function useRegisterMentorFormState() {
  const [open, setOpen] = useState(false);
  const [skillsText, setSkillsText] = useState("");
  const [price, setPrice] = useState<string>(texts.mentoring.free);

  return {
    open,
    setOpen,
    skillsText,
    setSkillsText,
    price,
    setPrice,
    reset: () => {
      setOpen(false);
      setSkillsText("");
      setPrice(texts.mentoring.free);
    },
  };
}
