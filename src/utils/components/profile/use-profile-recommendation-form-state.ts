import { useState } from "react";

export function useProfileRecommendationFormState() {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");

  return {
    open,
    setOpen,
    comment,
    setComment,
    reset: () => {
      setOpen(false);
      setComment("");
    },
  };
}
