import { type FormEvent, useState } from "react";

import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { messagesApi, networkApi, profileApi } from "@/lib/api";
import { useAuth } from "@/lib/use-auth";
import { texts } from "@/texts";
import { getOtherParticipantId, sortByTime } from "@/utils/messages";

import { AppContainer } from "@/components/app-container";
import {
  MessageThread,
  MessagesSidebar,
  type ConversationWithUser,
} from "@/components/messages/messages-view";

export const Route = createFileRoute("/mensagens")({
  head: () => ({ meta: [{ title: texts.messages.seoTitle }] }),
  component: MessagesRoute,
});

function MessagesRoute() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [text, setText] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: conversationsData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations(),
    refetchInterval: 15_000,
  });

  const conversations = conversationsData?.items ?? [];
  const otherParticipantIds = conversations.map((conversation) =>
    getOtherParticipantId(conversation.participantIds, currentUser?.id),
  );
  const participantQueries = useQueries({
    queries: otherParticipantIds.map((participantId) => ({
      queryKey: ["profile", "by-id", participantId],
      queryFn: () => profileApi.getById(participantId ?? ""),
      enabled: Boolean(participantId),
      staleTime: 60_000,
    })),
  });

  const conversationItems: ConversationWithUser[] = conversations.map((conversation, index) => ({
    conversation,
    otherUser: participantQueries[index]?.data,
  }));
  const activeItem = activeId
    ? conversationItems.find(({ conversation }) => conversation.id === activeId)
    : undefined;
  const activeConversation = activeItem?.conversation ?? null;

  const { data: messagesData } = useQuery({
    queryKey: ["messages", activeConversation?.id],
    queryFn: () => messagesApi.listMessages(activeConversation!.id),
    enabled: Boolean(activeConversation),
    refetchInterval: 10_000,
  });

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => networkApi.list(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const filteredUsers = (searchResults?.items ?? []).filter((user) => user.id !== currentUser?.id);

  const sendMessage = useMutation({
    mutationFn: ({ conversationId, message }: { conversationId: string; message: string }) =>
      messagesApi.sendMessage(conversationId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = text.trim();
    if (!message || !activeConversation) return;
    sendMessage.mutate({ conversationId: activeConversation.id, message });
  };

  return (
    <AppContainer>
      <div className="surface-card grid h-[calc(100dvh-11rem)] grid-cols-1 overflow-hidden md:h-[calc(100vh-9rem)] md:grid-cols-[320px_1fr]">
        <MessagesSidebar
          conversations={conversationItems}
          activeId={activeId}
          currentUserId={currentUser?.id ?? ""}
          showSearch={showSearch}
          searchQuery={searchQuery}
          searchResults={filteredUsers}
          onToggleSearch={() => setShowSearch((value) => !value)}
          onSearchQueryChange={setSearchQuery}
          onCreateConversation={createConversation.mutate}
          onSelectConversation={(conversation) => {
            setActiveId(conversation.id);
            if (conversation.unread > 0) markAsRead.mutate(conversation.id);
          }}
        />

        <MessageThread
          conversation={activeConversation}
          otherUser={activeItem?.otherUser}
          currentUserId={currentUser?.id ?? ""}
          messages={sortByTime(messagesData?.items ?? [])}
          text={text}
          sending={sendMessage.isPending}
          onBack={() => setActiveId(null)}
          onTextChange={setText}
          onSubmit={handleSubmit}
        />
      </div>
    </AppContainer>
  );
}
