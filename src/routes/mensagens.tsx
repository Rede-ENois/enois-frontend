import { type FormEvent, useEffect, useRef, useState } from "react";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { ConversationHeaderProps } from "@/types/routes/messages/conversation-header-props";
import type { ConversationItemProps } from "@/types/routes/messages/conversation-item-props";
import type { SendMessageInput } from "@/types/routes/messages/send-message-input";
import { ArrowLeft, Search, Send } from "lucide-react";

import { messagesApi, networkApi, profileApi } from "@/lib/api";
import { getCurrentUserId } from "@/lib/current-user";
import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { AppContainer } from "@/components/app-container";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UserAvatar } from "@/components/user-avatar";
import { UserBadge } from "@/components/user-badge";

export const Route = createFileRoute("/mensagens")({
  beforeLoad: requireAuth,
  // Permite abrir direto numa conversa (ex.: botao "Mensagem" do perfil passa o id).
  validateSearch: (search: Record<string, unknown>): { conversation?: string } => ({
    conversation: typeof search.conversation === "string" ? search.conversation : undefined,
  }),
  head: () => ({
    meta: buildPageShareTags({ title: texts.messages.seoTitle, path: "/mensagens" }),
  }),
  component: Mensagens,
});

function Mensagens() {
  const { conversation } = Route.useSearch();
  const currentUserId = getCurrentUserId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [text, setText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [inboxTab, setInboxTab] = useState<"all" | "jobs" | "people">("all");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Veio de um link/perfil com uma conversa: abre ela direto.
  useEffect(() => {
    if (conversation) setActiveId(conversation);
  }, [conversation]);

  // Paginado por cursor: a primeira pagina so traz as mais recentes — sem carregar as anteriores
  // (muitas vindas de vaga) as conversas/mensagens antigas ficavam inalcancaveis.
  const {
    data: conversationsData,
    fetchNextPage: fetchMoreConversations,
    hasNextPage: hasMoreConversations,
    isFetchingNextPage: isLoadingMoreConversations,
  } = useInfiniteQuery({
    queryKey: ["conversations"],
    queryFn: ({ pageParam }) => messagesApi.listConversations(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    refetchInterval: 15_000,
  });

  const conversations = conversationsData?.pages.flatMap((page) => page.items) ?? [];
  // Separa a caixa de entrada: conversas de vaga (candidatura) x conversas com pessoas.
  const visibleConversations = conversations.filter((c) =>
    inboxTab === "all" ? true : inboxTab === "jobs" ? c.kind === "JOB" : c.kind !== "JOB",
  );
  const activeConversation = activeId ? conversations.find((c) => c.id === activeId) : null;

  const {
    data: messagesData,
    fetchNextPage: fetchOlderMessages,
    hasNextPage: hasOlderMessages,
    isFetchingNextPage: isLoadingOlder,
  } = useInfiniteQuery({
    queryKey: ["messages", activeConversation?.id],
    queryFn: ({ pageParam }) => messagesApi.listMessages(activeConversation!.id, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!activeConversation,
    refetchInterval: 10_000,
  });

  const messages = (messagesData?.pages.flatMap((page) => page.items) ?? []).sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  const { data: searchResults } = useQuery({
    queryKey: ["network", "users", searchQuery],
    queryFn: () => networkApi.list(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const filteredUsers = (searchResults?.items ?? []).filter((u) => u.id !== currentUserId);

  const sendMessage = useMutation({
    mutationFn: ({ conversationId, text }: SendMessageInput) =>
      messagesApi.sendMessage(conversationId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", activeConversation?.id] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setText("");
    },
  });

  const createConversation = useMutation({
    mutationFn: (participantId: string) =>
      messagesApi.createConversation({ kind: "DIRECT", participantIds: [participantId] }),
    onSuccess: (conv) => {
      setActiveId(conv.id);
      setShowSearch(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const hideSelected = useMutation({
    mutationFn: () => messagesApi.hideConversations(Array.from(selected)),
    onSuccess: () => {
      setConfirmDelete(false);
      setSelecting(false);
      setSelected(new Set());
      toast(texts.messages.deleted);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast(texts.communities.actionError, "error"),
  });

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const markAsRead = useMutation({
    mutationFn: (conversationId: string) => messagesApi.markAsRead(conversationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || !activeConversation) return;
    sendMessage.mutate({ conversationId: activeConversation.id, text: content });
  };

  // Campo de mensagem cresce com o texto (teto 128px) e volta a 1 linha ao enviar.
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = messageInputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  const activeMessages = activeConversation ? messages : [];

  const otherParticipantId = activeConversation?.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherParticipantId],
    queryFn: () => profileApi.getById(otherParticipantId ?? ""),
    enabled: !!otherParticipantId,
  });

  // Rola para o fim quando chega mensagem nova — mas NAO quando o usuario carrega mensagens
  // antigas (senao a lista salta para o fim e ele perde o ponto em que estava lendo).
  const newestMessageId =
    activeMessages.length > 0 ? activeMessages[activeMessages.length - 1].id : null;
  const lastScrolledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!newestMessageId || lastScrolledRef.current === newestMessageId) return;
    lastScrolledRef.current = newestMessageId;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [newestMessageId]);

  return (
    <AppContainer>
      {/* `dvh` nos dois tamanhos: `100vh` no desktop é o valor que não encolhe quando a barra
          do navegador aparece no celular, e aí o compositor ficava escondido atrás do teclado. */}
      <div className="surface-card grid h-[calc(100dvh-11rem)] grid-cols-1 overflow-hidden md:h-[calc(100dvh-9rem)] md:grid-cols-[320px_1fr]">
        <div
          className={`flex min-h-0 flex-col border-r border-border ${activeConversation ? "hidden md:flex" : "flex"}`}
        >
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-lg font-semibold">{texts.messages.title}</h1>

              <div className="flex gap-2">
                {!selecting && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => setSelecting(true)}
                  >
                    {texts.messages.selectMode}
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  {showSearch ? texts.messages.back : texts.messages.new}
                </Button>
              </div>
            </div>
            {showSearch ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={texts.messages.searchContacts}
                    className="h-9 rounded-full bg-muted pl-9"
                    autoFocus
                  />
                </div>
                {searchQuery && (
                  <div className="space-y-1">
                    {filteredUsers.length === 0 ? (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        {texts.messages.noContact}
                      </p>
                    ) : (
                      filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => createConversation.mutate(u.id)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted"
                        >
                          <UserAvatar src={u.avatar} alt={u.name} className="h-10 w-10" />

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{u.name}</p>

                            <p className="truncate text-xs text-muted-foreground">{u.headline}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={texts.messages.searchConversations}
                  className="h-9 rounded-full bg-muted pl-9"
                />
              </div>
            )}
          </div>

          <div className="flex gap-1 border-b border-border px-3 pb-2">
            {(["all", "jobs", "people"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setInboxTab(tab)}
                className={`rounded-full px-3 py-1 text-xs font-normal transition ${
                  inboxTab === tab
                    ? "bg-primary-soft text-primary"
                    : "text-text-subtle hover:bg-surface-2"
                }`}
              >
                {texts.messages.tabs[tab]}
              </button>
            ))}
          </div>

          {selecting && (
            <div className="flex flex-wrap items-center gap-2 border-b border-border bg-surface-2 px-3 py-2">
              <button
                type="button"
                className="text-xs font-normal text-primary hover:underline"
                onClick={() =>
                  setSelected(
                    selected.size === visibleConversations.length
                      ? new Set()
                      : new Set(visibleConversations.map((c) => c.id)),
                  )
                }
              >
                {selected.size === visibleConversations.length
                  ? texts.messages.clearSelection
                  : texts.messages.selectAll}
              </button>

              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setSelecting(false);
                    setSelected(new Set());
                  }}
                >
                  {texts.messages.cancelSelection}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  className="rounded-full"
                  disabled={selected.size === 0 || hideSelected.isPending}
                  onClick={() => setConfirmDelete(true)}
                >
                  {texts.messages.deleteSelected(selected.size)}
                </Button>
              </div>
            </div>
          )}

          <ul className="flex-1 overflow-y-auto overscroll-contain">
            {visibleConversations.length === 0 ? (
              <li className="p-4 text-center text-sm text-muted-foreground">
                {texts.messages.noConversations}
              </li>
            ) : (
              visibleConversations.map((c) => (
                <ConversationItem
                  key={c.id}
                  conversation={c}
                  isActive={c.id === (activeConversation?.id ?? "")}
                  selecting={selecting}
                  selected={selected.has(c.id)}
                  onToggle={() => toggleSelected(c.id)}
                  onSelect={() => {
                    if (selecting) {
                      toggleSelected(c.id);
                      return;
                    }
                    setActiveId(c.id);
                    if (c.unread > 0) markAsRead.mutate(c.id);
                  }}
                />
              ))
            )}

            {hasMoreConversations && (
              <li className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full rounded-full text-xs"
                  disabled={isLoadingMoreConversations}
                  onClick={() => fetchMoreConversations()}
                >
                  {isLoadingMoreConversations
                    ? texts.messages.loadingOlder
                    : texts.messages.loadMoreConversations}
                </Button>
              </li>
            )}
          </ul>
        </div>

        <div className={`flex min-h-0 flex-col ${!activeConversation ? "hidden md:flex" : "flex"}`}>
          {!activeConversation ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">{texts.messages.selectConversation}</p>
            </div>
          ) : (
            <>
              <ConversationHeader
                conversation={activeConversation}
                onBack={() => setActiveId(null)}
              />

              <div className="flex-1 overflow-y-auto overscroll-contain bg-muted/30 p-5">
                {hasOlderMessages && (
                  <div className="mb-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs"
                      disabled={isLoadingOlder}
                      onClick={() => fetchOlderMessages()}
                    >
                      {isLoadingOlder
                        ? texts.messages.loadingOlder
                        : texts.messages.loadOlderMessages}
                    </Button>
                  </div>
                )}
                <div className="space-y-3">
                  {activeMessages.length === 0 ? (
                    <p className="py-16 text-center text-sm text-muted-foreground">
                      {texts.messages.noMessages}
                    </p>
                  ) : (
                    activeMessages.map((m) => {
                      const isMe = m.from === currentUserId;
                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <Link
                              to="/perfil/$username"
                              params={{ username: otherUser?.username ?? otherParticipantId ?? "" }}
                            >
                              <span className="relative mb-1 inline-block">
                                <UserAvatar
                                  src={otherUser?.avatar}
                                  alt={otherUser?.name}
                                  className="h-7 w-7 shrink-0"
                                />

                                <UserBadge
                                  badge={otherUser?.badge}
                                  className="absolute -bottom-0.5 -right-0.5 h-3 w-3 ring-1 ring-card"
                                />
                              </span>
                            </Link>
                          )}
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMe
                                ? "rounded-br-md bg-primary text-primary-foreground"
                                : "rounded-bl-md bg-card text-foreground"
                            }`}
                          >
                            <p className="break-words">{m.text}</p>

                            <p
                              className={`mt-1 text-xs ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                            >
                              {formatTime(m.time)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex items-end gap-2 border-t border-border p-3"
              >
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter envia; Shift+Enter quebra linha (padrao de chat).
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                    }
                  }}
                  ref={messageInputRef}
                  rows={1}
                  placeholder={texts.messages.inputPlaceholder}
                  className="max-h-32 min-h-[40px] w-full resize-none rounded-2xl bg-muted px-4 py-2.5 text-sm outline-none"
                />

                <button
                  type="submit"
                  disabled={!text.trim() || sendMessage.isPending}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={texts.messages.deleteTitle}
        description={texts.messages.deleteDescription}
        confirmLabel={texts.messages.deleteConfirm}
        destructive
        pending={hideSelected.isPending}
        onConfirm={() => hideSelected.mutate()}
      />
    </AppContainer>
  );
}

function ConversationItem({ conversation, isActive, onSelect, selecting, selected, onToggle }: ConversationItemProps) {
  const currentUserId = getCurrentUserId();
  const otherId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: !!otherId,
  });

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;

  return (
    <li>
      <button
        onClick={onSelect}
        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
          selected ? "bg-primary-soft" : isActive ? "bg-primary-soft" : "hover:bg-muted"
        }`}
      >
        {selecting && (
          <span
            aria-hidden
            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
              selected ? "border-primary bg-primary text-primary-foreground" : "border-border-soft"
            }`}
          >
            {selected ? "✓" : ""}
          </span>
        )}
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherId ?? "" }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-11 w-11 shrink-0" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">{title}</span>

              <UserBadge badge={otherUser?.badge} />
            </span>

            <span className="text-xs text-muted-foreground shrink-0 ml-2">
              {conversation.time ? formatTime(conversation.time) : ""}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-muted-foreground">
              {conversation.lastMessage ?? ""}
            </p>
            {conversation.unread > 0 && (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                {conversation.unread}
              </span>
            )}
          </div>
        </div>
      </button>
    </li>
  );
}

