import { useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";

import { messageApi, networkApi, profileApi } from "@/lib/api";
import type { Conversation } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { getOtherParticipantId } from "@/utils/messages";

import type { ConversationViewModel } from "../conversation-view-model";

export function useConversationList() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isContactSearchVisible, setIsContactSearchVisible] = useState(false);

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messageApi.listConversations(),
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
  const conversationItems: ConversationViewModel[] = conversations.map((conversation, index) => ({
    conversation,
    otherUser: participantQueries[index]?.data,
  }));
  const activeConversationItem = activeConversationId
    ? conversationItems.find(({ conversation }) => conversation.id === activeConversationId)
    : undefined;

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => networkApi.listUsers(searchQuery),
    enabled: searchQuery.length > 0,
  });
  const filteredUsers = (searchResults?.items ?? []).filter((user) => user.id !== currentUser?.id);

  const createConversationMutation = useMutation({
    mutationFn: (participantId: string) =>
      messageApi.createConversation({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conversation) => {
      setActiveConversationId(conversation.id);
      setIsContactSearchVisible(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
  const markConversationReadMutation = useMutation({
    mutationFn: (conversationId: string) => messageApi.markConversationRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  const handleConversationSelect = (conversation: Conversation) => {
    setActiveConversationId(conversation.id);
    if (conversation.unread > 0) markConversationReadMutation.mutate(conversation.id);
  };

  return {
    conversationItems,
    activeConversationId,
    activeConversationItem,
    currentUserId: currentUser?.id ?? "",
    isContactSearchVisible,
    searchQuery,
    searchResults: filteredUsers,
    setSearchQuery,
    handleToggleContactSearch: () => setIsContactSearchVisible((isVisible) => !isVisible),
    createConversation: createConversationMutation.mutate,
    handleConversationSelect,
    clearActiveConversation: () => setActiveConversationId(null),
  };
}
