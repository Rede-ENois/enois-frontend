import { texts } from "@/texts";
import type { Mentor } from "@/types/application/mentor/mentor";
import { useMentorCardProfile } from "@/utils/components/mentoring/use-mentor-card-profile";

export function useMentorCardController(mentor: Mentor) {
  const { user, isOwner } = useMentorCardProfile(mentor.userId);

  return {
    mentor,
    isOwner,
    avatar: user?.avatar ?? null,
    name: user?.name ?? texts.mentoring.mentorFallback,
    profileUsername: user?.username ?? mentor.userId,
    headline: user?.headline ?? "",
  };
}
