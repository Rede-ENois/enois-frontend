import type { Conversation, NetworkUser } from "@/lib/api";
import type { ConversationViewModel } from "./conversation-view-model";

export type MessageSidebarProps = {
  conversations: ConversationViewModel[];
  activeConversationId: string | null;
  currentUserId: string;
  isContactSearchVisible: boolean;
  searchQuery: string;
  searchResults: NetworkUser[];
  onToggleSearch: () => void;
  onSearchQueryChange: (value: string) => void;
  onCreateConversation: (userId: string) => void;
  onSelectConversation: (conversation: Conversation) => void;
};
