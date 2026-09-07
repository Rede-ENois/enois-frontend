import { useState } from "react";

import type { NewConversationSearchProps } from "@/types/components/messages/new-conversation-search-props";

import { createNewConversationSearchViewModel } from "@/utils/components/messages/create-new-conversation-search-view-model";
import { useConversationSearchResults } from "@/utils/components/messages/use-conversation-search-results";
import { useCreateDirectConversation } from "@/utils/components/messages/use-create-direct-conversation";

export function useNewConversationSearchController(props: NewConversationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const users = useConversationSearchResults(searchQuery);
  const createConversation = useCreateDirectConversation(props, () => setSearchQuery(""));
  const view = createNewConversationSearchViewModel(searchQuery, users, createConversation);

  return {
    searchQuery,
    setSearchQuery,
    ...view,
  };
}
