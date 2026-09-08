import { useContext } from "react";

import { MentoringPageContext } from "@/utils/components/mentoring/mentoring-page-context";

export function useMentoringPageContext() {
  const context = useContext(MentoringPageContext);

  if (!context) {
    throw new Error("Mentoring page components must be rendered inside MentoringPageProvider");
  }

  return context;
}
