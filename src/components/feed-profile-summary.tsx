import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";
import { texts } from "@/texts";

import { UserAvatar } from "@/components/user-avatar";

export function FeedProfileSummary() {
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentProfile,
  });

  if (!profile) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-card">
      <div className="h-14" style={{ background: "var(--gradient-primary)" }} />
      <div className="-mt-7 px-4 pb-4 text-center">
        <UserAvatar
          src={profile.avatar}
          alt={profile.name}
          className="mx-auto h-16 w-16 ring-4 ring-surface-card"
        />
        <Link
          to="/perfil/$username"
          params={{ username: profile.username }}
          className="mt-2 block text-[14px] font-light text-text-strong hover:underline"
        >
          {profile.name}
        </Link>
        <p className="line-clamp-2 text-[12px] font-light text-text-subtle">
          {profile.headline}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-1 border-t border-border-soft pt-3 text-[12px]">
          <div>
            <p className="font-light text-text-strong">{profile.connectionsCount}</p>
            <p className="text-text-subtle">{texts.feed.sidebar.connections}</p>
          </div>
          <div>
            <p className="font-light text-text-strong">{profile.followersCount}</p>
            <p className="text-text-subtle">{texts.feed.sidebar.followers}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
