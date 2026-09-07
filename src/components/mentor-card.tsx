import type { MentorCardProps } from "@/types/components/mentoring/mentor-card-props";

import { useMentorCardProfile } from "@/utils/components/mentoring/use-mentor-card-profile";

import { MentorCardExpertise } from "@/components/mentor-card-expertise";
import { MentorCardHeader } from "@/components/mentor-card-header";
import { MentorCardStats } from "@/components/mentor-card-stats";

export function MentorCard({ mentor }: MentorCardProps) {
  const { user, isOwner } = useMentorCardProfile(mentor.userId);

  return (
    <article className="surface-card mx-auto w-full max-w-5xl space-y-4 p-5">
      <MentorCardHeader mentorUserId={mentor.userId} user={user} showSchedule={!isOwner} />
      <MentorCardExpertise expertise={mentor.expertise} />
      <MentorCardStats mentor={mentor} />
    </article>
  );
}
