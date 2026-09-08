import { useContext } from "react";

import { MentorCardContext } from "@/utils/components/mentoring/mentor-card-context";

export function useMentorCardContext() {
  const context = useContext(MentorCardContext);

  if (!context) {
    throw new Error("Mentor card components must be rendered inside MentorCardProvider");
  }

  return context;
}
