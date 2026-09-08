import { Link } from "@tanstack/react-router";

import { useMentorCardContext } from "@/utils/components/mentoring/use-mentor-card-context";

export function MentorCardIdentity() {
  const { profileUsername, name, headline } = useMentorCardContext();

  return (
    <div className="flex-1 space-y-4 overflow-hidden px-4 md:col-span-6">
      <Link
        to="/perfil/$username"
        params={{ username: profileUsername }}
        className="m-0 block truncate font-semibold hover:underline"
      >
        {name}
      </Link>

      <p className="line-clamp-2 text-xs text-muted-foreground">{headline}</p>
    </div>
  );
}