function ConversationHeader({ conversation, onBack }: ConversationHeaderProps) {
  const currentUserId = getCurrentUserId();
  const otherId = conversation.participantIds.find((id) => id !== currentUserId);
  const { data: otherUser } = useQuery({
    queryKey: ["profile", "by-id", otherId],
    queryFn: () => profileApi.getById(otherId ?? ""),
    enabled: !!otherId,
  });

  const title = conversation.title ?? otherUser?.name ?? texts.messages.conversationFallback;

  return (
    <header className="flex items-center gap-3 border-b border-border p-4">
      <div className="flex items-center gap-3 min-w-0">
        {onBack && (
          <button
            onClick={onBack}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <Link to="/perfil/$username" params={{ username: otherUser?.username ?? otherId ?? "" }}>
          <UserAvatar src={otherUser?.avatar} alt={title} className="h-10 w-10 shrink-0" />
        </Link>

        <div className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-semibold">{title}</span>

            <UserBadge badge={otherUser?.badge} />
          </span>
          {otherUser?.headline && (
            <p className="truncate text-xs text-muted-foreground">{otherUser.headline}</p>
          )}
        </div>
      </div>
    </header>
  );
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return texts.time.now;
  if (diffMin < 60) return texts.time.minutesAgo(diffMin);
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return texts.time.hoursAgo(diffH);
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return texts.time.daysAgo(diffD);
  return date.toLocaleDateString("pt-BR");
}
