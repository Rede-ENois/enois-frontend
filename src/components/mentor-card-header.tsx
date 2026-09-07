import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { MentorCardHeaderProps } from "@/types/components/mentoring/mentor-card-header-props";

import { Button } from "@/components/ui/button";

import { UserAvatar } from "@/components/user-avatar";

export function MentorCardHeader({ mentorUserId, user, showSchedule }: MentorCardHeaderProps) {
  return (
    <header className="flex flex-wrap">
      <div className="md:col-span-3">
        <div className="flex h-full items-start justify-center overflow-hidden">
          <UserAvatar
            src={user?.avatar}
            alt={user?.name ?? texts.mentoring.mentorFallback}
            className="h-14 w-14 shrink-0"
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-hidden px-4 md:col-span-6">
        <Link
          to="/perfil/$username"
          params={{ username: user?.username ?? mentorUserId }}
          className="m-0 block truncate font-semibold hover:underline"
        >
          {user?.name ?? texts.mentoring.mentorFallback}
        </Link>

        <p className="line-clamp-2 text-xs text-muted-foreground">{user?.headline ?? ""}</p>
      </div>

      <div className="flex flex-col gap-4 text-[13px] md:col-span-3">
        {showSchedule && (
          <Button className="shrink-0 self-center rounded-lg bg-mentorship-button px-[14px] py-2">
            {texts.mentoring.schedule}
          </Button>
        )}
      </div>
    </header>
  );
}
