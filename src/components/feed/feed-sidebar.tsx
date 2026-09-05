import { Link } from "@tanstack/react-router";

import { TrendingUp, UserPlus } from "lucide-react";

import type { Event, NetworkUser, Profile } from "@/lib/api";
import { texts } from "@/texts";

import { UserAvatar } from "@/components/user-avatar";

type FeedSidebarProps = {
  profile: Profile | null | undefined;
  suggestions: NetworkUser[];
  events: Event[];
  onConnect: (userId: string) => void;
};

export function FeedSidebar({ profile, suggestions, events, onConnect }: FeedSidebarProps) {
  return (
    <aside className="sticky top-20 hidden max-h-[calc(100vh-6rem)] space-y-4 overflow-y-auto lg:block">
      {profile && (
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
                <p className="font-light text-text-strong">{profile.connectionsCount ?? 0}</p>
                <p className="text-text-subtle">{texts.feed.sidebar.connections}</p>
              </div>
              <div>
                <p className="font-light text-text-strong">{profile.followersCount ?? 0}</p>
                <p className="text-text-subtle">{texts.feed.sidebar.followers}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <h3 className="text-[14px] font-light text-text-strong">{texts.feed.sidebar.suggestions}</h3>
          </div>
          <p className="mt-0.5 text-[12px] font-light text-text-subtle">
            {texts.feed.sidebar.suggestionsDescription}
          </p>
          <ul className="mt-4 space-y-3">
            {suggestions.map((user) => (
              <li key={user.id} className="flex items-center gap-3">
                <UserAvatar src={user.avatar} alt={user.name} className="h-10 w-10" />
                <div className="min-w-0 flex-1">
                  <Link
                    to="/perfil/$username"
                    params={{ username: user.username }}
                    className="block truncate text-[13px] font-light text-text-strong hover:underline"
                  >
                    {user.name}
                  </Link>
                  <p className="truncate text-[11px] font-light text-text-subtle">{user.headline}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-border-soft px-3 py-1 text-[12px] font-light text-text-subtle transition hover:border-primary hover:text-primary"
                  onClick={() => onConnect(user.id)}
                >
                  {texts.feed.sidebar.connect}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {events.length > 0 && (
        <div className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-[14px] font-light text-text-strong">
              {texts.feed.sidebar.happeningNow}
            </h3>
          </div>
          <ul className="mt-3 space-y-3">
            {events.slice(0, 3).map((event) => (
              <li key={event.id}>
                <p className="text-[13px] font-light text-text-strong">{event.title}</p>
                <p className="text-[11px] font-light text-text-subtle">
                  {event.date} · {event.format} · {texts.feed.sidebar.confirmed(event.attendees)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
