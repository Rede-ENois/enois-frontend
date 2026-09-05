import { useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { messagesApi, networkApi, profileApi } from "@/lib/api";
import type { Conversation } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { getOtherParticipantId } from "@/utils/messages";

import type { ConversationWithUser } from "../message-types";

export function useConversationList() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations(),
    refetchInterval: 15_000,
  });
  const conversations = conversationsData?.items ?? [];
  const participantIds = conversations.map((conversation) =>
    getOtherParticipantId(conversation.participantIds, currentUser?.id),
  );
  const participantQueries = useQueries({
    queries: participantIds.map((participantId) => ({
      queryKey: ["profile", "by-id", participantId],
      queryFn: () => profileApi.getById(participantId ?? ""),
      enabled: Boolean(participantId),
      staleTime: 60_000,
    })),
  });
  const items: ConversationWithUser[] = conversations.map((conversation, index) => ({
    conversation,
    otherUser: participantQueries[index]?.data,
  }));
  const activeItem = activeId ? items.find(({ conversation }) => conversation.id === activeId) : undefined;

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => networkApi.list(searchQuery),
    enabled: searchQuery.length > 0,
  });
  const filteredUsers = (searchResults?.items ?? []).filter((user) => user.id !== currentUser?.id);

  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      messagesApi.createConversation({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conversation) => {
      setActiveId(conversation.id);
      setShowSearch(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  const markAsRead = useMutation({
    mutationFn: (conversationId: string) => messagesApi.markAsRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  const selectConversation = (conversation: Conversation) => {
    setActiveId(conversation.id);
    if (conversation.unread > 0) markAsRead.mutate(conversation.id);
  };

  return {
    items,
    activeId,
    activeItem,
    currentUserId: currentUser?.id ?? "",
    showSearch,
    searchQuery,
    searchResults: filteredUsers,
    setSearchQuery,
    toggleSearch: () => setShowSearch((value) => !value),
    createConversation: createConversation.mutate,
    selectConversation,
    clearActive: () => setActiveId(null),
  };
}
