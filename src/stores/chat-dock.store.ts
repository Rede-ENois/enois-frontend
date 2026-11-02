import type { ChatDockState } from "@/types/stores/chat-dock-state";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { MAX_OPEN_CHATS } from "@/lib/chat-dock/chat-dock-layout";

export const useChatDockStore = create<ChatDockState>()(
  persist(
    (set) => ({
      // Starts closed: the list opened by itself over the right column on the first visit.
      expanded: false,
      openChats: [],

      toggleExpanded: () => set((s) => ({ expanded: !s.expanded })),
      collapse: () => set((s) => ({ expanded: false })),
      expand: () => set((s) => ({ expanded: true })),

      /*
       * Abre (ou traz para a frente) a conversa.
       *
       * Traz para a FRENTE mesmo quando ela já estava aberta: o dock desenha só as janelas que
       * cabem na tela (ver `chat-dock-layout.ts`), então uma conversa que ficou fora do desenho
       * precisa poder voltar — clicar nela na lista tem de trazê-la para a frente, e não ser
       * ignorado. Sem isso, a conversa ficava marcada como aberta na lista sem janela e sem
       * botão de fechar (achado na revisão do PR #349).
       */
      openChat: (id: string) =>
        set((s) => ({
          openChats: [id, ...s.openChats.filter((c) => c !== id)].slice(0, MAX_OPEN_CHATS),
          expanded: false,
        })),

      closeChat: (id: string) => set((s) => ({ openChats: s.openChats.filter((c) => c !== id) })),
    }),
    {
      name: "enois-chat-dock",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ expanded: s.expanded, openChats: s.openChats }),
    },
  ),
);
