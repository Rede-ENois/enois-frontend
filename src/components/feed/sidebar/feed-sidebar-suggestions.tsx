import { Link } from "@tanstack/react-router";

import { UserPlus } from "lucide-react";

import { texts } from "@/texts";
import type { FeedSidebarSuggestionsProps } from "@/types/components/feed/feed-sidebar-suggestions-props";

import { UserAvatar } from "@/components/user-avatar";

export function FeedSidebarSuggestions({
  suggestions,
  onConnectSuggestion,
}: FeedSidebarSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
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
              onClick={() => onConnectSuggestion(user.id)}
            >
              {texts.feed.sidebar.connect}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
