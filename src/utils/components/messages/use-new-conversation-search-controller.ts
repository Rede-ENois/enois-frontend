import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { NewConversationSearchProps } from "@/types/components/messages/new-conversation-search-props";

import { createConversation as createConversationRequest } from "@/lib/api/messages/create-conversation";
import { listNetworkUsers } from "@/lib/api/network";
import { getCurrentUserId } from "@/lib/get-current-user-id";

export function useNewConversationSearchController({
  onSelect,
  onClose,
}: NewConversationSearchProps) {
  const currentUserId = getCurrentUserId();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => listNetworkUsers(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const users = (searchResults?.items ?? []).filter((user) => user.id !== currentUserId);

  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      createConversationRequest({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conversation) => {
      onSelect(conversation.id);
      onClose();
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return {
    searchQuery,
    setSearchQuery,
    showResults: Boolean(searchQuery),
    showEmptyState: Boolean(searchQuery) && users.length === 0,
    users: users.map((user) => ({
      ...user,
      select: () => createConversation.mutate(user.id),
    })),
  };
}
