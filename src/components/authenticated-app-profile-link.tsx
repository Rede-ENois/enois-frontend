import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { AuthenticatedAppProfileLinkProps } from "@/types/components/app/authenticated-app-profile-link-props";

import { UserAvatar } from "@/components/user-avatar";

export function AuthenticatedAppProfileLink({ profile }: AuthenticatedAppProfileLinkProps) {
  return (
    <Link
      to="/perfil/$username"
      params={{ username: profile.username }}
      className="flex items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-surface-2"
    >
      <UserAvatar src={profile.avatar} alt={profile.name} className="h-8 w-8" />

      <span className="hidden text-[13px] font-light text-text-strong sm:inline">
        {texts.common.profile}
      </span>
    </Link>
  );
}
