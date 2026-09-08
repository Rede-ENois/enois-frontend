import { useMentorCardContext } from "@/utils/components/mentoring/use-mentor-card-context";

import { UserAvatar } from "@/components/user-avatar";

export function MentorCardAvatar() {
  const { avatar, name } = useMentorCardContext();

  return (
    <div className="md:col-span-3">
      <div className="flex h-full items-start justify-center overflow-hidden">
        <UserAvatar src={avatar} alt={name} className="h-14 w-14 shrink-0" />
      </div>
    </div>
  );
}
