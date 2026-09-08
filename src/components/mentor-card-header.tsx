import type { MentorCardHeaderProps } from "@/types/components/mentoring/mentor-card-header-props";

import { MentorCardAvatar } from "@/components/mentor-card-avatar";
import { MentorCardIdentity } from "@/components/mentor-card-identity";
import { MentorCardScheduleAction } from "@/components/mentor-card-schedule-action";

export function MentorCardHeader({ mentorUserId, user, showSchedule }: MentorCardHeaderProps) {
  return (
    <header className="flex flex-wrap">
      <MentorCardAvatar user={user} />
      <MentorCardIdentity mentorUserId={mentorUserId} user={user} />
      <MentorCardScheduleAction visible={showSchedule} />
    </header>
  );
}
