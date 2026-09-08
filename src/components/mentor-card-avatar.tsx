import { texts } from "@/texts";
import type { MentorCardAvatarProps } from "@/types/components/mentoring/mentor-card-avatar-props";

import { UserAvatar } from "@/components/user-avatar";

export function MentorCardAvatar({ user }: MentorCardAvatarProps) {
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
