import { AppContainer } from "@/components/app-container";
import { MessageThread } from "../message-thread";
import { MessageSidebar } from "../message-sidebar";
import { useConversationList } from "./use-conversation-list";
import { useMessageThreadState } from "./use-message-thread-state";

export function MessagesPage() {
  const conversationState = useConversationList();
  const activeConversation = conversationState.activeConversationItem?.conversation ?? null;
  const threadState = useMessageThreadState(activeConversation);

  return (
    <AppContainer>
      <div className="surface-card grid h-[calc(100dvh-11rem)] grid-cols-1 overflow-hidden md:h-[calc(100vh-9rem)] md:grid-cols-[320px_1fr]">
        <MessageSidebar
          conversations={conversationState.conversationItems}
          activeConversationId={conversationState.activeConversationId}
          currentUserId={conversationState.currentUserId}
          isContactSearchVisible={conversationState.isContactSearchVisible}
          searchQuery={conversationState.searchQuery}
          searchResults={conversationState.searchResults}
          onToggleSearch={conversationState.handleToggleContactSearch}
          onSearchQueryChange={conversationState.setSearchQuery}
          onCreateConversation={conversationState.createConversation}
          onSelectConversation={conversationState.handleConversationSelect}
        />
        <MessageThread
          conversation={activeConversation}
          otherUser={conversationState.activeConversationItem?.otherUser}
          currentUserId={conversationState.currentUserId}
          messages={threadState.messages}
          messageText={threadState.messageText}
          isSending={threadState.isSending}
          onBack={conversationState.clearActiveConversation}
          onTextChange={threadState.setMessageText}
          onSubmit={threadState.handleSubmit}
        />
      </div>
    </AppContainer>
  );
}
