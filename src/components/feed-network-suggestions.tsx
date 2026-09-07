import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { UserPlus } from "lucide-react";

import { connectToUser } from "@/lib/api/network/connect-to-user";
import { listNetworkSuggestions } from "@/lib/api/network/list-network-suggestions";

import { UserAvatar } from "@/components/user-avatar";

export function FeedNetworkSuggestions() {
  const queryClient = useQueryClient();
  const { data: suggestions } = useQuery({
    queryKey: ["network", "suggestions"],
    queryFn: () => listNetworkSuggestions(4),
  });

  const suggestionList = suggestions ?? [];
  if (suggestionList.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />

        <h3 className="text-[14px] font-light text-text-strong">
          {texts.feed.sidebar.suggestions}
        </h3>
      </div>

      <p className="mt-0.5 text-[12px] font-light text-text-subtle">
        {texts.feed.sidebar.suggestionsDescription}
      </p>

      <ul className="mt-4 space-y-3">
        {suggestionList.map((user) => (
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
              onClick={() => {
                connectToUser(user.id).then(() =>
                  queryClient.invalidateQueries({ queryKey: ["network", "suggestions"] }),
                );
              }}
            >
              {texts.feed.sidebar.connect}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
