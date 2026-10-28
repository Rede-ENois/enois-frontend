import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useChatDockStore } from "@/stores/chat-dock.store";
import { ChatDock as ChatDockView } from "@rede-enois/design-system/domain";

import { messagesApi } from "@/lib/api";
import { janelasQueCabem } from "@/lib/chat-dock/chat-dock-layout";
import { useLarguraDaJanela } from "@/lib/chat-dock/use-largura-da-janela";
import { hasSession } from "@/lib/require-auth";
import { useIsAuthenticated } from "@/lib/use-auth";

import { ConversationItem } from "@/components/messages/conversation-item";

import { ChatDockWindow } from "./chat-dock-window";

/**
 * Dock de mensagens flutuante — fixed no canto inferior direito, presente em
 * todas as paginas desktop. So renderiza quando ha sessao ativa.
 *
 * 3 estados visuais:
 * 1. Barra colapsada (icone + badge de nao-lidas)
 * 2. Lista de conversas (painel expandido)
 * 3. Mini-janelas de conversa aberta (ao lado da barra/lista)
 */
export function ChatDock() {
  const authenticated = useIsAuthenticated();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  if (!hydrated || !authenticated || !hasSession()) return null;

  return <ChatDockInner />;
}

function ChatDockInner() {
  const queryClient = useQueryClient();
  const larguraDaJanela = useLarguraDaJanela();
  const expanded = useChatDockStore((s) => s.expanded);
  const openChats = useChatDockStore((s) => s.openChats);
  const toggleExpanded = useChatDockStore((s) => s.toggleExpanded);
  const openChat = useChatDockStore((s) => s.openChat);

  const {
    data: conversationsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["conversations", "inbox"],
    queryFn: ({ pageParam }) => messagesApi.listConversations(pageParam, 20),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    staleTime: 120_000,
  });

  const { data: unreadData } = useQuery({
    queryKey: ["conversations", "unread-count"],
    queryFn: () => messagesApi.unreadCount(),
    staleTime: 120_000,
  });

  const markAsRead = useMutation({
    mutationFn: (id: string) => messagesApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const conversations = [...(conversationsData?.pages.flatMap((p) => p.items) ?? [])].sort(
    (a, b) => {
      if (!a.time || !b.time) return 0;
      return new Date(b.time).getTime() - new Date(a.time).getTime();
    },
  );

  const totalUnread = unreadData?.count ?? 0;

  /*
   * O dock e ancorado a direita e cresce para a ESQUERDA: cada mini-janela tem 22rem. Se abrirem
   * mais janelas do que cabem, a mais a esquerda sai da tela (medido em 2026-10-28: a 1024px com
   * 2 janelas a primeira comeca em -32px; a 1280px com 4, em -496px) e o botao de fechar dela
   * fica fora do alcance. Aqui so se desenha o que cabe — a conversa continua aberta no estado.
   */
  const janelasVisiveis = openChats.slice(0, janelasQueCabem(larguraDaJanela, openChats.length));

  const handleSelectConversation = (id: string) => {
    openChat(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv && conv.unread > 0) markAsRead.mutate(id);
  };

  return (
    <ChatDockView
      expanded={expanded}
      onToggleExpanded={toggleExpanded}
      unreadCount={totalUnread}
      windows={janelasVisiveis.map((id) => (
        <ChatDockWindow key={id} conversationId={id} />
      ))}
      empty={conversations.length === 0}
      hasMore={hasNextPage}
      loadingMore={isFetchingNextPage}
      onLoadMore={() => fetchNextPage()}
    >
      {conversations.map((c) => (
        <ConversationItem
          key={c.id}
          conversation={c}
          isActive={openChats.includes(c.id)}
          onSelect={() => handleSelectConversation(c.id)}
        />
      ))}
    </ChatDockView>
  );
}
