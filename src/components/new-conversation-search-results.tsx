import { useMessagesStore } from "@/stores/messages.store";
import { texts } from "@/texts";
import { useConversationSearchResults } from "@/utils/components/messages/use-conversation-search-results";

import { NewConversationSearchResultItem } from "@/components/new-conversation-search-result-item";

export function NewConversationSearchResults() {
  const query = useMessagesStore((state) => state.newConversationSearchQuery);
  const users = useConversationSearchResults(query);
  const visible = Boolean(query);

  if (!visible) return null;

  return (
    <div className="space-y-1">
      {users.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{texts.messages.noContact}</p>
      ) : (
        users.map((user) => <NewConversationSearchResultItem key={user.id} user={user} />)
      )}
    </div>
  );
}
