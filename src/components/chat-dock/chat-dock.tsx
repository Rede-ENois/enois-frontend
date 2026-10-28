import { useEffect, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useChatDockStore } from "@/stores/chat-dock.store";
import { texts } from "@/texts";
import { ChevronDown, ChevronUp, MessageCircle, X } from "lucide-react";

import { messagesApi } from "@/lib/api";
import { janelasQueCabem } from "@/lib/chat-dock/chat-dock-layout";
import { useLarguraDaJanela } from "@/lib/chat-dock/use-largura-da-janela";
import { useCurrentUser } from "@/lib/current-user";
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
  const { data: currentUser } = useCurrentUser();
  const larguraDaJanela = useLarguraDaJanela();
  const expanded = useChatDockStore((s) => s.expanded);
  const openChats = useChatDockStore((s) => s.openChats);
  const toggleExpanded = useChatDockStore((s) => s.toggleExpanded);
  const openChat = useChatDockStore((s) => s.openChat);
  const closeChat = useChatDockStore((s) => s.closeChat);

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
    <div className="fixed bottom-0 right-4 z-50 hidden items-end gap-2 lg:flex">
      {/* Mini-janelas de conversas abertas */}
      {janelasVisiveis.map((id) => (
        <ChatDockWindow key={id} conversationId={id} />
      ))}

      {/* Painel principal: barra colapsada ou lista expandida */}
      <div className="flex flex-col">
        {expanded && (
          <div className="mb-0 flex h-[calc(100vh-8rem)] w-80 flex-col overflow-hidden rounded-t-2xl border border-border-soft bg-surface-card shadow-xl">
            {/* Header da lista */}
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
              <h3 className="text-sm font-medium text-text-strong">{texts.chatDock.title}</h3>

              <button
                type="button"
                onClick={toggleExpanded}
                className="grid h-7 w-7 place-items-center rounded-full text-text-subtle transition hover:bg-surface-2"
                aria-label={texts.chatDock.collapse}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Lista de conversas */}
            <ul className="flex-1 overflow-y-auto overscroll-contain">
              {conversations.length === 0 ? (
                <li className="px-4 py-12 text-center text-sm text-text-subtle">
                  {texts.chatDock.empty}
                </li>
              ) : (
                conversations.map((c) => (
                  <ConversationItem
                    key={c.id}
                    conversation={c}
                    isActive={openChats.includes(c.id)}
                    onSelect={() => handleSelectConversation(c.id)}
                  />
                ))
              )}

              {hasNextPage && (
                <li className="px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="text-xs text-primary transition hover:underline"
                  >
                    {isFetchingNextPage ? texts.chatDock.loadingMore : texts.chatDock.loadMore}
                  </button>
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Barra colapsada / toggle */}
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-label={texts.chatDock.title}
          className="flex w-80 items-center gap-3 rounded-t-2xl border border-border-soft bg-surface-card px-4 py-3 shadow-lg transition hover:bg-surface-2"
        >
          <MessageCircle className="h-5 w-5 text-primary" />

          <span className="flex-1 text-left text-sm font-medium text-text-strong">
            {texts.chatDock.title}
          </span>

          {totalUnread > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
              {totalUnread > 99 ? "99+" : totalUnread}
            </span>
          )}

          {expanded ? (
            <ChevronDown className="h-4 w-4 text-text-subtle" />
          ) : (
            <ChevronUp className="h-4 w-4 text-text-subtle" />
          )}
        </button>
      </div>
    </div>
  );
}
