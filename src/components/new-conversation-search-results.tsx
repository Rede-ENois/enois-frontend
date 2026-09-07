import { texts } from "@/texts";
import type { NewConversationSearchResultsProps } from "@/types/components/messages/new-conversation-search-results-props";

import { NewConversationSearchResultItem } from "@/components/new-conversation-search-result-item";

export function NewConversationSearchResults({
  visible,
  showEmptyState,
  users,
}: NewConversationSearchResultsProps) {
  if (!visible) return null;

  return (
    <div className="space-y-1">
      {showEmptyState ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{texts.messages.noContact}</p>
      ) : (
        users.map((user) => <NewConversationSearchResultItem key={user.id} user={user} />)
      )}
    </div>
  );
}
