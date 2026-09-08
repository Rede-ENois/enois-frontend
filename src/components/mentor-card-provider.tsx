import type { MentorCardProviderProps } from "@/types/components/mentoring/mentor-card-provider-props";
import { MentorCardContext } from "@/utils/components/mentoring/mentor-card-context";
import { useMentorCardProfile } from "@/utils/components/mentoring/use-mentor-card-profile";

import { MentorCard } from "@/components/mentor-card";

export function MentorCardProvider({ mentor }: MentorCardProviderProps) {
  const profile = useMentorCardProfile(mentor.userId);

  return (
    <MentorCardContext.Provider value={{ mentor, ...profile }}>
      <MentorCard />
    </MentorCardContext.Provider>
  );
}
