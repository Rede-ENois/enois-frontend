import type { NewConversationSearchProps } from "@/types/components/messages/new-conversation-search-props";

import { useNewConversationSearchController } from "@/utils/components/messages/use-new-conversation-search-controller";

import { NewConversationSearchInput } from "@/components/new-conversation-search-input";
import { NewConversationSearchResults } from "@/components/new-conversation-search-results";

export function NewConversationSearch(props: NewConversationSearchProps) {
  const search = useNewConversationSearchController(props);

  return (
    <div className="space-y-3">
      <NewConversationSearchInput query={search.searchQuery} onQueryChange={search.setSearchQuery} />
      <NewConversationSearchResults
        visible={search.showResults}
        showEmptyState={search.showEmptyState}
        users={search.users}
      />
    </div>
  );
}
