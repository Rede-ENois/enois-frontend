import type { Mentor } from "@/types/application/mentor/mentor";

export type MentoringPageContextValue = {
  mentors: Mentor[];
  scrollToMentors: () => void;
};
