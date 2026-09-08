import { texts } from "@/texts";
import { useMentorCardContext } from "@/utils/components/mentoring/use-mentor-card-context";

import { UserAvatar } from "@/components/user-avatar";

export function MentorCardAvatar() {
  const { user } = useMentorCardContext();

  return (
    <div className="md:col-span-3">
      <div className="flex h-full items-start justify-center overflow-hidden">
        <UserAvatar
          src={user?.avatar}
          alt={user?.name ?? texts.mentoring.mentorFallback}
          className="h-14 w-14 shrink-0"
        />
      </div>
    </div>
  );
}
