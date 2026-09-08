import { NewConversationSearchInput } from "@/components/new-conversation-search-input";
import { NewConversationSearchResults } from "@/components/new-conversation-search-results";

export function NewConversationSearch() {
  return (
    <div className="space-y-3">
      <NewConversationSearchInput />
      <NewConversationSearchResults />
    </div>
  );
}
