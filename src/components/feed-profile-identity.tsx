import { Link } from "@tanstack/react-router";

import { useFeedProfileSummaryContext } from "@/utils/components/feed/use-feed-profile-summary-context";

import { UserAvatar } from "@/components/user-avatar";

export function FeedProfileIdentity() {
  const { profile } = useFeedProfileSummaryContext();

  return (
    <>
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

      <p className="line-clamp-2 text-[12px] font-light text-text-subtle">{profile.headline}</p>
    </>
  );
}
