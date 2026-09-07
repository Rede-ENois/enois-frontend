import { texts } from "@/texts";
import { UserPlus } from "lucide-react";

import { useFeedNetworkSuggestionsController } from "@/utils/components/feed/use-feed-network-suggestions-controller";

import { FeedNetworkSuggestionItem } from "@/components/feed-network-suggestion-item";

export function FeedNetworkSuggestions() {
  const { visible, items } = useFeedNetworkSuggestionsController();

  if (!visible) return null;

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
        {items.map((item) => (
          <FeedNetworkSuggestionItem key={item.user.id} {...item} />
        ))}
      </ul>
    </div>
  );
}
