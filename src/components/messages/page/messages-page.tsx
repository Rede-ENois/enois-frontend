import { AppContainer } from "@/components/app-container";
import { MessageThread } from "../message-thread";
import { MessagesSidebar } from "../messages-sidebar";
import { useConversationList } from "./use-conversation-list";
import { useMessageThreadState } from "./use-message-thread-state";

export function MessagesPage() {
  const conversations = useConversationList();
  const activeConversation = conversations.activeItem?.conversation ?? null;
  const thread = useMessageThreadState(activeConversation);

  return (
    <AppContainer>
      <div className="surface-card grid h-[calc(100dvh-11rem)] grid-cols-1 overflow-hidden md:h-[calc(100vh-9rem)] md:grid-cols-[320px_1fr]">
        <MessagesSidebar
          conversations={conversations.items}
          activeId={conversations.activeId}
          currentUserId={conversations.currentUserId}
          showSearch={conversations.showSearch}
          searchQuery={conversations.searchQuery}
          searchResults={conversations.searchResults}
          onToggleSearch={conversations.toggleSearch}
          onSearchQueryChange={conversations.setSearchQuery}
          onCreateConversation={conversations.createConversation}
          onSelectConversation={conversations.selectConversation}
        />
        <MessageThread
          conversation={activeConversation}
          otherUser={conversations.activeItem?.otherUser}
          currentUserId={conversations.currentUserId}
          messages={thread.messages}
          text={thread.text}
          sending={thread.sending}
          onBack={conversations.clearActive}
          onTextChange={thread.setText}
          onSubmit={thread.submit}
        />
      </div>
    </AppContainer>
  );
}
