import { MentorCardAvatar } from "@/components/mentor-card-avatar";
import { MentorCardIdentity } from "@/components/mentor-card-identity";
import { MentorCardScheduleAction } from "@/components/mentor-card-schedule-action";

export function MentorCardHeader() {
  return (
    <header className="flex flex-wrap">
      <MentorCardAvatar />
      <MentorCardIdentity />
      <MentorCardScheduleAction />
    </header>
  );
}
