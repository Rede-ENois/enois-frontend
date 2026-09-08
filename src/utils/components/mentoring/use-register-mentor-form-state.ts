import { useState } from "react";

import { texts } from "@/texts";

export function useRegisterMentorFormState() {
  const [skillsText, setSkillsText] = useState("");
  const [price, setPrice] = useState<string>(texts.mentoring.free);

  return {
    skillsText,
    setSkillsText,
    price,
    setPrice,
    reset: () => {
      setSkillsText("");
      setPrice(texts.mentoring.free);
    },
  };
}
