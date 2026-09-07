import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { FeedNetworkSuggestionItemProps } from "@/types/components/feed/feed-network-suggestion-item-props";

import { UserAvatar } from "@/components/user-avatar";

export function FeedNetworkSuggestionItem({ user, connect }: FeedNetworkSuggestionItemProps) {
  return (
    <li className="flex items-center gap-3">
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
        onClick={connect}
      >
        {texts.feed.sidebar.connect}
      </button>
    </li>
  );
}
