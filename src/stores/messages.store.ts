import { create } from "zustand";

import { MESSAGES_INITIAL_STATE } from "@/constants/components/messages/messages-initial-state";
import type { MessagesStore } from "@/types/stores/messages-store";

export const useMessagesStore = create<MessagesStore>()((set) => ({
  ...MESSAGES_INITIAL_STATE,
  selectConversation: (activeConversationId) =>
    set({ activeConversationId, newConversationSearchOpen: false, newConversationSearchQuery: "" }),
  clearConversation: () => set({ activeConversationId: null }),
  toggleNewConversationSearch: () =>
    set((state) => ({
      newConversationSearchOpen: !state.newConversationSearchOpen,
      newConversationSearchQuery: "",
    })),
  closeNewConversationSearch: () =>
    set({ newConversationSearchOpen: false, newConversationSearchQuery: "" }),
  setNewConversationSearchQuery: (newConversationSearchQuery) => set({ newConversationSearchQuery }),
}));
