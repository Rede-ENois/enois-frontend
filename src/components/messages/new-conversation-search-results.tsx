import { texts } from "@/texts";
import { useNewConversationSearchResultsController } from "@/utils/messages/use-new-conversation-search-results-controller";

import { NewConversationSearchResultItem } from "@/components/messages/new-conversation-search-result-item";

export function NewConversationSearchResults() {
  const { visible, users, showEmptyState } = useNewConversationSearchResultsController();

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
