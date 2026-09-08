import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { MentorCardIdentityProps } from "@/types/components/mentoring/mentor-card-identity-props";

export function MentorCardIdentity({ mentorUserId, user }: MentorCardIdentityProps) {
  return (
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
  );
}
