export type MessagesStore = {
  activeConversationId: string | null;
  newConversationSearchOpen: boolean;
  newConversationSearchQuery: string;
  selectConversation: (conversationId: string) => void;
  clearConversation: () => void;
  toggleNewConversationSearch: () => void;
  closeNewConversationSearch: () => void;
  setNewConversationSearchQuery: (query: string) => void;
};
