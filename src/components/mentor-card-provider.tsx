import type { MentorCardProviderProps } from "@/types/components/mentoring/mentor-card-provider-props";
import { MentorCardContext } from "@/utils/components/mentoring/mentor-card-context";
import { useMentorCardController } from "@/utils/components/mentoring/use-mentor-card-controller";

import { MentorCard } from "@/components/mentor-card";

export function MentorCardProvider({ mentor }: MentorCardProviderProps) {
  const view = useMentorCardController(mentor);

  return (
    <MentorCardContext.Provider value={view}>
      <MentorCard />
    </MentorCardContext.Provider>
  );
}
