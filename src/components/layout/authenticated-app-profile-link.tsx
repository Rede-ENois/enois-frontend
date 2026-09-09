import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { useAuthenticatedAppProfileLinkController } from "@/utils/layout/use-authenticated-app-profile-link-controller";

import { UserAvatar } from "@/components/user-avatar";

export function AuthenticatedAppProfileLink() {
  const { profile } = useAuthenticatedAppProfileLinkController();

  if (!profile) return null;

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
